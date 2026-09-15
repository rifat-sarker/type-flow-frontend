"use client";

import { usePresence } from "@/lib/usePresence";

export function OnlineCount() {
  const online = usePresence();
  if (online === null) return null;

  return (
    <span
      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono border-2 border-border text-dim"
      title="People typing on TypeFlow right now"
    >
      <span className="relative flex w-2 h-2">
        <span className="absolute inline-flex w-full h-full bg-success opacity-70 animate-ping" />
        <span className="relative inline-flex w-2 h-2 bg-success" />
      </span>
      {online} online
    </span>
  );
}
