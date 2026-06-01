import { Link } from '@/lib/i18n/navigation';
import NavLinks from './NavLinks';
import LocaleSwitcher from './LocaleSwitcher';

export default function Navbar() {
  return (
    <nav className="h-12 bg-bg border-b border-border flex items-center px-5 gap-8 sticky top-0 z-50 shrink-0">
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
    </nav>
  );
}
