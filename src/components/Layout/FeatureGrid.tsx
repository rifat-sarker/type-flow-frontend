import Link from "next/link";

interface Feature {
  title: string;
  body: string;
  href?: string;
  cta?: string;
}

const FEATURES: Feature[] = [
  {
    title: "4 test modes",
    body: "Time (15/30/60/120s), word count (10/25/50/100), real quotes, and zen — type freely with no limit.",
  },
  {
    title: "3 difficulty levels",
    body: "Easy for short common words, medium for everyday vocabulary, hard for long words with capitals and punctuation mixed in.",
  },
  {
    title: "Guided course",
    body: "11 progressive lessons from the home row to the full keyboard, each gated on 90% accuracy so you build real muscle memory.",
    href: "/lessons",
    cta: "Start learning",
  },
  {
    title: "Keystroke sounds",
    body: "A synthesized mechanical-switch click on every keypress, with a distinct thud on mistakes. One tap to toggle it on or off.",
  },
  {
    title: "Practice modifiers",
    body: "Add punctuation and numbers, or turn on blind mode to train accuracy without seeing your mistakes.",
  },
  {
    title: "Live multiplayer races",
    body: "Create a room, share the invite link, and race friends with real-time progress bars, countdown, chat and standings.",
    href: "/race/create",
    cta: "Start a race",
  },
  {
    title: "Guest racing + spectators",
    body: "Anyone can join a race from a link with just a display name — no account. Latecomers watch live as spectators.",
  },
  {
    title: "Global leaderboard",
    body: "Ranked by best WPM per mode, filterable by today, this week, or all-time.",
    href: "/leaderboard",
    cta: "View leaderboard",
  },
  {
    title: "Synced stats & history",
    body: "Every finished test saves to your account — WPM, accuracy, consistency and a full history, on any device you log in from.",
    href: "/dashboard",
    cta: "Open dashboard",
  },
  {
    title: "Detailed results",
    body: "WPM, raw WPM, accuracy, consistency, a character breakdown and a WPM-over-time graph after every test.",
  },
  {
    title: "Badges & streaks",
    body: "Unlock 17 badges for speed, accuracy, volume, finishing the course and practising day after day. Your daily streak keeps you honest.",
    href: "/badges",
    cta: "See badges",
  },
  {
    title: "Live community",
    body: "See how many people are practising right now, race them, and climb the leaderboard.",
  },
  {
    title: "4 themes",
    body: "Sunset, forest, azure and a light paper theme — switch any time from the swatch in the header.",
  },
  {
    title: "Secure accounts",
    body: "Email OTP verification, password reset by code, and JWT sessions that keep you logged in across devices.",
    href: "/register",
    cta: "Create account",
  },
];

export function FeatureGrid() {
  return (
    <section className="max-w-5xl mx-auto mt-24 px-2">
      <div className="border-t-2 border-border pt-10">
        <h2 className="font-mono text-lg font-bold mb-1">Everything in one place</h2>
        <p className="text-dim text-sm mb-8">
          Most typing sites give you one piece of this. Typist puts the whole practice
          loop — drills, feedback, competition and progress — in a single place.
        </p>

        <div className="grid gap-px bg-border border-2 border-border sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-panel p-4 flex flex-col">
              <h3 className="font-mono text-sm font-semibold mb-2">{f.title}</h3>
              <p className="text-dim text-xs leading-relaxed flex-1">{f.body}</p>
              {f.href && (
                <Link
                  href={f.href}
                  className="text-accent text-xs font-mono mt-3 hover:underline"
                >
                  {f.cta} →
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
