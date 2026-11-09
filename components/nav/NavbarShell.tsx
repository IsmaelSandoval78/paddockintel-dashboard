'use client';

import { useSelectedLayoutSegments } from 'next/navigation';
import { Link } from '@/lib/i18n/navigation';
import { useAuthUser } from '@/lib/auth/AuthContext';
import NavLinks from './NavLinks';
import SearchBar from './SearchBar';
import LocaleSwitcher from './LocaleSwitcher';
import MobileNav from './MobileNav';
import MiBoxIndicator from './MiBoxIndicator';
import AuthWidget from './AuthWidget';

// Hub chrome on the Hub's own routes (the (hub) route group: its home, circuits, drivers,
// constructors, compare, records), magazine chrome everywhere else. Decided by the route, not
// the request's host: reading the host made every page render per request instead of coming
// from the ISR cache (Search Console mobile LCP, 2026-11-09). The middleware already sends
// hub entity paths on www to hub.paddockintel.com, and the magazine pages served on the hub
// host canonicalize to www, so the route and the host agree wherever it matters.
function useIsMagazine(): boolean {
  const segments = useSelectedLayoutSegments();
  return segments[0] !== '(hub)';
}

export default function NavbarShell({ current }: { current: { round: number; year: number } | null }) {
  const isMagazine = useIsMagazine();
  const authUser = useAuthUser();

  return (
    <nav className="bg-surface sticky top-0 z-50 shrink-0" style={{ boxShadow: 'var(--shadow-card)' }}>
      {/* Desktop — hidden below lg breakpoint (md/768 doesn't have room for brand + links + Vol/Rd + locale switcher) */}
      <div className="h-12 px-5 gap-8 hidden lg:flex items-center">
        <Link href="/" className="shrink-0 flex items-center">
          <span className="font-sans font-bold text-sm tracking-wider text-text-1">PADDOCK</span>
          <span className="font-sans font-bold text-sm text-accent">·</span>
          <span className="font-sans font-bold text-sm tracking-wider text-text-1">INTEL</span>
        </Link>

        <NavLinks isMagazine={isMagazine} />

        <div className="flex items-center gap-5 shrink-0">
          {isMagazine && <SearchBar />}
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
