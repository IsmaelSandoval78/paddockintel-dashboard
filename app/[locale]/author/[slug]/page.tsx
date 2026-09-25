import { notFound } from 'next/navigation';
import { redirect } from '@/lib/i18n/navigation';
import type { Locale } from '@/lib/i18n/routing';

// EEAT-EXPERT.md requires every article/digest issue link to a real author
// identity at `/about` OR `/author/ismael-sandoval` — both are accepted
// because PaddockIntel has exactly one author today. `/about` already
// carries the full, real bio (career history, philosophy, clients) and is
// what every article's JSON-LD `author.url` already points to. Rather than
// fork that into a second, thinner page (near-duplicate content is its own
// EEAT/SEO liability), `/author/[slug]` resolves to the same identity by
// redirecting there — so the URL the advisor doc names by name is a real,
// working page instead of a 404, without splitting authority across two
// pages that would say almost the same thing.
const KNOWN_AUTHOR_SLUGS = ['ismael-sandoval'];

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!KNOWN_AUTHOR_SLUGS.includes(slug)) notFound();
  redirect({ href: '/about', locale });
}
