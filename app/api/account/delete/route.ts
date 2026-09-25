import { NextResponse } from 'next/server';
import { createAuthServerClient } from '@/lib/supabase/authServerClient';
import { createClient as createServiceRoleClient } from '@/lib/supabase/server';

// LEGAL-COMPLIANCE-EXPERT.md non-negotiable: the deletion path the privacy
// policy promises must actually exist and work, not just be a documented
// "email us" process. This is the real path.
//
// Every user-data table (user_profiles, driver_follows, constructor_follows,
// expert_follows) declares `user_id/id ... references auth.users(id) on
// delete cascade` (supabase/migrations/20260906120000_user_accounts.sql) —
// so deleting the auth.users row is sufficient; there is no row left behind
// to clean up separately.
//
// auth.admin.deleteUser() requires the Service Role key, which is why this
// is the one place in the account-deletion path that imports
// lib/supabase/server.ts instead of authServerClient.ts. The two-step
// pattern matters: first confirm who the caller actually is via the
// session-cookie-scoped client (never trust a client-supplied user id),
// then use the service-role client only to perform the deletion of that
// exact, server-verified id.
export async function POST() {
  const authClient = await createAuthServerClient();
  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
  }

  const admin = createServiceRoleClient();
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    return NextResponse.json({ error: 'delete_failed' }, { status: 500 });
  }

  // The auth user is gone, but the httpOnly session cookie is still set —
  // signOut() here writes the clearing Set-Cookie via authServerClient's
  // cookies() adapter, same mechanism and same reasoning as
  // app/api/auth/signout/route.ts.
  await authClient.auth.signOut();

  return NextResponse.json({ ok: true });
}
