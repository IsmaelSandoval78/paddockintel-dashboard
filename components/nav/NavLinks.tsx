'use client';

import { useTranslations } from 'next-intl';
import { usePathname, Link } from '@/lib/i18n/navigation';

type NavKey = 'hub' | 'circuits' | 'drivers' | 'constructors' | 'compare';

const links: { key: NavKey; href: string }[] = [
  { key: 'hub', href: '/' },
  { key: 'circuits', href: '/circuits' },
  { key: 'drivers', href: '/drivers' },
  { key: 'constructors', href: '/constructors' },
  { key: 'compare', href: '/compare' },
];

export default function NavLinks() {
  const t = useTranslations('nav');
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-6 flex-1">
      {links.map(({ key, href }) => {
        const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link
            key={key}
            href={href}
            className={[
              'font-sans text-[13px] font-medium no-underline transition-colors duration-150',
              isActive ? 'text-text-1' : 'text-text-2 hover:text-text-1',
            ].join(' ')}
          >
            {t(key)}
          </Link>
        );
      })}
    </div>
  );
}
