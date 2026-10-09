import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** When env vars are missing the site runs in preview mode with the local menu data. */
export const isSupabaseConfigured = Boolean(url && anonKey && !url.includes("YOUR-PROJECT-REF"));

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;
