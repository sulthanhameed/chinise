import { useState } from "react";
import { FoodImage, Stars } from "./FoodImage";
import { formatINR } from "../lib/money";
import type { Category, Product } from "../lib/types";

interface Props {
  products: Product[];
  categories: Category[];
  onAdd: (p: Product) => void;
  onOpen: (p: Product) => void;
}

/** Spins through the menu for a moment, then lands on a random available dish. */
export function ChefSurprise({ products, categories, onAdd, onOpen }: Props) {
  const available = products.filter((p) => p.is_available);
  const [picked, setPicked] = useState<Product | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [flash, setFlash] = useState<Product | null>(null);

  const spin = () => {
    if (spinning || available.length === 0) return;
    setSpinning(true);
    setPicked(null);
    let ticks = 0;
    const total = 18;
    const tick = () => {
      ticks++;
      setFlash(available[Math.floor(Math.random() * available.length)]);
      if (ticks < total) {
        window.setTimeout(tick, 60 + ticks * 12);
      } else {
        const final = available[Math.floor(Math.random() * available.length)];
        setFlash(null);
        setPicked(final);
        setSpinning(false);
      }
    };
    tick();
  };

  const shown = flash ?? picked;
  const cat = shown ? categories.find((c) => c.id === shown.category_id) : undefined;

  return (
    <div className="chef-surprise">
      <div className="chef-copy">
        <p className="kicker">Feeling adventurous?</p>
        <h2 className="heading-font">Chef’s Surprise</h2>
        <p>Let our chef choose something delicious for you. Spin the wheel and discover today’s pick.</p>
        <button className="btn btn-gold" onClick={spin} disabled={spinning || available.length === 0}>
          {spinning ? "Spinning…" : "Spin for a surprise"}
        </button>
      </div>
      <div className="chef-stage" aria-live="polite">
        <div className={`chef-card ${spinning ? "is-spinning" : ""} ${picked && !spinning ? "is-revealed" : ""}`}>
          {shown ? (
            <>
              <FoodImage src={shown.image_url} alt={shown.name} emoji={cat?.emoji} />
              <div className="chef-info">
                <strong>{shown.name}</strong>
                <span className="price">{formatINR(shown.price)}</span>
                {!spinning && <Stars rating={shown.rating} />}
              </div>
            </>
          ) : (
            <div className="chef-placeholder">🥟</div>
          )}
        </div>
        {picked && !spinning && (
          <div className="chef-actions">
            <button className="btn btn-primary" onClick={() => onAdd(picked)}>Add to Cart</button>
            <button className="btn btn-outline" onClick={() => onOpen(picked)}>View details</button>
          </div>
        )}
      </div>
    </div>
  );
}
