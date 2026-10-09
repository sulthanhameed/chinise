import { corsHeaders, fail, json } from "../_shared/cors.ts";
import { adminClient } from "../_shared/supabase.ts";
import { toPaise } from "../_shared/pricing.ts";

const RAZORPAY_API = "https://api.razorpay.com/v1";
const STRIPE_API = "https://api.stripe.com/v1";

function paypalBase() {
  return Deno.env.get("PAYPAL_ENV") === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return fail("Method not allowed", 405);

  let body: { order_code?: string; return_url?: string };
  try {
    body = await req.json();
  } catch {
    return fail("Malformed JSON");
  }
  if (!body.order_code || !body.return_url) return fail("order_code and return_url are required");

  const admin = adminClient();
  const { data: order } = await admin.from("orders").select("*").eq("order_code", body.order_code.toUpperCase()).maybeSingle();
  if (!order) return fail("Order not found", 404);
  if (order.payment_status === "paid") return fail("Order is already paid", 409);

  const { data: payment } = await admin
    .from("payments").select("*").eq("order_id", order.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!payment || payment.provider === "cod") return fail("This order does not use online payment", 400);

  const amountPaise = toPaise(Number(order.total));
  const code = order.order_code;
  const returnUrl = body.return_url.replace(/\/$/, "");
  const allowed = (Deno.env.get("APP_URL") ?? "").replace(/\/$/, "");
  if (allowed && !returnUrl.startsWith(allowed)) return fail("return_url not allowed", 400);

  try {
    if (payment.provider === "razorpay") {
      const keyId = Deno.env.get("RAZORPAY_KEY_ID");
      const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
      if (!keyId || !keySecret) return fail("Razorpay is not configured", 503);
      const res = await fetch(`${RAZORPAY_API}/orders`, {
        method: "POST",
        headers: { Authorization: "Basic " + btoa(`${keyId}:${keySecret}`), "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountPaise, currency: "INR", receipt: code, notes: { order_code: code } }),
      });
      const data = await res.json();
      if (!res.ok) return fail(`Razorpay error: ${data?.error?.description ?? res.status}`, 502);
      await admin.from("payments").update({ provider_order_id: data.id, raw: data }).eq("id", payment.id);
      return json({
        provider: "razorpay",
        key_id: keyId,
        provider_order_id: data.id,
        amount: amountPaise,
        currency: "INR",
        order_code: code,
        prefill: { name: order.customer_name, contact: order.customer_phone, email: order.customer_email ?? "" },
      });
    }

    if (payment.provider === "stripe") {
      const key = Deno.env.get("STRIPE_SECRET_KEY");
      if (!key) return fail("Stripe is not configured", 503);
      const form = new URLSearchParams({
        mode: "payment",
        client_reference_id: code,
        success_url: `${returnUrl}?order=${code}&provider=stripe&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${returnUrl}?order=${code}&cancelled=1`,
        "line_items[0][quantity]": "1",
        "line_items[0][price_data][currency]": "inr",
        "line_items[0][price_data][unit_amount]": String(amountPaise),
        "line_items[0][price_data][product_data][name]": `Khang Dimsum order ${code}`,
        "metadata[order_code]": code,
      });
      const res = await fetch(`${STRIPE_API}/checkout/sessions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) return fail(`Stripe error: ${data?.error?.message ?? res.status}`, 502);
      await admin.from("payments").update({ provider_order_id: data.id, raw: data }).eq("id", payment.id);
      return json({ provider: "stripe", redirect_url: data.url, provider_order_id: data.id });
    }

    if (payment.provider === "paypal") {
      const currency = Deno.env.get("PAYPAL_CURRENCY") ?? "USD";
      const inrRate = Number(Deno.env.get("PAYPAL_INR_RATE") ?? "83"); // INR per 1 unit of PAYPAL_CURRENCY
      const value = (Number(order.total) / inrRate).toFixed(2);
      const token = await paypalToken();
      const res = await fetch(`${paypalBase()}/v2/checkout/orders`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "PayPal-Request-Id": payment.id },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [{ reference_id: code, custom_id: code, amount: { currency_code: currency, value } }],
          application_context: {
            return_url: `${returnUrl}?order=${code}&provider=paypal`,
            cancel_url: `${returnUrl}?order=${code}&cancelled=1`,
            user_action: "PAY_NOW",
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) return fail(`PayPal error: ${data?.message ?? res.status}`, 502);
      const approve = (data.links ?? []).find((l: { rel: string }) => l.rel === "payer-action" || l.rel === "approve");
      await admin.from("payments").update({ provider_order_id: data.id, raw: data }).eq("id", payment.id);
      return json({ provider: "paypal", redirect_url: approve?.href, provider_order_id: data.id });
    }

    return fail("Unsupported provider", 400);
  } catch (e) {
    return fail(`Payment provider unreachable: ${(e as Error).message}`, 502);
  }
});
