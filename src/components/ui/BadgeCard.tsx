export interface BadgeInfo {
  id: string;
  name: string;
  description: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
  emoji: string;
  owned?: boolean;
}

export const TIER_STYLE: Record<BadgeInfo["tier"], { ring: string; label: string }> = {
  bronze: { ring: "#b07a43", label: "Bronze" },
  silver: { ring: "#9aa4b0", label: "Silver" },
  gold: { ring: "#d9a441", label: "Gold" },
  platinum: { ring: "#6fd6d6", label: "Platinum" },
};

export function BadgeCard({ badge }: { badge: BadgeInfo }) {
  const tier = TIER_STYLE[badge.tier];
  const owned = badge.owned !== false;

  return (
    <div
      className={`bg-panel p-4 flex flex-col items-center text-center ${owned ? "" : "opacity-40"}`}
      title={badge.description}
    >
      <div
        className="w-12 h-12 flex items-center justify-center text-2xl mb-2 border-2"
        style={{
          borderColor: owned ? tier.ring : "rgb(var(--c-border))",
          background: owned ? `${tier.ring}22` : "transparent",
          filter: owned ? undefined : "grayscale(1)",
        }}
      >
        {badge.emoji}
      </div>
      <div className="font-mono text-xs font-semibold">{badge.name}</div>
      <div className="text-dim text-[11px] leading-snug mt-1">{badge.description}</div>
      <div
        className="text-[10px] font-mono uppercase tracking-wide mt-2"
        style={{ color: owned ? tier.ring : undefined }}
      >
        {owned ? tier.label : "Locked"}
      </div>
    </div>
  );
}
