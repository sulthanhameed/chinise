import nodemailer from "npm:nodemailer@6.9.16";

export type OrderEvent = "received" | "preparing" | "out_for_delivery" | "delivered";

export interface NotifiableOrder {
  order_code: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  total: number | string;
}

const MESSAGES: Record<OrderEvent, (o: NotifiableOrder) => { sms: string; subject: string; text: string }> = {
  received: (o) => ({
    sms: `Khang Dimsum: Hi ${o.customer_name}, order ${o.order_code} (Rs ${o.total}) received. Track it on our website.`,
    subject: `Order ${o.order_code} received`,
    text: `Hi ${o.customer_name},\n\nThank you for ordering from Khang Chinese Restaurant & Dimsum.\nOrder ID: ${o.order_code}\nTotal: ₹${o.total}\n\nTrack your order using the Order ID on our Track page.`,
  }),
  preparing: (o) => ({
    sms: `Khang Dimsum: Order ${o.order_code} is being prepared by our chefs.`,
    subject: `Order ${o.order_code} is being prepared`,
    text: `Hi ${o.customer_name},\n\nOur chefs are now preparing order ${o.order_code}.`,
  }),
  out_for_delivery: (o) => ({
    sms: `Khang Dimsum: Order ${o.order_code} is out for delivery. See you soon!`,
    subject: `Order ${o.order_code} is out for delivery`,
    text: `Hi ${o.customer_name},\n\nOrder ${o.order_code} is out for delivery.`,
  }),
  delivered: (o) => ({
    sms: `Khang Dimsum: Order ${o.order_code} delivered. Enjoy your meal!`,
    subject: `Order ${o.order_code} delivered`,
    text: `Hi ${o.customer_name},\n\nOrder ${o.order_code} has been delivered. Enjoy your meal! 🥟`,
  }),
};

/** SMS via Fast2SMS (India). Skipped silently when FAST2SMS_API_KEY is not set. */
export async function sendSms(phone: string, message: string): Promise<{ skipped: boolean }> {
  const key = Deno.env.get("FAST2SMS_API_KEY");
  if (!key) return { skipped: true };
  const digits = phone.replace(/\D/g, "").slice(-10);
  const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
    method: "POST",
    headers: { authorization: key, "Content-Type": "application/json" },
    body: JSON.stringify({ route: "q", message, language: "english", flash: 0, numbers: digits }),
  });
  if (!res.ok) throw new Error(`Fast2SMS ${res.status}: ${await res.text()}`);
  return { skipped: false };
}

/** Email via SMTP using Nodemailer. Skipped when SMTP_HOST is not set. */
export async function sendEmail(to: string, subject: string, text: string): Promise<{ skipped: boolean }> {
  const host = Deno.env.get("SMTP_HOST");
  if (!host) return { skipped: true };
  const port = Number(Deno.env.get("SMTP_PORT") ?? "587");
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user: Deno.env.get("SMTP_USER"), pass: Deno.env.get("SMTP_PASS") },
  });
  await transporter.sendMail({
    from: Deno.env.get("SMTP_FROM") ?? "Khang Dimsum <no-reply@khang.local>",
    to,
    subject,
    text,
  });
  return { skipped: false };
}

/** Sends SMS + email for an order lifecycle event. Never throws: failures are returned for logging. */
export async function notifyOrder(order: NotifiableOrder, event: OrderEvent) {
  const msg = MESSAGES[event](order);
  const results = await Promise.allSettled([
    sendSms(order.customer_phone, msg.sms),
    order.customer_email ? sendEmail(order.customer_email, msg.subject, msg.text) : Promise.resolve({ skipped: true }),
  ]);
  return results.map((r) => (r.status === "fulfilled" ? r.value : { error: String(r.reason) }));
}
