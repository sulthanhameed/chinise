import { useState } from "react";

interface Props {
  src: string | null;
  alt: string;
  emoji?: string;
  className?: string;
}

/** Lazy-loaded food photo with a themed placeholder when no image exists. */
export function FoodImage({ src, alt, emoji = "🥢", className = "" }: Props) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`food-placeholder ${className}`} role="img" aria-label={alt}>
        <span>{emoji}</span>
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" decoding="async" className={className} onError={() => setFailed(true)} />;
}

export function Stars({ rating, count }: { rating: number; count?: number }) {
  return (
    <span className="stars" aria-label={`Rated ${rating} out of 5`}>
      <span className="star-icon">★</span> {rating.toFixed(1)}
      {typeof count === "number" && <span className="muted"> ({count})</span>}
    </span>
  );
}
