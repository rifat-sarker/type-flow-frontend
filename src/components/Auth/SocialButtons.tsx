"use client";

import { useEffect, useState } from "react";
import { api, API_URL } from "@/lib/api";

interface Providers {
  google: boolean;
  github: boolean;
}

/** Only renders buttons for providers the backend actually has credentials for. */
export function SocialButtons() {
  const [providers, setProviders] = useState<Providers | null>(null);

  useEffect(() => {
    api
      .get<{ providers: Providers }>("/api/auth/providers")
      .then((d) => setProviders(d.providers))
      .catch(() => setProviders({ google: false, github: false }));
  }, []);

  if (!providers || (!providers.google && !providers.github)) return null;

  const btn =
    "flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-mono uppercase tracking-wide border-2 border-border bg-panel2 text-text hover:border-dim transition-colors";

  return (
    <div className="mb-6">
      <div className="flex gap-2">
        {providers.google && (
          <a href={`${API_URL}/api/auth/google`} className={btn}>
            <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
              <path
                fill="#4285F4"
                d="M45.1 24.5c0-1.6-.1-2.8-.4-4H24v7.3h12.1c-.2 2-1.6 5-4.5 7l6.9 5.4c4.1-3.8 6.6-9.4 6.6-15.7z"
              />
              <path
                fill="#34A853"
                d="M24 46c5.9 0 10.9-2 14.5-5.3l-6.9-5.4c-1.9 1.3-4.4 2.2-7.6 2.2-5.8 0-10.7-3.8-12.5-9.1l-7.1 5.5C8.1 41 15.4 46 24 46z"
              />
              <path
                fill="#FBBC05"
                d="M11.5 28.4c-.5-1.4-.8-2.9-.8-4.4s.3-3 .7-4.4l-7.1-5.5C2.9 17 2 20.4 2 24s.9 7 2.4 9.9l7.1-5.5z"
              />
              <path
                fill="#EA4335"
                d="M24 10.5c4.1 0 6.9 1.8 8.5 3.3l6.2-6C34.9 4.4 29.9 2 24 2 15.4 2 8.1 7 4.4 14.1l7.1 5.5c1.8-5.3 6.7-9.1 12.5-9.1z"
              />
            </svg>
            Google
          </a>
        )}
        {providers.github && (
          <a href={`${API_URL}/api/auth/github`} className={btn}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            GitHub
          </a>
        )}
      </div>
      <div className="flex items-center gap-3 my-5">
        <span className="flex-1 h-px bg-border" />
        <span className="text-dim text-[10px] font-mono uppercase">or</span>
        <span className="flex-1 h-px bg-border" />
      </div>
    </div>
  );
}
