import { createClient } from "@supabase/supabase-js";

// Service-role client: SERVER ONLY. Bypasses Row Level Security.
// Used to mediate parent (non-logged-in) reads/writes after the app has
// verified an invite code or a per-player access token. NEVER import this
// into a client component.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
