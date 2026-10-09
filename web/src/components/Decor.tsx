// Decorative Chinese-style pieces: lanterns, gold dividers, lattice frames, brush headings.
export function Lantern({ className = "", size = 1 }: { className?: string; size?: number }) {
  return (
    <svg className={`lantern ${className}`} viewBox="0 0 60 90" width={38 * size} height={57 * size} aria-hidden="true">
      <line x1="30" y1="0" x2="30" y2="12" stroke="#facc15" strokeWidth="2" />
      <ellipse cx="30" cy="44" rx="26" ry="30" fill="#b91c1c" />
      <ellipse cx="30" cy="44" rx="26" ry="30" fill="url(#lanternShine)" opacity=".5" />
      {[-14, 0, 14].map((x) => (
        <path key={x} d={`M${30 + x * 0.5} 16 Q ${30 + x} 44 ${30 + x * 0.5} 72`} stroke="#7f1d1d" strokeWidth="1.5" fill="none" />
      ))}
      <rect x="18" y="10" width="24" height="5" rx="2" fill="#facc15" />
      <rect x="18" y="71" width="24" height="5" rx="2" fill="#facc15" />
      <line x1="30" y1="76" x2="30" y2="90" stroke="#facc15" strokeWidth="2" />
      <circle cx="30" cy="90" r="3" fill="#facc15" />
      <defs>
        <radialGradient id="lanternShine" cx="35%" cy="30%" r="60%">
          <stop offset="0" stopColor="#fecaca" />
          <stop offset="1" stopColor="#7f1d1d" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

export function GoldDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`gold-divider ${className}`} aria-hidden="true">
      <span />
      <i>◆</i>
      <span />
    </div>
  );
}

export function SectionHeading({ kicker, title, subtitle }: { kicker?: string; title: string; subtitle?: string }) {
  return (
    <div className="section-heading">
      {kicker && <p className="kicker">{kicker}</p>}
      <h2 className="brush">{title}</h2>
      <GoldDivider />
      {subtitle && <p className="section-sub">{subtitle}</p>}
    </div>
  );
}
