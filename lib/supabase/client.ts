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
