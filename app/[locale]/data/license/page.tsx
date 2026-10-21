import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { localizedPageMeta } from '@/lib/seo';
import { LICENSE_URL, asCardLocale } from '@/lib/dataCards';
import { localeUrl } from '@/lib/site-url';
import { duskSans } from '../../(blog)/dusk-font';
import '../../(blog)/dusk.css';

type PageParams = Promise<{ locale: string }>;

// The acquireLicensePage every data card's ImageObject points to (Google Images "Licensable").
export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const locale = asCardLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: 'dataCards' });
  return {
    title: t('licenseMetaTitle'),
    description: t('licenseMetaDescription'),
    ...localizedPageMeta(locale, '/data/license/'),
  };
}

export default async function DataLicensePage({ params }: { params: PageParams }) {
  const locale = asCardLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: 'dataCards' });
  const example = t('attributionText', { url: localeUrl(locale, '/data/<slug>/') });
  const p = 'font-prose text-[clamp(17px,1.25vw,19px)] leading-[1.7] m-0 mb-[1.1em]';

  return (
    <main className={`theme-dusk ${duskSans.variable} min-h-screen`}>
      <div className="max-w-[1180px] mx-auto px-4 sm:px-5 pt-6 pb-16 flex flex-col gap-4">
        <nav aria-label={t('crumbsAria')} className="dusk-mono text-[11.5px] tracking-[0.04em] text-[color:var(--dusk-muted)]">
          <Link href="/" className="hover:text-[color:var(--dusk-ink)]">{t('crumbHome')}</Link>
          {' / '}
          <Link href="/data" className="hover:text-[color:var(--dusk-ink)]">{t('indexTitle')}</Link>
        </nav>
        <article className="dusk-sheet relative rounded-[24px] px-4 py-7 md:px-10 md:py-10 lg:px-14 lg:py-12">
          <div className="max-w-[64ch] mx-auto">
            <h1 className="dusk-display text-[clamp(1.8rem,3.6vw,2.6rem)] leading-[1.08] tracking-[-0.02em] m-0 mb-6">{t('licenseTitle')}</h1>
            <p className={p}>{t('licenseP1')}</p>
            <p className={p}>{t('licenseP2')}</p>
            <p className="m-0 mb-1 font-mono text-[11px] uppercase tracking-[0.06em] text-[color:var(--text-3)]">{t('licenseExampleLabel')}</p>
            <p className="m-0 mb-6 rounded-[var(--radius-sm)] bg-[color:var(--surface)] border border-[color:var(--border)] px-4 py-3 text-[15px] break-words">{example}</p>
            <p className={p}>{t('licenseP3')}</p>
            <p className={p}>{t('licenseP4')}</p>
            <p className="m-0">
              <a href={LICENSE_URL} target="_blank" rel="license noopener noreferrer" className="font-semibold text-[color:var(--accent)] hover:underline">
                {t('licenseFull')} ↗
              </a>
            </p>
          </div>
        </article>
      </div>
    </main>
  );
}
