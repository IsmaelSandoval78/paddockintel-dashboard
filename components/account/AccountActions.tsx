'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

// LEGAL-COMPLIANCE-EXPERT.md: the privacy policy promises deletion and
// export work — this is the actual, working self-serve path behind that
// promise (app/api/account/delete, app/api/account/export). Deletion asks
// for one explicit confirmation click rather than a native confirm()
// dialog, so the UI itself states what's about to happen instead of
// relying on a browser-chrome prompt whose wording this site doesn't
// control.
export default function AccountActions() {
  const t = useTranslations('accountPage');
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    setError(false);
    const res = await fetch('/api/account/delete', { method: 'POST' });
    if (res.ok) {
      window.location.href = '/';
      return;
    }
    setDeleting(false);
    setError(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-2 mb-2">
          {t('exportHeading')}
        </p>
        <p className="font-prose text-sm text-text-2 leading-relaxed mb-3">{t('exportBody')}</p>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a
            real browser navigation, not a Next route: only a full request
            to this API route triggers the Content-Disposition download. */}
        <a
          href="/api/account/export"
          className="inline-block border border-border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.08em] text-text-1 hover:border-terracotta hover:text-terracotta transition-colors duration-150"
        >
          {t('exportButton')}
        </a>
      </div>

      <div className="border-t border-border pt-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-2 mb-2">
          {t('deleteHeading')}
        </p>
        <p className="font-prose text-sm text-text-2 leading-relaxed mb-3">{t('deleteBody')}</p>

        {!confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="border border-border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.08em] text-text-1 hover:border-terracotta hover:text-terracotta transition-colors duration-150"
          >
            {t('deleteButton')}
          </button>
        ) : (
          <div className="border border-terracotta p-4 flex flex-col gap-3">
            <p className="font-prose text-sm text-text-1 leading-relaxed">{t('confirmBody')}</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="border border-terracotta bg-terracotta px-4 py-2 font-mono text-[11px] uppercase tracking-[0.08em] text-bg hover:opacity-90 transition-opacity duration-150 disabled:opacity-50"
              >
                {deleting ? t('deleting') : t('confirmButton')}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={deleting}
                className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-3 hover:text-text-1 transition-colors duration-150"
              >
                {t('cancelButton')}
              </button>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-3 font-mono text-[11px] text-terracotta">{t('deleteError')}</p>
        )}
      </div>
    </div>
  );
}
