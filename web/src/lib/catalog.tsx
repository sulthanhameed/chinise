import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase, isSupabaseConfigured } from "./supabase";
import type { Category, Product, Review } from "./types";
import { LOCAL_CATEGORIES, LOCAL_PRODUCTS, LOCAL_REVIEWS } from "../data/menu";

interface CatalogState {
  categories: Category[];
  products: Product[];
  reviews: Review[];
  loading: boolean;
  source: "supabase" | "local";
}

const CatalogContext = createContext<CatalogState | null>(null);

/** Loads menu, categories and testimonials once. Falls back to local data if Supabase is unavailable. */
export function CatalogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CatalogState>({
    categories: LOCAL_CATEGORIES,
    products: LOCAL_PRODUCTS,
    reviews: LOCAL_REVIEWS,
    loading: isSupabaseConfigured,
    source: "local",
  });

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    (async () => {
      const [c, p, r] = await Promise.all([
        supabase.from("categories").select("*").order("sort_order"),
        supabase.from("products").select("*").order("name"),
        supabase.from("reviews").select("*").is("product_id", null).order("created_at", { ascending: false }).limit(20),
      ]);
      if (cancelled) return;
      if (c.error || p.error) {
        console.warn("Catalog load failed, using local menu", c.error ?? p.error);
        setState((s) => ({ ...s, loading: false }));
        return;
      }
      setState({
        categories: (c.data as Category[]) ?? [],
        products: ((p.data as Product[]) ?? []).map((x) => ({ ...x, price: Number(x.price), rating: Number(x.rating) })),
        reviews: (r.data as Review[]) ?? [],
        loading: false,
        source: "supabase",
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return <CatalogContext.Provider value={state}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogState {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used inside CatalogProvider");
  return ctx;
}

/** Product reviews for the detail view. */
export async function fetchProductReviews(productId: string): Promise<Review[]> {
  if (!supabase || productId.length < 30) return [];
  const { data } = await supabase
    .from("reviews").select("*").eq("product_id", productId).order("created_at", { ascending: false }).limit(10);
  return (data as Review[]) ?? [];
}
