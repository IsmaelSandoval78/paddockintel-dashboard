import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { localeUrl } from '@/lib/site-url';

// Shared across the Hub and the magazine — the Hub home also keeps its own
// animated KineticFooter above this one; this is the functional/legal
// footer (About, Privacy) every page needs regardless of surface.
export default async function Footer() {
  const t = await getTranslations('footer');
  const locale = await getLocale();

  return (
    <footer className="border-t border-border">
      <div className="max-w-5xl mx-auto px-5 py-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-3 leading-relaxed">
          {t('disclaimer')}
        </p>
        <nav className="flex items-center gap-5 shrink-0">
          {/* Absolute: the data cards live on the magazine host, this footer also renders on the Hub. */}
          <a
            href={localeUrl(locale, '/data/')}
            className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-2 hover:text-text-1 transition-colors duration-150"
          >
            {t('data')}
          </a>
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
