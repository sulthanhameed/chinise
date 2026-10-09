import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useCatalog } from "../lib/catalog";
import { useProductActions } from "../lib/useProductActions";
import { ProductCard } from "../components/ProductCard";
import { ProductModal } from "../components/ProductModal";
import { SectionHeading } from "../components/Decor";
import type { Product } from "../lib/types";

export function Menu() {
  const { categories, products, loading } = useCatalog();
  const { add, orderNow } = useProductActions();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<Product | null>(null);

  const activeSlug = params.get("cat") ?? "all";
  const activeCat = categories.find((c) => c.slug === activeSlug);

  // Deep links: /menu?item=slug opens the detail view directly (used by search and Chef's Surprise).
  useEffect(() => {
    const slug = params.get("item");
    if (!slug) return;
    const found = products.find((p) => p.slug === slug);
    if (found) setDetail(found);
  }, [params, products]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (activeCat && p.category_id !== activeCat.id) return false;
      if (!q) return true;
      return `${p.name} ${p.description}`.toLowerCase().includes(q);
    });
  }, [products, activeCat, query]);

  const setCat = (slug: string) => {
    const next = new URLSearchParams();
    if (slug !== "all") next.set("cat", slug);
    setParams(next, { replace: true });
  };

  const sections = activeCat
    ? [{ cat: activeCat, items: visible }]
    : categories.map((c) => ({ cat: c, items: visible.filter((p) => p.category_id === c.id) })).filter((s) => s.items.length);

  const detailCat = detail ? categories.find((c) => c.id === detail.category_id) : undefined;

  const closeDetail = () => {
    setDetail(null);
    if (params.get("item")) {
      const next = new URLSearchParams(params);
      next.delete("item");
      setParams(next, { replace: true });
    }
  };

  return (
    <div className="page menu-page">
      <header className="page-hero">
        <p className="kicker">Khang Chinese Restaurant &amp; Dimsum</p>
        <h1 className="brush">Our Menu</h1>
        <p className="muted">Every dish is made to order. Tap a dish for ingredients and reviews.</p>
      </header>

      <div className="menu-toolbar">
        <div className="chip-row" role="tablist" aria-label="Categories">
          <button role="tab" aria-selected={activeSlug === "all"} className={`chip ${activeSlug === "all" ? "active" : ""}`} onClick={() => setCat("all")}>
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              role="tab"
              aria-selected={activeSlug === c.slug}
              className={`chip ${activeSlug === c.slug ? "active" : ""}`}
              onClick={() => setCat(c.slug)}
            >
              <span>{c.emoji}</span> {c.name}
            </button>
          ))}
        </div>
        <input className="menu-search" placeholder="Filter dishes…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Filter dishes" />
      </div>

      {loading && <p className="muted center">Loading the menu…</p>}

      {/* key re-mounts the list so the category change plays the slide + fade transition */}
      <div key={activeSlug} className="menu-sections category-enter">
        {sections.map(({ cat, items }) => (
          <section key={cat.id} className="menu-section">
            {!activeCat && (
              <SectionHeading title={`${cat.emoji} ${cat.name}`} />
            )}
            <div className="product-grid">
              {items.map((p, i) => (
                <div key={p.id} className="fade-in-card" style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}>
                  <ProductCard
                    product={p}
                    category={cat}
                    onOpen={setDetail}
                    onAdd={(prod, qty) => add(prod, qty)}
                    onOrderNow={(prod, qty) => orderNow(prod, qty)}
                  />
                </div>
              ))}
            </div>
          </section>
        ))}
        {sections.length === 0 && <p className="center muted">No dishes match your search.</p>}
      </div>

      {detail && (
        <ProductModal
          product={detail}
          category={detailCat}
          onClose={closeDetail}
          onAdd={(p, q) => { add(p, q); setDetail(null); }}
          onOrderNow={(p, q) => { orderNow(p, q); setDetail(null); }}
        />
      )}
    </div>
  );
}
