const HUES = [4, 24, 40, 140, 160, 200, 220, 260, 300, 330];

function hueFor(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return HUES[hash % HUES.length];
}

export function Avatar({ username, size = 28 }: { username: string; size?: number }) {
  const hue = hueFor(username || "?");
  const initial = (username || "?").trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      className="inline-flex items-center justify-center font-mono font-bold shrink-0 select-none"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.45,
        backgroundColor: `hsl(${hue} 65% 22%)`,
        color: `hsl(${hue} 85% 72%)`,
        border: `1px solid hsl(${hue} 65% 34%)`,
      }}
      aria-hidden
    >
      {initial}
    </span>
  );
}
