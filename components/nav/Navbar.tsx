import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAuthServerClient } from '@/lib/supabase/authServerClient';
import { Link } from '@/lib/i18n/navigation';
import { isMagazineHost } from '@/lib/siteMode';
import NavLinks from './NavLinks';
import LocaleSwitcher from './LocaleSwitcher';
import MobileNav from './MobileNav';
import MiBoxIndicator from './MiBoxIndicator';
import AuthWidget, { type AuthUser } from './AuthWidget';

async function getCurrentRound(): Promise<{ round: number; year: number } | null> {
  try {
    const supabase = createClient();
    const { data: ds } = await supabase
      .from('driver_standings')
      .select('race_id')
      .order('race_id', { ascending: false })
      .limit(1)
      .single();
    if (!ds) return null;
    const { data: race } = await supabase
      .from('races')
      .select('round, year')
      .eq('id', ds.race_id)
      .single();
    return race ? { round: race.round as number, year: race.year as number } : null;
  } catch {
    return null;
  }
}

async function getCurrentAuthUser(): Promise<AuthUser | null> {
  // getUser() (validated server-side against Supabase Auth), never
  // getSession() — same reasoning as app/api/auth/callback/route.ts and the
  // deleted /api/auth/whoami harness: cookie-decoded session data isn't
  // cryptographically verified on its own. Returns null fast when there's no
  // session cookie at all, so this stays cheap for the anonymous majority of
  // requests.
  const supabase = await createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const metadata = user.user_metadata as Record<string, unknown> | null;
  const name = (metadata?.full_name as string | undefined) ?? (metadata?.name as string | undefined) ?? null;
  return { email: user.email ?? '', name };
}

export default async function Navbar() {
  const host = (await headers()).get('host') ?? '';
  const isMagazine = isMagazineHost(host);
  const [current, authUser] = await Promise.all([
    isMagazine ? Promise.resolve(null) : getCurrentRound(),
    getCurrentAuthUser(),
  ]);

  return (
    <nav className="bg-bg border-b border-border sticky top-0 z-50 shrink-0">
      {/* Desktop — hidden below lg breakpoint (md/768 doesn't have room for brand + links + Vol/Rd + locale switcher) */}
      <div className="h-12 px-5 gap-8 hidden lg:flex items-center">
        <Link href="/" className="shrink-0 flex items-center">
          <span className="font-sans font-bold text-sm tracking-wider text-text-1">PADDOCK</span>
          <span className="font-sans font-bold text-sm text-terracotta">·</span>
          <span className="font-sans font-bold text-sm tracking-wider text-text-1">INTEL</span>
        </Link>

        <NavLinks isMagazine={isMagazine} />

        <div className="flex items-center gap-5 shrink-0">
          {!isMagazine && (
            <>
              <span className="font-mono text-xs text-text-3 tracking-[0.04em]">
                Vol.01 · Rd.{current ? String(current.round).padStart(2, '0') : '—'} · {current?.year ?? '—'}
              </span>
              <MiBoxIndicator />
            </>
          )}
          <LocaleSwitcher />
          <AuthWidget user={authUser} />
        </div>
      </div>

      {/* Mobile — hidden above md breakpoint */}
      <MobileNav isMagazine={isMagazine} authUser={authUser} />
    </nav>
  );
}
