import { useMemo } from "react";
import { FoodImage, Stars } from "./FoodImage";
import { formatINR } from "../lib/money";
import type { Category, Product } from "../lib/types";

/** Continuous, auto-sliding carousel. Duplicated track gives a seamless loop; pauses on hover. */
export function FoodSlider({ products, categories, onOpen }: {
  products: Product[];
  categories: Category[];
  onOpen: (p: Product) => void;
}) {
  const items = useMemo(() => [...products, ...products], [products]);
  const duration = Math.max(20, products.length * 4);
  return (
    <div className="slider" aria-label="Featured dishes">
      <div className="slider-track" style={{ animationDuration: `${duration}s` }}>
        {items.map((p, idx) => {
          const cat = categories.find((c) => c.id === p.category_id);
          return (
            <button key={`${p.id}-${idx}`} className="slide-card" onClick={() => onOpen(p)} tabIndex={idx >= products.length ? -1 : 0}>
              <FoodImage src={p.image_url} alt={p.name} emoji={cat?.emoji} />
              <div className="slide-info">
                <strong>{p.name}</strong>
                <div className="slide-meta">
                  <span className="price">{formatINR(p.price)}</span>
                  <Stars rating={p.rating} />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
