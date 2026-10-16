import NextLink from 'next/link';
import { useLocale } from 'next-intl';
import type { ReactNode } from 'react';
import { Link } from '@/lib/i18n/navigation';

type Props = { href: string; className?: string; onClick?: () => void; children: ReactNode };

// next-intl's Link, except that on a pt page a /feed path links the en page. The Feed
// (digest_items) is EN/ES only, with no pt edition (EDITORIAL.md, "The Feed"), and /pt/feed/*
// 308s to en (next.config.ts). A plain link because next-intl's Link with locale="en" forces the
// /en/ prefix, which redirects too.
export default function FeedLink({ href, ...rest }: Props) {
  const locale = useLocale();
  if (locale === 'pt' && /^\/feed(\/|$)/.test(href)) return <NextLink href={href} {...rest} />;
  return <Link href={href} {...rest} />;
}
