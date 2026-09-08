import { createAuthServerClient } from '@/lib/supabase/authServerClient';
import type { AuthUser } from '@/components/nav/AuthWidget';

// getUser() (validated server-side against Supabase Auth), never
// getSession() — same reasoning as app/api/auth/callback/route.ts and the
// deleted /api/auth/whoami harness: cookie-decoded session data isn't
// cryptographically verified on its own. Returns null fast when there's no
// session cookie at all, so this stays cheap for the anonymous majority of
// requests.
//
// Called exactly once per request, from app/[locale]/layout.tsx — Navbar.tsx
// receives the result as a prop instead of calling this itself, so it's
// never fetched twice for the same request.
export async function getCurrentAuthUser(): Promise<AuthUser | null> {
  const supabase = await createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const metadata = user.user_metadata as Record<string, unknown> | null;
  const name = (metadata?.full_name as string | undefined) ?? (metadata?.name as string | undefined) ?? null;
  return { email: user.email ?? '', name };
}
