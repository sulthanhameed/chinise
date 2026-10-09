/** Khang brand mark: a geometric "K" on a lacquer-to-champagne tile with a jade signal dot. */
export function LogoMark({ className = "logo-svg" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id="khangLogoGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff4d2e" />
          <stop offset="0.6" stopColor="#ff8a4c" />
          <stop offset="1" stopColor="#f5d28a" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill="url(#khangLogoGrad)" />
      <path d="M15 12.5v23" stroke="#07080b" strokeWidth="4.4" strokeLinecap="round" />
      <path d="M16.5 24.5 31 12.5" stroke="#07080b" strokeWidth="4.4" strokeLinecap="round" />
      <path d="M21 22.5 32.5 35.5" stroke="#07080b" strokeWidth="4.4" strokeLinecap="round" />
      <circle cx="36" cy="12" r="3.6" fill="#2dd4a7" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="logo-lockup">
      <LogoMark />
      <span className="logo-text">
        <span className="logo-name">KHANG</span>
        <small>Dimsum House</small>
      </span>
    </span>
  );
}
