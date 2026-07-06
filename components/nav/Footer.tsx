import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';

const MAGAZINE_HOSTS = new Set(['paddockintel.com', 'www.paddockintel.com']);

// Magazine-only footer: the Hub keeps its own KineticFooter on the home
// experience, and Hub inner pages intentionally have none.
export default async function Footer() {
  const host = (await headers()).get('host')?.split(':')[0] ?? '';
  if (!MAGAZINE_HOSTS.has(host)) return null;

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
