import { createAuthServerClient } from '@/lib/supabase/authServerClient';

// TEMPORARY — disposable verification endpoint. Returns auth.uid() as
// resolved by authServerClient.ts (Anon key + session cookie, RLS-aware —
// never lib/supabase/server.ts's Service Role key) as plain text, so the
// same session cookie can be checked for producing the same uid on both
// paddockintel.com and hub.paddockintel.com. Delete after the cross-domain
// verification is confirmed — see docs/ROADMAP-SEMANA.md, paso 6.
export async function GET() {
  const supabase = await createAuthServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return new Response('no session (' + (error?.message ?? 'no user') + ')', {
      status: 401,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
  return new Response(data.user.id, {
    headers: { 'Content-Type': 'text/plain' },
  });
}
