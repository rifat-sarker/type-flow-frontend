"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import type { Socket } from "socket.io-client";
import { getSocket } from "@/lib/socket";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { getGuestId } from "@/lib/guest";
import { useTypingEngine } from "@/lib/useTypingEngine";
import { codeFromKeyboardEvent } from "@/lib/fingerMap";
import { WordDisplay } from "@/components/TypingTest/WordDisplay";
import { TextSize, getStoredTextSize } from "@/lib/textSize";
import { PlayerProgressBar } from "./PlayerProgressBar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { RaceRecord, RaceParticipant } from "@/types";

type RaceStatus = "waiting" | "countdown" | "active" | "finished";

interface RaceTrackProps {
  code: string;
}

const GUEST_NAME_KEY = "typeflow_guest_name";

export function RaceTrack({ code }: RaceTrackProps) {
  const { user, loading } = useAuth();

  const [race, setRace] = useState<RaceRecord | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [status, setStatus] = useState<RaceStatus>("waiting");
  const [participants, setParticipants] = useState<RaceParticipant[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [standings, setStandings] = useState<RaceParticipant[] | null>(null);
  const [spectatorCount, setSpectatorCount] = useState(0);
  const [isSpectator, setIsSpectator] = useState(false);
  const [chat, setChat] = useState<{ username: string; text: string; spectator: boolean; ts: number }[]>([]);
  const [chatDraft, setChatDraft] = useState("");

  const socketRef = useRef<Socket | null>(null);
  const finishedSentRef = useRef(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [pressedCode, setPressedCode] = useState<string | null>(null);
  const [pressId, setPressId] = useState(0);

  const [guestName, setGuestName] = useState<string | null>(null);
  const [guestNameDraft, setGuestNameDraft] = useState("");
  const [textSize, setTextSize] = useState<TextSize>("md");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(GUEST_NAME_KEY);
      if (saved) setGuestName(saved);
    } catch {
      /* ignore */
    }
    setTextSize(getStoredTextSize());
  }, []);

  const joinAsGuest = useCallback((name: string) => {
    const trimmed = name.trim().slice(0, 20);
    if (!trimmed) return;
    setGuestName(trimmed);
    try {
      localStorage.setItem(GUEST_NAME_KEY, trimmed);
    } catch {
      /* ignore */
    }
  }, []);

  // A logged-in user races under their account; otherwise a guest can join with
  // just a display name (tracked by a per-browser id, no account required).
  const identity = useMemo(() => {
    if (user) return { id: user.id, username: user.username, isGuest: false };
    if (guestName) return { id: getGuestId(), username: guestName, isGuest: true };
    return null;
  }, [user, guestName]);

  const engine = useTypingEngine([]);
  const { typeChar, backspace, finish, sampleWpm, computeFinishStats, reset } = engine;

  // load race metadata + text once
  useEffect(() => {
    api
      .get<{ race: RaceRecord }>(`/api/races/${code}`)
      .then((data) => {
        setRace(data.race);
        setStatus(data.race.status);
        reset(data.race.text);
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Race not found"));
  }, [code, reset]);

  // connect + join the socket room
  useEffect(() => {
    if (!identity || !race) return;
    const socket = getSocket();
    socketRef.current = socket;

    socket.emit("race:join", { code, userId: identity.id, username: identity.username });

    function onUpdate(data: { status: RaceStatus; participants: RaceParticipant[]; spectatorCount: number }) {
      setStatus(data.status);
      setParticipants(data.participants);
      setSpectatorCount(data.spectatorCount ?? 0);
    }
    function onCountdown(n: number) {
      setStatus("countdown");
      setCountdown(n);
    }
    function onGo() {
      setStatus("active");
      setCountdown(null);
    }
    function onFinished(final: RaceParticipant[]) {
      setStatus("finished");
      setStandings(final);
    }
    function onError(msg: string) {
      setLoadError(msg);
    }
    function onRole(data: { spectator: boolean }) {
      setIsSpectator(data.spectator);
    }
    function onChat(msg: { username: string; text: string; spectator: boolean; ts: number }) {
      setChat((prev) => [...prev.slice(-49), msg]);
    }

    socket.on("race:update", onUpdate);
    socket.on("race:countdown", onCountdown);
    socket.on("race:go", onGo);
    socket.on("race:finished", onFinished);
    socket.on("race:error", onError);
    socket.on("race:role", onRole);
    socket.on("race:chat", onChat);

    return () => {
      socket.off("race:update", onUpdate);
      socket.off("race:countdown", onCountdown);
      socket.off("race:go", onGo);
      socket.off("race:finished", onFinished);
      socket.off("race:error", onError);
      socket.off("race:role", onRole);
      socket.off("race:chat", onChat);
    };
  }, [identity, race, code]);

  const sendChat = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const text = chatDraft.trim();
      if (!text) return;
      socketRef.current?.emit("race:chat", { code, text });
      setChatDraft("");
    },
    [chatDraft, code]
  );

  const isHost = !!(race && user && race.host === user.id);

  const startRace = useCallback(() => {
    socketRef.current?.emit("race:start", { code });
  }, [code]);

  const finishRace = useCallback(() => {
    if (finishedSentRef.current) return;
    finishedSentRef.current = true;
    finish();
    const stats = computeFinishStats();
    socketRef.current?.emit("race:finish", { code, wpm: stats.wpm, accuracy: stats.accuracy });
  }, [code, finish, computeFinishStats]);

  // report progress once per second while the race is live
  useEffect(() => {
    if (status !== "active" || !race || isSpectator) return;
    tickRef.current = setInterval(() => {
      const wpm = sampleWpm();
      const totalTyped = engine.wordStates.reduce(
        (acc, w) => acc + w.chars.filter((c) => c.status !== "pending").length,
        0
      );
      const correct = engine.wordStates.reduce(
        (acc, w) => acc + w.chars.filter((c) => c.status === "correct").length,
        0
      );
      const accuracy = totalTyped > 0 ? Math.round((correct / totalTyped) * 100) : 100;
      socketRef.current?.emit("race:progress", { code, progress: engine.progressPct, wpm, accuracy });
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [status, race, code, sampleWpm, engine.wordStates, engine.progressPct, isSpectator]);

  // finishing the race text ends it for this player
  useEffect(() => {
    if (status !== "active" || !race || finishedSentRef.current || !engine.started || isSpectator) return;
    const total = race.text.length;
    if (total === 0) return;
    const onLastWord = engine.currentWordIdx >= total - 1;
    const lastWordLen = race.text[total - 1]?.length ?? 0;
    if (onLastWord && engine.currentCharIdx >= lastWordLen) finishRace();
  }, [engine.currentWordIdx, engine.currentCharIdx, engine.started, status, race, finishRace, isSpectator]);

  // input only affects the test while the race is actively running
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isSpectator) return;
      // Skip while the chat box (or any future field) has focus, so Enter there
      // submits the message instead of being swallowed as a typing-test key.
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;

      const keyCode = codeFromKeyboardEvent(e);
      setPressedCode(keyCode);
      setPressId((id) => id + 1);
      if (status !== "active" || engine.finished) return;
      if (e.key === "Enter") {
        // Swallow it here too - otherwise an unfocused Enter forwards as a native
        // click to whatever button last had focus (e.g. "Start race").
        e.preventDefault();
        return;
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        typeChar(e.key);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        backspace();
      }
    }
    window.addEventListener("keydown", onKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [status, engine.finished, typeChar, backspace, isSpectator]);

  if (loading) return null;
  if (loadError && !race) {
    return <p className="text-danger font-mono">{loadError}</p>;
  }
  if (!race) return <p className="text-dim font-mono">Loading race...</p>;

  if (!identity) {
    return (
      <div className="max-w-sm mx-auto">
        <h1 className="font-mono text-xl font-bold mb-2">Join race {code}</h1>
        <p className="text-dim text-sm mb-6">
          Race as a guest, or{" "}
          <Link href="/login" className="text-accent">
            log in
          </Link>{" "}
          to save this result to your account.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            joinAsGuest(guestNameDraft);
          }}
          className="flex flex-col gap-3"
        >
          <Input
            value={guestNameDraft}
            onChange={(e) => setGuestNameDraft(e.target.value)}
            placeholder="Display name"
            maxLength={20}
            autoFocus
          />
          <Button type="submit" disabled={!guestNameDraft.trim()}>
            Join as guest
          </Button>
        </form>
      </div>
    );
  }

  const inviteLink = typeof window !== "undefined" ? `${window.location.origin}/race/${code}` : "";

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="font-mono text-xl font-bold">Race {code}</h1>
          {isSpectator && (
            <span className="px-2 py-1 text-[10px] font-mono uppercase tracking-wide border-2 border-border text-dim">
              Spectating
            </span>
          )}
          {spectatorCount > 0 && (
            <span className="text-xs font-mono text-dim">
              {spectatorCount} watching
            </span>
          )}
        </div>
        {status === "waiting" && isHost && <Button onClick={startRace}>Start race</Button>}
      </div>

      <div className="bg-panel border-2 border-border p-3 mb-8 flex items-center justify-between gap-3 flex-wrap">
        <code className="text-xs text-dim font-mono truncate">{inviteLink}</code>
        <Button variant="secondary" onClick={() => inviteLink && navigator.clipboard.writeText(inviteLink)}>
          Copy link
        </Button>
      </div>

      {loadError && <p className="text-danger font-mono text-sm mb-4">{loadError}</p>}

      <div className="mb-8">
        {participants.map((p) => (
          <PlayerProgressBar key={p.userId} p={p} isMe={p.userId === identity.id} />
        ))}
        {participants.length === 0 && (
          <p className="text-dim font-mono text-sm">Waiting for players to join...</p>
        )}
      </div>

      {status === "countdown" && countdown !== null && (
        <div className="text-center text-6xl font-mono font-bold text-accent mb-8">{countdown}</div>
      )}

      {status === "finished" && standings ? (
        <div>
          <h2 className="font-mono text-lg font-bold mb-4">Final standings</h2>
          <table className="w-full border-collapse font-mono text-sm">
            <thead>
              <tr className="text-dim text-xs uppercase text-left border-b-2 border-border">
                <th className="py-2 pr-4">#</th>
                <th className="py-2 pr-4">Player</th>
                <th className="py-2 pr-4">Wpm</th>
                <th className="py-2 pr-4">Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s) => (
                <tr key={s.userId} className="border-b border-border/60">
                  <td className="py-2 pr-4 text-dim">{s.place}</td>
                  <td className="py-2 pr-4">{s.username}</td>
                  <td className="py-2 pr-4 text-accent font-semibold">{s.wpm}</td>
                  <td className="py-2 pr-4">{s.accuracy}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : isSpectator ? (
        <p className="text-dim font-mono text-sm mb-8">
          You&apos;re watching this race - progress bars above update live.
        </p>
      ) : (
        <>
          {/* Keystrokes are ignored until the race actually starts, so say so -
              otherwise the visible text invites typing that silently does nothing. */}
          {status === "waiting" && (
            <div className="mb-4 border-2 border-border bg-panel2 px-4 py-3 font-mono text-sm text-dim">
              {isHost
                ? "Typing is locked until you press Start race above."
                : "Waiting for the host to start the race..."}
            </div>
          )}

          <div className={status === "waiting" ? "opacity-40" : undefined}>
            <WordDisplay
              wordStates={engine.wordStates}
              currentWordIdx={engine.currentWordIdx}
              currentCharIdx={engine.currentCharIdx}
              size={textSize}
            />
          </div>
        </>
      )}

      <div className="mt-10 bg-panel border-2 border-border p-3">
        <h2 className="font-mono text-xs uppercase tracking-wide text-dim mb-2">Race chat</h2>
        <div className="h-32 overflow-y-auto flex flex-col gap-1 mb-2 font-mono text-xs">
          {chat.length === 0 && <p className="text-dim">No messages yet.</p>}
          {chat.map((m, i) => (
            <p key={i}>
              <span className={m.spectator ? "text-dim" : "text-accent"}>{m.username}</span>
              {m.spectator ? " (watching): " : ": "}
              <span className="text-text">{m.text}</span>
            </p>
          ))}
        </div>
        <form onSubmit={sendChat} className="flex gap-2">
          <Input
            value={chatDraft}
            onChange={(e) => setChatDraft(e.target.value)}
            placeholder="Say something..."
            maxLength={240}
          />
          <Button type="submit" variant="secondary" disabled={!chatDraft.trim()}>
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
