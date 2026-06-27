import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Link,
} from '@react-email/components';

export type DigestItem = {
  id: string;
  source_name: string;
  source_url: string;
  headline: string;
  our_summary: string;
};

export type DigestIssueEmailProps = {
  slug: string;
  publishedAt: string;
  introSynthesis: string;
  items: DigestItem[];
  issueUrl: string;
  unsubscribeUrl: string;
};

export default function DigestIssueEmail({
  publishedAt,
  introSynthesis,
  items,
  issueUrl,
  unsubscribeUrl,
}: DigestIssueEmailProps) {
  const date = new Date(publishedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const bg = '#F4F4F0';
  const ink = '#0A0A0A';
  const muted = '#6B6B6B';
  const ghost = '#B5B4AE';
  const red = '#E61919';
  const mono = 'ui-monospace, "JetBrains Mono", "Courier New", monospace';
  const sans = 'ui-sans-serif, system-ui, -apple-system, sans-serif';
  const border = '1px solid #0A0A0A';
  const borderSubtle = '1px solid #B5B4AE';

  return (
    <Html lang="en">
      <Head />
      <Preview>PaddockIntel Weekly Digest — {date}</Preview>
      <Body style={{ backgroundColor: bg, margin: '0', padding: '0' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '0', backgroundColor: bg }}>

          {/* Header */}
          <Section style={{ borderBottom: border, padding: '20px 24px 14px' }}>
            <Text style={{ margin: '0', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: muted, fontFamily: mono }}>
              PaddockIntel
            </Text>
            <Text style={{ margin: '4px 0 0', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: ghost, fontFamily: mono }}>
              Weekly Digest · {date}
            </Text>
          </Section>

          {/* Synthesis */}
          <Section style={{ padding: '24px 24px 20px', borderBottom: borderSubtle }}>
            <Text style={{ margin: '0', fontSize: '15px', lineHeight: '1.65', color: ink, fontFamily: sans }}>
              {introSynthesis}
            </Text>
          </Section>

          {/* Sources label */}
          <Section style={{ padding: '10px 24px', borderBottom: borderSubtle }}>
            <Text style={{ margin: '0', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: muted, fontFamily: mono }}>
              Sources
            </Text>
          </Section>

          {/* Items */}
          {items.map((item, i) => (
            <Section key={item.id} style={{ padding: '16px 24px', borderBottom: borderSubtle }}>
              <Text style={{ margin: '0 0 4px', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: muted, fontFamily: mono }}>
                {i + 1}. {item.source_name}
              </Text>
              <Link
                href={`${item.source_url}?ref=paddockintel.com`}
                style={{ fontSize: '14px', fontWeight: 'bold', color: ink, textDecoration: 'none', lineHeight: '1.3', fontFamily: sans, display: 'block', marginBottom: '6px' }}
              >
                {item.headline}
              </Link>
              <Text style={{ margin: '0', fontSize: '13px', color: muted, lineHeight: '1.55', fontFamily: sans }}>
                {item.our_summary}
              </Text>
            </Section>
          ))}

          {/* Footer */}
          <Section style={{ borderTop: border, padding: '16px 24px' }}>
            <Text style={{ margin: '0 0 8px', fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: mono }}>
              <Link href={issueUrl} style={{ color: ink, textDecoration: 'none' }}>
                Read on web →
              </Link>
              <span style={{ color: ghost }}>{' · '}</span>
              <Link href="https://paddockintel.com/about" style={{ color: ghost, textDecoration: 'none' }}>
                By Ismael Sandoval
              </Link>
            </Text>
            <Text style={{ margin: '0', fontSize: '10px', color: ghost, fontFamily: mono }}>
              <Link href={unsubscribeUrl} style={{ color: ghost, textDecoration: 'underline', fontSize: '10px' }}>
                Unsubscribe
              </Link>
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}
