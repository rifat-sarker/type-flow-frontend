"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { tryRefresh } from "@/lib/api";

/**
 * Where the backend lands you after a social login. The refresh token is already
 * set as an httpOnly cookie, so all this does is trade it for an access token and
 * move on - nothing sensitive ever travels in the URL.
 */
export default function OAuthDonePage() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  useEffect(() => {
    (async () => {
      const ok = await tryRefresh();
      if (ok) await refreshUser();
      router.replace(ok ? "/" : "/login?error=Social%20login%20failed");
    })();
  }, [router, refreshUser]);

  return <p className="text-dim font-mono text-sm">Signing you in...</p>;
}
