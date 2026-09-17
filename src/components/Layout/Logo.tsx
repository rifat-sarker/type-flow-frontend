export function Logo({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="typist-logo-grad" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f4a578" />
          <stop offset="1" stopColor="#a8493d" />
        </linearGradient>
        <linearGradient id="typist-logo-sheen" x1="6" y1="3" x2="20" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#typist-logo-grad)" />
      <rect width="32" height="16" rx="9" fill="url(#typist-logo-sheen)" />
      {/* Monogram T, its stem flowing into a motion trail - the type + flow mark */}
      <path d="M9.5 10.5h13" stroke="white" strokeWidth="3.1" strokeLinecap="round" />
      <path
        d="M16 10.5v7c0 3.6 2.9 5.3 6.2 4.9"
        stroke="white"
        strokeWidth="3.1"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
