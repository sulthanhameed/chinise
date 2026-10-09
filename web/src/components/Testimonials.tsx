import type { Review } from "../lib/types";
import { Stars } from "./FoodImage";

export function Testimonials({ reviews }: { reviews: Review[] }) {
  const items = [...reviews, ...reviews];
  return (
    <div className="testimonials" aria-label="Customer reviews">
      <div className="testimonial-track" style={{ animationDuration: `${Math.max(24, reviews.length * 6)}s` }}>
        {items.map((r, i) => (
          <figure key={`${r.id}-${i}`} className="testimonial-card" aria-hidden={i >= reviews.length}>
            <Stars rating={r.rating} />
            <blockquote>“{r.comment}”</blockquote>
            <figcaption>— {r.author_name}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
