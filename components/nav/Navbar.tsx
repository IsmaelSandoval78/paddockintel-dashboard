import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/lib/i18n/navigation';
import { isMagazineHost } from '@/lib/siteMode';
import NavLinks from './NavLinks';
import LocaleSwitcher from './LocaleSwitcher';
import MobileNav from './MobileNav';
import MiBoxIndicator from './MiBoxIndicator';

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

export default async function Navbar() {
  const host = (await headers()).get('host') ?? '';
  const isMagazine = isMagazineHost(host);
  const current = isMagazine ? null : await getCurrentRound();

  return (
    <nav className="bg-bg border-b border-border sticky top-0 z-50 shrink-0">
      {/* Desktop — hidden below lg breakpoint (md/768 doesn't have room for brand + links + Vol/Rd + locale switcher) */}
      <div className="h-12 px-5 gap-8 hidden lg:flex items-center">
        <Link href="/" className="shrink-0 flex items-center">
          <span className="font-sans font-bold text-sm tracking-wider text-text-1">PADDOCK</span>
          <span className="font-sans font-bold text-sm text-red">·</span>
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
        </div>
      </div>

      {/* Mobile — hidden above md breakpoint */}
      <MobileNav isMagazine={isMagazine} />
    </nav>
  );
}
