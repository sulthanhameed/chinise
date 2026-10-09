import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically into Edge Functions.
// The service-role client bypasses RLS, so only call it after validating input / auth.
export function adminClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Returns the auth user id for a Bearer JWT, or null for guests / invalid tokens. */
export async function userIdFromRequest(req: Request, admin: SupabaseClient): Promise<string | null> {
  const header = req.headers.get("Authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

export async function isAdmin(admin: SupabaseClient, userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const { data } = await admin.from("profiles").select("role").eq("id", userId).maybeSingle();
  return data?.role === "admin";
}
