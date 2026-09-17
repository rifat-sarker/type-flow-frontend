"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { ThemePicker } from "./ThemePicker";
import { ModeToggle } from "./ModeToggle";
import { OnlineCount } from "./OnlineCount";

const NAV = [
  { href: "/", label: "type" },
  { href: "/lessons", label: "learn" },
  { href: "/practice", label: "drill" },
  { href: "/leaderboard", label: "leaderboard" },
  { href: "/dashboard", label: "stats" },
  { href: "/badges", label: "badges" },
  { href: "/friends", label: "friends" },
  { href: "/race/create", label: "race" },
];

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wide border-2 rounded-none transition-colors ${
        active
          ? "bg-accent text-bg border-accent"
          : "bg-transparent text-dim border-transparent hover:text-text hover:border-border"
      }`}
    >
      {label}
    </Link>
  );
}

function AuthActions({ stacked = false }: { stacked?: boolean }) {
  const { user, loading, logout } = useAuth();
  if (loading) return null;

  if (user) {
    return (
      <div className={stacked ? "flex flex-col gap-2 w-full" : "flex items-center gap-2"}>
        <Link
          href="/settings"
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono uppercase tracking-wide border-2 border-border text-dim hover:text-text rounded-none ${stacked ? "justify-center" : ""}`}
        >
          <Avatar username={user.username} size={16} />
          {user.username}
        </Link>
        <Button variant="secondary" onClick={() => logout()} className={stacked ? "w-full" : undefined}>
          Log out
        </Button>
      </div>
    );
  }

  return (
    <div className={stacked ? "flex flex-col gap-2 w-full" : "flex items-center gap-2"}>
      <Link href="/login" className={stacked ? "w-full" : undefined}>
        <Button variant="secondary" className={stacked ? "w-full" : undefined}>
          Log in
        </Button>
      </Link>
      <Link href="/register" className={stacked ? "w-full" : undefined}>
        <Button variant="primary" className={stacked ? "w-full" : undefined}>
          Sign up
        </Button>
      </Link>
    </div>
  );
}

export function Header() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const showVerifyBanner = !loading && user && !user.isVerified && pathname !== "/verify-email";

  // Close the mobile menu on every navigation, and never leave the page
  // scroll-locked if the drawer was open when the route changed.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <header className="relative flex items-center justify-between gap-4 px-4 sm:px-6 py-4 border-b-2 border-border">
        <Link href="/" className="font-mono font-bold text-lg tracking-tight text-text shrink-0">
          type<span className="text-accent">flow</span>
        </Link>

        {/* Desktop: full nav + right cluster inline. Hidden below lg, where it
            no longer fits eight links plus the auth controls in one row. */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} active={pathname === item.href} />
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-2">
          <OnlineCount />
          <ModeToggle />
          <ThemePicker />
          <AuthActions />
        </div>

        {/* Mobile / tablet: everything collapses behind one toggle. */}
        <div className="flex lg:hidden items-center gap-2">
          <OnlineCount />
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="w-9 h-9 flex items-center justify-center border-2 border-border text-text"
          >
            {menuOpen ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M2 2l12 12M14 2L2 14" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M1.5 4h13M1.5 8h13M1.5 12h13" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>

        {menuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-bg border-b-2 border-border max-h-[calc(100vh-64px)] overflow-y-auto z-50">
            <nav className="flex flex-col p-4 gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2.5 text-xs font-mono uppercase tracking-wide border-2 rounded-none transition-colors ${
                    pathname === item.href
                      ? "bg-accent text-bg border-accent"
                      : "bg-transparent text-dim border-transparent hover:text-text hover:border-border"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center justify-between px-4 pb-3">
              <span className="text-dim text-xs font-mono uppercase">Appearance</span>
              <div className="flex items-center gap-2">
                <ModeToggle />
                <ThemePicker />
              </div>
            </div>
            <div className="px-4 pb-4">
              <AuthActions stacked />
            </div>
          </div>
        )}
      </header>
      {showVerifyBanner && (
        <div className="flex items-center justify-center gap-2 bg-panel2 border-b-2 border-border px-4 sm:px-6 py-2 text-xs font-mono text-dim text-center">
          Your email isn&apos;t verified yet.
          <Link href={`/verify-email?email=${encodeURIComponent(user.email)}`} className="text-accent">
            Verify now
          </Link>
        </div>
      )}
    </>
  );
}
