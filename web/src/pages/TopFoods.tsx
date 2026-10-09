import { useMemo, useState } from "react";
import { useCatalog } from "../lib/catalog";
import { useProductActions } from "../lib/useProductActions";
import { FoodImage, Stars } from "../components/FoodImage";
import { ProductModal } from "../components/ProductModal";
import { formatINR } from "../lib/money";
import { Reveal } from "../components/Reveal";
import type { Product } from "../lib/types";

export function TopFoods() {
  const { products, categories } = useCatalog();
  const { add, orderNow } = useProductActions();
  const [detail, setDetail] = useState<Product | null>(null);

  const ranked = useMemo(
    () =>
      products
        .filter((p) => p.is_available)
        .sort((a, b) => b.rating - a.rating || b.review_count - a.review_count)
        .slice(0, 10),
    [products],
  );

  return (
    <div className="page">
      <header className="page-hero">
        <p className="kicker">Most loved this season</p>
        <h1 className="brush">Top Foods</h1>
        <p className="muted">Ranked by guest ratings and number of reviews.</p>
      </header>

      <ol className="ranking">
        {ranked.map((p, i) => {
          const cat = categories.find((c) => c.id === p.category_id);
          return (
            <Reveal key={p.id} delay={i * 60}>
              <li className="rank-row">
                <span className={`rank-no ${i < 3 ? "podium" : ""}`}>{i + 1}</span>
                <button className="rank-media" onClick={() => setDetail(p)} aria-label={`View ${p.name}`}>
                  <FoodImage src={p.image_url} alt={p.name} emoji={cat?.emoji} />
                </button>
                <div className="rank-info">
                  <h3>{p.name}</h3>
                  <p className="muted">{p.description}</p>
                  <Stars rating={p.rating} count={p.review_count} />
                </div>
                <div className="rank-actions">
                  <strong className="price">{formatINR(p.price)}</strong>
                  <button className="btn btn-outline" onClick={() => add(p, 1)}>Add</button>
                  <button className="btn btn-primary" onClick={() => orderNow(p, 1)}>Order Now</button>
                </div>
              </li>
            </Reveal>
          );
        })}
      </ol>

      {detail && (
        <ProductModal
          product={detail}
          category={categories.find((c) => c.id === detail.category_id)}
          onClose={() => setDetail(null)}
          onAdd={(p, q) => { add(p, q); setDetail(null); }}
          onOrderNow={(p, q) => { orderNow(p, q); setDetail(null); }}
        />
      )}
    </div>
  );
}
