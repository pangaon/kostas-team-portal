import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Coach-side client: uses the logged-in user's session (cookies) and the
// public anon key. Subject to Row Level Security — a coach only sees their team.
export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // called from a Server Component — middleware will refresh instead
          }
        },
      },
    }
  );
}
