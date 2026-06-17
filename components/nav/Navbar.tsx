import { createClient } from '@/lib/supabase/server';
import { Link } from '@/lib/i18n/navigation';
import NavLinks from './NavLinks';
import LocaleSwitcher from './LocaleSwitcher';
import MobileNav from './MobileNav';

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
  const current = await getCurrentRound();

  return (
    <nav className="bg-bg border-b border-border sticky top-0 z-50 shrink-0">
      {/* Desktop — hidden below md breakpoint */}
      <div className="h-12 px-5 gap-8 hidden md:flex items-center">
        <Link href="/" className="shrink-0 flex items-center">
          <span className="font-sans font-bold text-sm tracking-wider text-text-1">PADDOCK</span>
          <span className="font-sans font-bold text-sm text-red">·</span>
          <span className="font-sans font-bold text-sm tracking-wider text-text-1">INTEL</span>
        </Link>

        <NavLinks />

        <div className="flex items-center gap-5 shrink-0">
          <span className="font-mono text-xs text-text-3 tracking-[0.04em]">
            Vol.01 · Rd.{current ? String(current.round).padStart(2, '0') : '—'} · {current?.year ?? '—'}
          </span>
          <LocaleSwitcher />
        </div>
      </div>

      {/* Mobile — hidden above md breakpoint */}
      <MobileNav />
    </nav>
  );
}
