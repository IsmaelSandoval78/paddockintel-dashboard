import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';

// Shared across the Hub and the magazine — the Hub home also keeps its own
// animated KineticFooter above this one; this is the functional/legal
// footer (About, Privacy) every page needs regardless of surface.
export default async function Footer() {
  const t = await getTranslations('footer');

  return (
    <footer className="border-t border-border">
      <div className="max-w-5xl mx-auto px-5 py-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-3 leading-relaxed">
          {t('disclaimer')}
        </p>
        <nav className="flex items-center gap-5 shrink-0">
          <Link
            href="/about"
            className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-2 hover:text-text-1 transition-colors duration-150"
          >
            {t('about')}
          </Link>
          <Link
            href="/privacy"
            className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-2 hover:text-text-1 transition-colors duration-150"
          >
            {t('privacy')}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
