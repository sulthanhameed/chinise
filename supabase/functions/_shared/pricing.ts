// Single source of truth for money rules on the server.
// The frontend mirrors these values for display only; the server recalculates everything.
export const TAX_RATE = 0.05; // 5% GST-style tax
export const DELIVERY_FEE = 40; // ₹
export const FREE_DELIVERY_ABOVE = 499; // ₹ subtotal

export const PAYMENT_PROVIDER_FOR: Record<string, "cod" | "razorpay" | "stripe" | "paypal"> = {
  cod: "cod",
  upi: "razorpay",
  card: "stripe",
  wallet: "paypal",
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export function computeTotals(subtotal: number) {
  const s = round2(subtotal);
  const tax = round2(s * TAX_RATE);
  const delivery_fee = s >= FREE_DELIVERY_ABOVE || s === 0 ? 0 : DELIVERY_FEE;
  const total = round2(s + tax + delivery_fee);
  return { subtotal: s, tax, delivery_fee, total };
}

export function toPaise(amount: number): number {
  return Math.round(amount * 100);
}
