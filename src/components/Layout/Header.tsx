"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { ThemePicker } from "./ThemePicker";

const NAV = [
  { href: "/", label: "type" },
  { href: "/leaderboard", label: "leaderboard" },
  { href: "/race/create", label: "race" },
];

export function Header() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();

  return (
    <header className="flex items-center justify-between gap-4 flex-wrap px-6 py-4 border-b-2 border-border">
      <Link href="/" className="font-mono font-bold text-lg tracking-tight text-text">
        type<span className="text-accent">flow</span>
      </Link>

      <nav className="flex items-center gap-1">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wide border-2 rounded-none transition-colors ${
              pathname === item.href
                ? "bg-accent text-bg border-accent"
                : "bg-transparent text-dim border-transparent hover:text-text hover:border-border"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <ThemePicker />
        {loading ? null : user ? (
          <>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono uppercase tracking-wide border-2 border-border text-dim hover:text-text rounded-none"
            >
              <Avatar username={user.username} size={16} />
              {user.username}
            </Link>
            <Button variant="secondary" onClick={() => logout()}>
              Log out
            </Button>
          </>
        ) : (
          <>
            <Link href="/login">
              <Button variant="secondary">Log in</Button>
            </Link>
            <Link href="/register">
              <Button variant="primary">Sign up</Button>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
