'use server';

import { createAuthServerClient } from '@/lib/supabase/authServerClient';
import { checkFollowRateLimit } from './rateLimit';

// The only place (besides the one-time login import below) that touches
// driver_follows/constructor_follows. Always goes through
// authServerClient.ts (Anon key + session cookie, RLS-aware) — never
// lib/supabase/server.ts, which would bypass RLS and let this code read or
// write any user's rows, not just the caller's own.

export type FollowKind = 'driver' | 'constructor';

export type FollowRefs = {
  drivers: string[];
  constructors: string[];
};

type ToggleResult = { followed: boolean } | { error: 'not_authenticated' | 'rate_limited' | 'not_found' | string };

function tableFor(kind: FollowKind) {
  return kind === 'driver'
    ? { followTable: 'driver_follows' as const, entityTable: 'drivers' as const, refColumn: 'driver_ref' as const, idColumn: 'driver_id' as const }
    : { followTable: 'constructor_follows' as const, entityTable: 'constructors' as const, refColumn: 'constructor_ref' as const, idColumn: 'constructor_id' as const };
}

// Reads the signed-in user's current follows, translated back from the
// integer driver_id/constructor_id FKs to the driver_ref/constructor_ref
// strings every UI component already works in terms of (matching
// lib/miBox.ts's cookie shape, so the two are interchangeable to callers).
// Returns empty lists for a signed-out request — callers decide what that
// means (useFollows.ts falls back to the cookie in that case).
export async function getFollowedRefs(): Promise<FollowRefs> {
  const supabase = await createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { drivers: [], constructors: [] };

  // Two plain queries per entity kind (ids, then refs) instead of a nested
  // select — matches the existing pattern in app/api/mi-box/summary/route.ts
  // rather than relying on the client's embedded-resource type inference.
  const [driverFollowRows, constructorFollowRows] = await Promise.all([
    supabase.from('driver_follows').select('driver_id').eq('user_id', user.id),
    supabase.from('constructor_follows').select('constructor_id').eq('user_id', user.id),
  ]);

  const driverIds = (driverFollowRows.data ?? []).map((row) => row.driver_id as number);
  const constructorIds = (constructorFollowRows.data ?? []).map((row) => row.constructor_id as number);

  const [driverRows, constructorRows] = await Promise.all([
    driverIds.length
      ? supabase.from('drivers').select('driver_ref').in('id', driverIds)
      : Promise.resolve({ data: [] as Array<{ driver_ref: string }> }),
    constructorIds.length
      ? supabase.from('constructors').select('constructor_ref').in('id', constructorIds)
      : Promise.resolve({ data: [] as Array<{ constructor_ref: string }> }),
  ]);

  return {
    drivers: (driverRows.data ?? []).map((row) => row.driver_ref as string),
    constructors: (constructorRows.data ?? []).map((row) => row.constructor_ref as string),
  };
}

// Toggles one follow row. Server-side re-validation on every call, never
// trusting the client's optimistic UI state (docs/advisors/
// CYBERSECURITY-EXPERT.md: "validate and sanitize server-side, never trust
// that client-side validation was actually run"):
//   - real session required (getUser(), not a decoded-but-unverified cookie)
//   - real rate limit (see rateLimit.ts)
//   - the ref must resolve to a real row in drivers/constructors — a typo'd
//     or fabricated ref fails closed with 'not_found', never silently
//     creates a dangling reference
export async function toggleFollow(kind: FollowKind, ref: string): Promise<ToggleResult> {
  const supabase = await createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'not_authenticated' };

  if (!checkFollowRateLimit(user.id)) return { error: 'rate_limited' };

  const { followTable, entityTable, refColumn, idColumn } = tableFor(kind);

  const { data: entity } = await supabase.from(entityTable).select('id').eq(refColumn, ref).single();
  if (!entity) return { error: 'not_found' };

  const { data: existing } = await supabase
    .from(followTable)
    .select('id')
    .eq('user_id', user.id)
    .eq(idColumn, entity.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from(followTable).delete().eq('id', existing.id);
    if (error) return { error: error.message };
    return { followed: false };
  }

  const { error } = await supabase.from(followTable).insert({ user_id: user.id, [idColumn]: entity.id });
  if (error) return { error: error.message };
  return { followed: true };
}

// Called exactly once, from app/api/auth/callback/route.ts, right after a
// real login completes. Never overwrites an account's own existing
// follows — if the account already has any driver_follows or
// constructor_follows rows (e.g. this isn't actually the first login, or
// the account was used from another browser before), the guest cookie's
// contents are simply discarded, not merged. Invalid/typo'd refs from a
// malformed cookie are silently dropped via the `in()` filter rather than
// erroring the whole login.
export async function importMiBoxFollowsOnLogin(cookieRefs: FollowRefs): Promise<void> {
  if (cookieRefs.drivers.length === 0 && cookieRefs.constructors.length === 0) return;

  const supabase = await createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const [{ count: driverFollowCount }, { count: constructorFollowCount }] = await Promise.all([
    supabase.from('driver_follows').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('constructor_follows').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
  ]);
  if ((driverFollowCount ?? 0) + (constructorFollowCount ?? 0) > 0) return;

  if (cookieRefs.drivers.length > 0) {
    const { data: drivers } = await supabase.from('drivers').select('id').in('driver_ref', cookieRefs.drivers);
    const rows = (drivers ?? []).map((d) => ({ user_id: user.id, driver_id: d.id }));
    if (rows.length > 0) await supabase.from('driver_follows').insert(rows);
  }

  if (cookieRefs.constructors.length > 0) {
    const { data: constructors } = await supabase.from('constructors').select('id').in('constructor_ref', cookieRefs.constructors);
    const rows = (constructors ?? []).map((c) => ({ user_id: user.id, constructor_id: c.id }));
    if (rows.length > 0) await supabase.from('constructor_follows').insert(rows);
  }
}
