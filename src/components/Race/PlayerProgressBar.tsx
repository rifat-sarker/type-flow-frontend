"use client";

import { RaceParticipant } from "@/types";
import { Avatar } from "@/components/ui/Avatar";

export function PlayerProgressBar({ p, isMe }: { p: RaceParticipant; isMe: boolean }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs font-mono mb-1">
        <span className={`flex items-center gap-2 ${isMe ? "text-accent font-semibold" : "text-text"}`}>
          <Avatar username={p.username} size={18} />
          {p.username}
          {isMe ? " (you)" : ""}
          {p.finished && p.place ? ` — #${p.place}` : ""}
        </span>
        <span className="text-dim">{p.wpm} wpm</span>
      </div>
      <div className="h-3 bg-panel2 border-2 border-border">
        <div
          className={`h-full ${p.finished ? "bg-success" : "bg-accent"} transition-[width] duration-150`}
          style={{ width: `${p.progress}%` }}
        />
      </div>
    </div>
  );
}
