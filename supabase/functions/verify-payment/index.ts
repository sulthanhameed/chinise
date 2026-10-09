import { corsHeaders, fail, json } from "../_shared/cors.ts";
import { adminClient } from "../_shared/supabase.ts";
import { notifyOrder } from "../_shared/notify.ts";

const STRIPE_API = "https://api.stripe.com/v1";

function paypalBase() {
  return Deno.env.get("PAYPAL_ENV") === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function paypalToken(): Promise<string> {
  const id = Deno.env.get("PAYPAL_CLIENT_ID")!;
  const secret = Deno.env.get("PAYPAL_CLIENT_SECRET")!;
  const res = await fetch(`${paypalBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: "Basic " + btoa(`${id}:${secret}`), "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error("PayPal auth failed");
  return (await res.json()).access_token;
}

interface VerifyBody {
  order_code: string;
  provider: "razorpay" | "stripe" | "paypal";
  // razorpay
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  // stripe
  session_id?: string;
  // paypal
  paypal_order_id?: string;
}

/** Returns the provider payment reference if the payment is confirmed, otherwise throws. */
async function confirm(body: VerifyBody, providerOrderId: string | null): Promise<string> {
  if (body.provider === "razorpay") {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
    const secret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!secret || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) throw new Error("Missing Razorpay fields");
    if (razorpay_order_id !== providerOrderId) throw new Error("Order mismatch");
    const expected = await hmacSha256Hex(secret, `${razorpay_order_id}|${razorpay_payment_id}`);
    if (!safeEqual(expected, razorpay_signature)) throw new Error("Invalid Razorpay signature");
    return razorpay_payment_id;
  }

  if (body.provider === "stripe") {
    const key = Deno.env.get("STRIPE_SECRET_KEY");
    if (!key || !body.session_id) throw new Error("Missing Stripe session");
    if (body.session_id !== providerOrderId) throw new Error("Session mismatch");
    const res = await fetch(`${STRIPE_API}/checkout/sessions/${body.session_id}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    const s = await res.json();
    if (!res.ok) throw new Error(s?.error?.message ?? "Stripe lookup failed");
    if (s.payment_status !== "paid") throw new Error("Stripe payment not completed");
    return String(s.payment_intent ?? s.id);
  }

  if (body.provider === "paypal") {
    if (!body.paypal_order_id || body.paypal_order_id !== providerOrderId) throw new Error("PayPal order mismatch");
    const token = await paypalToken();
    const base = paypalBase();
    let res = await fetch(`${base}/v2/checkout/orders/${body.paypal_order_id}/capture`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "PayPal-Request-Id": `cap-${body.paypal_order_id}` },
    });
    let data = await res.json();
    if (!res.ok) {
      // Already captured (e.g. page refresh): read the order instead.
      res = await fetch(`${base}/v2/checkout/orders/${body.paypal_order_id}`, { headers: { Authorization: `Bearer ${token}` } });
      data = await res.json();
    }
    if (data.status !== "COMPLETED") throw new Error("PayPal payment not completed");
    return data.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? data.id;
  }

  throw new Error("Unsupported provider");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return fail("Method not allowed", 405);

  let body: VerifyBody;
  try {
    body = await req.json();
  } catch {
    return fail("Malformed JSON");
  }
  if (!body.order_code || !body.provider) return fail("order_code and provider are required");

  const admin = adminClient();
  const { data: order } = await admin.from("orders").select("*").eq("order_code", body.order_code.toUpperCase()).maybeSingle();
  if (!order) return fail("Order not found", 404);
  if (order.payment_status === "paid") return json({ ok: true, order_code: order.order_code, payment_status: "paid" });

  const { data: payment } = await admin
    .from("payments").select("*").eq("order_id", order.id).eq("provider", body.provider)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!payment) return fail("No matching payment for this order", 404);

  try {
    const providerPaymentId = await confirm(body, payment.provider_order_id);
    await admin.from("payments").update({ status: "paid", provider_payment_id: providerPaymentId }).eq("id", payment.id);
    await admin.from("orders").update({ payment_status: "paid" }).eq("id", order.id);
    const notifications = await notifyOrder(order, "received");
    return json({ ok: true, order_code: order.order_code, payment_status: "paid", notifications });
  } catch (e) {
    await admin.from("payments").update({ status: "failed", raw: { error: (e as Error).message } }).eq("id", payment.id);
    return fail((e as Error).message, 402);
  }
});
