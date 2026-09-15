"use client";

import { useEffect, useState } from "react";
import { getSocket } from "./socket";
import { useAuth } from "./auth-context";

/**
 * Live count of people currently on the site. Opens the shared socket (the same
 * one races use) and keeps the backend's idea of who we are in sync, so one
 * account with several tabs open still counts as one person.
 */
export function usePresence(): number | null {
  const { user, loading } = useAuth();
  const [online, setOnline] = useState<number | null>(null);

  useEffect(() => {
    const socket = getSocket();

    function onCount(data: { online: number }) {
      setOnline(data.online);
    }
    socket.on("presence:count", onCount);

    return () => {
      socket.off("presence:count", onCount);
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    const socket = getSocket();
    const identify = () => socket.emit("presence:identify", { userId: user?.id ?? null });

    identify();
    // Re-identify after a reconnect, otherwise this tab drops out of the count.
    socket.on("connect", identify);
    return () => {
      socket.off("connect", identify);
    };
  }, [user, loading]);

  return online;
}
