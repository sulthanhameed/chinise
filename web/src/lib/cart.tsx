import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CartItem, Product } from "./types";
import { computeTotals } from "./money";

const STORAGE_KEY = "khang-cart-v1";

interface CartContextValue {
  items: CartItem[];
  count: number;
  totals: ReturnType<typeof computeTotals>;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (product: Product, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  lastAddedAt: number; // changes on every add → drives the cart bump animation
}

const CartContext = createContext<CartContextValue | null>(null);

function loadItems(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadItems);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lastAddedAt, setLastAddedAt] = useState(0);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((p: Product, quantity = 1) => {
    const q = Math.max(1, Math.min(50, Math.floor(quantity)));
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === p.id);
      if (existing) {
        return prev.map((i) =>
          i.product_id === p.id ? { ...i, quantity: Math.min(50, i.quantity + q) } : i,
        );
      }
      return [...prev, { product_id: p.id, name: p.name, price: p.price, image_url: p.image_url, emoji: "🥢", quantity: q }];
    });
    setLastAddedAt(Date.now());
  }, []);

  const setQuantity = useCallback((id: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.product_id !== id)
        : prev.map((i) => (i.product_id === id ? { ...i, quantity: Math.min(50, quantity) } : i)),
    );
  }, []);

  const removeItem = useCallback((id: string) => setItems((prev) => prev.filter((i) => i.product_id !== id)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    return {
      items,
      count: items.reduce((s, i) => s + i.quantity, 0),
      totals: computeTotals(subtotal),
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      addItem,
      setQuantity,
      removeItem,
      clear,
      lastAddedAt,
    };
  }, [items, drawerOpen, addItem, setQuantity, removeItem, clear, lastAddedAt]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
