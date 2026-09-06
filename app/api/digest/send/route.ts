import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { createClient } from '@/lib/supabase/server';
import DigestIssueEmail from '@/emails/DigestIssueEmail';

// Called by Vercel Cron (daily). Finds published issues with sent_at IS NULL
// and sends a batch email to all subscribers, then stamps sent_at.
export async function GET(req: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const FROM = process.env.RESEND_FROM_EMAIL ?? 'info@paddockintel.com';
  const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://paddockintel.com';
  const auth = req.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient();

  const { data: issues } = await supabase
    .from('digest_issues')
    .select('id, slug, published_at, intro_synthesis')
    .eq('status', 'published')
    .eq('series', 'newsletter')
    .is('sent_at', null);

  if (!issues?.length) {
    return NextResponse.json({ message: 'no issues to send' });
  }

  const { data: subscribers } = await supabase
    .from('subscribers')
    .select('email');

  if (!subscribers?.length) {
    return NextResponse.json({ message: 'no subscribers' });
  }

  const sent: string[] = [];

  for (const issue of issues) {
    const { data: items } = await supabase
      .from('digest_items')
      .select('id, source_name, source_url, headline, our_summary')
      .eq('issue_id', issue.id)
      .order('published_at', { ascending: true });

    const issueUrl = `${SITE}/weekly/${issue.slug}/`;
    const dateStr = new Date(issue.published_at as string).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    const subject = `Weekly Digest — ${dateStr}`;

    const mappedItems = (items ?? []).map((item) => ({
      id: item.id as string,
      source_name: item.source_name as string,
      source_url: item.source_url as string,
      headline: item.headline as string,
      our_summary: item.our_summary as string,
    }));

    // render() is async in @react-email/render v2 — resolve per-subscriber HTML in parallel
    const batchPayload = await Promise.all(
      subscribers.map(async (s) => {
        const unsubUrl = `${SITE}/api/unsubscribe?email=${encodeURIComponent(s.email as string)}`;
        const html = await render(
          DigestIssueEmail({
            slug: issue.slug as string,
            publishedAt: issue.published_at as string,
            introSynthesis: issue.intro_synthesis as string,
            items: mappedItems,
            issueUrl,
            unsubscribeUrl: unsubUrl,
          })
        );
        return {
          from: `PaddockIntel Digest <${FROM}>`,
          to: s.email as string,
          subject,
          html,
        };
      })
    );

    // Resend batch limit: 100 per call
    for (let i = 0; i < batchPayload.length; i += 100) {
      await resend.batch.send(batchPayload.slice(i, i + 100));
    }

    await supabase
      .from('digest_issues')
      .update({ sent_at: new Date().toISOString() })
      .eq('id', issue.id);

    sent.push(issue.slug as string);
  }

  return NextResponse.json({ sent });
}
