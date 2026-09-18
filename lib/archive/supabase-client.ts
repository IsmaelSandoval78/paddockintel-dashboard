// UNUSED as of 2026-09-18 — already marked "currently unused" in
// lib/supabase/authBrowserClient.ts's own comment before this move. The browser-side
// Supabase client was never adopted; authBrowserClient.ts is the real client-side
// auth client in use.

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

let instance: ReturnType<typeof createSupabaseClient> | undefined;

export function createClient() {
  if (!instance) {
    instance = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return instance;
}
