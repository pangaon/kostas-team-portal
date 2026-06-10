"use client";
import { createBrowserClient } from "@supabase/ssr";

// Browser client that carries the signed-in coach's session via cookies,
// so Realtime subscriptions are authorized under RLS.
let _client: ReturnType<typeof createBrowserClient> | null = null;
export function supabaseBrowser() {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  _client = createBrowserClient(url, key);
  return _client;
}
