// Display-only mirror of supabase/functions/_shared/pricing.ts. The server recalculates every total.
export const TAX_RATE = 0.05;
export const DELIVERY_FEE = 40;
export const FREE_DELIVERY_ABOVE = 499;

const round2 = (n: number) => Math.round(n * 100) / 100;

export function computeTotals(subtotal: number) {
  const s = round2(subtotal);
  const tax = round2(s * TAX_RATE);
  const delivery = s >= FREE_DELIVERY_ABOVE || s === 0 ? 0 : DELIVERY_FEE;
  return { subtotal: s, tax, delivery, total: round2(s + tax + delivery) };
}

export const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
