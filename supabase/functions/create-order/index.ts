import { corsHeaders, fail, json } from "../_shared/cors.ts";
import { adminClient, userIdFromRequest } from "../_shared/supabase.ts";
import { computeTotals, PAYMENT_PROVIDER_FOR } from "../_shared/pricing.ts";
import { notifyOrder } from "../_shared/notify.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface Body {
  customer: { name: string; phone: string; email?: string; address: string };
  items: { product_id: string; quantity: number }[];
  payment_method: "upi" | "card" | "wallet" | "cod";
  notes?: string;
}

function validate(b: Body): string | null {
  if (!b || typeof b !== "object") return "Invalid body";
  const c = b.customer;
  if (!c || typeof c.name !== "string" || c.name.trim().length < 2 || c.name.length > 80) return "Name is required";
  if (typeof c.phone !== "string" || !/^\+?[0-9\s-]{10,16}$/.test(c.phone)) return "A valid phone number is required";
  if (c.email && (typeof c.email !== "string" || !/^\S+@\S+\.\S+$/.test(c.email))) return "Email is invalid";
  if (typeof c.address !== "string" || c.address.trim().length < 10 || c.address.length > 300) return "Delivery address is required";
  if (!Array.isArray(b.items) || b.items.length === 0 || b.items.length > 30) return "Cart is empty or too large";
  for (const it of b.items) {
    if (!UUID.test(String(it.product_id))) return "Invalid product";
    if (!Number.isInteger(it.quantity) || it.quantity < 1 || it.quantity > 50) return "Quantity must be 1-50";
  }
  if (!PAYMENT_PROVIDER_FOR[b.payment_method]) return "Unsupported payment method";
  if (b.notes && (typeof b.notes !== "string" || b.notes.length > 300)) return "Notes too long";
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return fail("Method not allowed", 405);

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return fail("Malformed JSON");
  }
  const problem = validate(body);
  if (problem) return fail(problem);

  const admin = adminClient();
  const userId = await userIdFromRequest(req, admin);

  // 1. Re-price every line from the database — never trust client prices.
  const ids = [...new Set(body.items.map((i) => i.product_id))];
  const { data: products, error: pErr } = await admin
    .from("products")
    .select("id, name, price, is_available")
    .in("id", ids);
  if (pErr) return fail("Could not load menu", 500);
  const byId = new Map((products ?? []).map((p) => [p.id, p]));
  for (const id of ids) {
    const p = byId.get(id);
    if (!p) return fail("A menu item no longer exists", 409);
    if (!p.is_available) return fail(`${p.name} is currently unavailable`, 409);
  }

  const lines = body.items.map((i) => {
    const p = byId.get(i.product_id)!;
    const unit = Number(p.price);
    return { product_id: p.id, product_name: p.name, unit_price: unit, quantity: i.quantity, line_total: Math.round(unit * i.quantity * 100) / 100 };
  });
  const subtotal = lines.reduce((s, l) => s + l.line_total, 0);
  const totals = computeTotals(subtotal);

  // 2. Create order, its items and a pending payment record.
  const { data: order, error: oErr } = await admin
    .from("orders")
    .insert({
      user_id: userId,
      customer_name: body.customer.name.trim(),
      customer_phone: body.customer.phone.trim(),
      customer_email: body.customer.email?.trim() || null,
      delivery_address: body.customer.address.trim(),
      notes: body.notes?.trim() || null,
      ...totals,
      payment_method: body.payment_method,
      payment_status: "pending",
    })
    .select("*")
    .single();
  if (oErr || !order) return fail("Could not create order", 500);

  const { error: iErr } = await admin.from("order_items").insert(lines.map((l) => ({ ...l, order_id: order.id })));
  if (iErr) {
    await admin.from("orders").delete().eq("id", order.id); // roll back the order
    return fail("Could not save order items", 500);
  }

  const provider = PAYMENT_PROVIDER_FOR[body.payment_method];
  await admin.from("payments").insert({ order_id: order.id, provider, amount: totals.total, status: "pending" });

  // 3. Cash on delivery is confirmed immediately; online payments notify after verification.
  let notifications: unknown = null;
  if (provider === "cod") {
    notifications = await notifyOrder(order, "received");
  }

  return json({ order, provider, requires_payment: provider !== "cod", notifications });
});
