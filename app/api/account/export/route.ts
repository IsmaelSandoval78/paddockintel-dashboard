import { NextResponse } from 'next/server';
import { createAuthServerClient } from '@/lib/supabase/authServerClient';

// LEGAL-COMPLIANCE-EXPERT.md data-subject-rights non-negotiable: an export
// path that actually returns the account data, not just a promise to email
// it. Scoped to exactly what the privacy policy discloses collecting —
// display name, email, and followed drivers/constructors — via the
// session-cookie-scoped, RLS-aware client (never the Service Role key: this
// only ever needs to read the caller's own rows, which RLS already
// guarantees).
export async function GET() {
  const supabase = await createAuthServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
  }

  const [profileRes, driverFollowRows, constructorFollowRows] = await Promise.all([
    supabase.from('user_profiles').select('display_name, created_at').eq('id', user.id).maybeSingle(),
    supabase.from('driver_follows').select('driver_id, created_at').eq('user_id', user.id),
    supabase.from('constructor_follows').select('constructor_id, created_at').eq('user_id', user.id),
  ]);

  const driverIds = (driverFollowRows.data ?? []).map((row) => row.driver_id as number);
  const constructorIds = (constructorFollowRows.data ?? []).map((row) => row.constructor_id as number);

  // Two-step id-then-ref lookup, matching getFollowedRefs() in
  // lib/follows/actions.ts, rather than a nested embedded select.
  const [driverRefRows, constructorRefRows] = await Promise.all([
    driverIds.length
      ? supabase.from('drivers').select('id, driver_ref').in('id', driverIds)
      : Promise.resolve({ data: [] as Array<{ id: number; driver_ref: string }> }),
    constructorIds.length
      ? supabase.from('constructors').select('id, constructor_ref').in('id', constructorIds)
      : Promise.resolve({ data: [] as Array<{ id: number; constructor_ref: string }> }),
  ]);

  const followedAtByDriverId = new Map((driverFollowRows.data ?? []).map((r) => [r.driver_id, r.created_at]));
  const followedAtByConstructorId = new Map(
    (constructorFollowRows.data ?? []).map((r) => [r.constructor_id, r.created_at])
  );

  const exportData = {
    exported_at: new Date().toISOString(),
    account: {
      email: user.email,
      display_name: profileRes.data?.display_name ?? null,
      account_created_at: profileRes.data?.created_at ?? user.created_at,
    },
    followed_drivers: (driverRefRows.data ?? []).map((row) => ({
      driver_ref: row.driver_ref,
      followed_at: followedAtByDriverId.get(row.id) ?? null,
    })),
    followed_constructors: (constructorRefRows.data ?? []).map((row) => ({
      constructor_ref: row.constructor_ref,
      followed_at: followedAtByConstructorId.get(row.id) ?? null,
    })),
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="paddockintel-data-export.json"',
    },
  });
}
