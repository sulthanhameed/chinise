import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCatalog } from "../lib/catalog";
import { formatINR } from "../lib/money";
import { FoodImage } from "./FoodImage";

export function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");
  const { products, categories } = useCatalog();
  const navigate = useNavigate();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return products.filter((p) => `${p.name} ${p.description} ${p.ingredients.join(" ")}`.toLowerCase().includes(term)).slice(0, 8);
  }, [q, products]);

  return (
    <div className="search-overlay" onMouseDown={onClose}>
      <div className="search-panel" onMouseDown={(e) => e.stopPropagation()}>
        <input ref={input} className="search-input" placeholder="Search dim sum, noodles, tea…" value={q} onChange={(e) => setQ(e.target.value)} />
        <ul className="search-results">
          {results.map((p) => {
            const cat = categories.find((c) => c.id === p.category_id);
            return (
              <li key={p.id}>
                <button onClick={() => { onClose(); navigate(`/menu?cat=${cat?.slug ?? ""}&item=${p.slug}`); }}>
                  <FoodImage src={p.image_url} alt={p.name} emoji={cat?.emoji} className="search-thumb" />
                  <span>{p.name}</span>
                  <strong>{formatINR(p.price)}</strong>
                </button>
              </li>
            );
          })}
          {q && results.length === 0 && <li className="muted">No dishes match “{q}”.</li>}
        </ul>
      </div>
    </div>
  );
}
