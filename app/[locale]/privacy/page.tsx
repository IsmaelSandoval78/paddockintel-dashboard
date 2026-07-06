import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';

type PageParams = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'privacyPage' });
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

const MAIL = 'info@paddockintel.com';

function mailLink(chunks: React.ReactNode) {
  return (
    <a href={`mailto:${MAIL}`} className="text-red hover:underline">
      {chunks}
    </a>
  );
}

export default async function PrivacyPage({ params }: { params: PageParams }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'privacyPage' });

  const sections: { num: string; heading: string; body: React.ReactNode }[] = [
    { num: '01', heading: t('s1h'), body: t('s1p') },
    { num: '02', heading: t('s2h'), body: t('s2p') },
    { num: '03', heading: t('s3h'), body: t('s3p') },
    { num: '04', heading: t('s4h'), body: t.rich('s4p', { mail: mailLink }) },
    { num: '05', heading: t('s5h'), body: t('s5p') },
    {
      num: '06',
      heading: t('s6h'),
      body: t.rich('s6p', {
        mail: mailLink,
        about: (chunks) => (
          <Link href="/about" className="text-red hover:underline">
            {chunks}
          </Link>
        ),
      }),
    },
  ];

  return (
    <main className="bg-bg min-h-screen">
      <div className="max-w-2xl mx-auto px-5 py-12">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-2 mb-4">
          {t('kicker')}
        </p>
        <h1 className="font-display text-[clamp(1.8rem,4vw,2.8rem)] leading-[0.92] tracking-[-0.03em] text-text-1 mb-8">
          {t('title')}
        </h1>

        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-3 mb-8">
          {t('updated')}
        </p>

        <div className="space-y-8 font-sans text-text-1 leading-relaxed">
          {sections.map((s) => (
            <section key={s.num}>
              <h2 className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-2 mb-3 border-b border-border-subtle pb-2">
                {s.num} · {s.heading}
              </h2>
              <p>{s.body}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
