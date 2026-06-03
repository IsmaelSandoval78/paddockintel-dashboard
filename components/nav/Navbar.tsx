import { Link } from '@/lib/i18n/navigation';
import NavLinks from './NavLinks';
import LocaleSwitcher from './LocaleSwitcher';
import MobileNav from './MobileNav';

export default function Navbar() {
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
            Vol.01 · Rd.09 · 2026
          </span>
          <LocaleSwitcher />
        </div>
      </div>

      {/* Mobile — hidden above md breakpoint */}
      <MobileNav />
    </nav>
  );
}
