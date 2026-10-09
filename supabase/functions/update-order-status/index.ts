import { corsHeaders, fail, json } from "../_shared/cors.ts";
import { adminClient, isAdmin, userIdFromRequest } from "../_shared/supabase.ts";
import { notifyOrder, OrderEvent } from "../_shared/notify.ts";

const STATUSES = ["received", "preparing", "out_for_delivery", "delivered", "cancelled"] as const;
type Status = (typeof STATUSES)[number];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return fail("Method not allowed", 405);

  const admin = adminClient();
  const userId = await userIdFromRequest(req, admin);
  if (!(await isAdmin(admin, userId))) return fail("Admins only", 403);

  let body: { order_id?: string; order_code?: string; status?: Status; mark_paid?: boolean };
  try {
    body = await req.json();
  } catch {
    return fail("Malformed JSON");
  }
  if (!body.status || !STATUSES.includes(body.status)) return fail("Invalid status");
  if (!body.order_id && !body.order_code) return fail("order_id or order_code is required");

  let query = admin.from("orders").update({
    status: body.status,
    ...(body.mark_paid ? { payment_status: "paid" } : {}),
  });
  query = body.order_id ? query.eq("id", body.order_id) : query.eq("order_code", body.order_code!.toUpperCase());
  const { data: order, error } = await query.select("*").maybeSingle();
  if (error || !order) return fail("Order not found", 404);

  let notifications: unknown = null;
  if (["preparing", "out_for_delivery", "delivered"].includes(body.status)) {
    notifications = await notifyOrder(order, body.status as OrderEvent);
  }
  return json({ order, notifications });
});
