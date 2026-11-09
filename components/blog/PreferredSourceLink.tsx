import { getTranslations } from 'next-intl/server';

// Google's "preferred sources" deeplink (developers.google.com/search/docs/appearance/preferred-sources):
// it opens Google's source preferences tool on our domain, where a reader can pick PaddockIntel so
// our stories show up more often for them in Top Stories. The deeplink, not Google's JavaScript
// button: that would load a third-party script (news.google.com/swg) on every page, against the
// privacy policy's "no cross-site trackers" and the performance budget. Google allows a custom badge.
export const PREFERRED_SOURCE_URL = 'https://www.google.com/preferences/source?q=paddockintel.com';

export default async function PreferredSourceLink() {
  const t = await getTranslations('preferredSource');
  return (
    <aside className="my-8 rounded-[var(--radius-md)] border border-[color:var(--border)] px-5 py-4">
      <p className="m-0 mb-3 text-[15px] leading-[1.5] text-[color:var(--text-2)]">{t('pitch')}</p>
      <a
        href={PREFERRED_SOURCE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 font-mono uppercase text-[11px] tracking-[0.1em] bg-[color:var(--accent)] text-[color:var(--bg)] hover:opacity-90 transition-opacity duration-150"
      >
        {t('button')} ↗
      </a>
    </aside>
  );
}
