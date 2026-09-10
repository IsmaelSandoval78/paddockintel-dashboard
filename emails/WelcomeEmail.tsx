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

export type WelcomeEmailLocale = 'en' | 'es' | 'pt';

export type WelcomeEmailProps = {
  locale: WelcomeEmailLocale;
  archiveUrl: string;
  aboutUrl: string;
  unsubscribeUrl: string;
};

// Copy lives here, not in the next-intl locale JSON catalogs — this mirrors
// DigestIssueEmail.tsx, the only other transactional email in the project,
// which does the same. Email templates render server-side via
// @react-email/render outside the Next.js request tree, so next-intl's
// hook-based translations don't apply here anyway.
//
// EN is source of truth. ES uses neutral tuteo, never voseo (EDITORIAL.md's
// Translation Process rule — checked: no vos/-ás/-és/-ís/che/dale-as-filler
// markers). PT is a first-pass draft, not a native-reviewed translation —
// same caveat this project has flagged before for PT copy (see
// project_v2_relaunch memory, Hero tagline) — flag before treating it as
// final if PT subscribers ever receive real volume.
const COPY: Record<
  WelcomeEmailLocale,
  {
    lang: string;
    preview: string;
    kicker: string;
    heading: string;
    paragraphs: string[];
    archiveLabel: string;
    byline: string;
    unsubscribeLabel: string;
  }
> = {
  en: {
    lang: 'en',
    preview: "You're subscribed to the PaddockIntel Digest.",
    kicker: 'PaddockIntel',
    heading: 'Welcome',
    paragraphs: [
      "You're subscribed to the PaddockIntel Digest.",
      "Every week: the F1 economics that don't make the highlight reel. Contracts, cost caps, sponsor math — the numbers behind the headlines, not the drama.",
      "Every figure is sourced — team press releases, FIA regulations, official standings. If we can't verify it, we don't print it.",
      'Your first issue arrives within a week. The full archive is live now.',
    ],
    archiveLabel: 'Browse the archive →',
    byline: 'By Ismael Sandoval',
    unsubscribeLabel: 'Unsubscribe',
  },
  es: {
    lang: 'es',
    preview: 'Te suscribiste al Digest de PaddockIntel.',
    kicker: 'PaddockIntel',
    heading: 'Bienvenido',
    paragraphs: [
      'Te suscribiste al Digest de PaddockIntel.',
      'Cada semana: la economía de la Fórmula 1 que no llega a los resúmenes de highlights. Contratos, cost cap, cifras de sponsors — los números detrás de los titulares, no el drama.',
      'Cada dato tiene fuente — comunicados de los equipos, reglamentos de la FIA, resultados oficiales. Si no lo podemos verificar, no lo publicamos.',
      'Tu primera edición llega dentro de la semana. El archivo completo ya está disponible.',
    ],
    archiveLabel: 'Ver el archivo →',
    byline: 'Por Ismael Sandoval',
    unsubscribeLabel: 'Cancelar suscripción',
  },
  pt: {
    lang: 'pt',
    preview: 'Você se inscreveu no Digest da PaddockIntel.',
    kicker: 'PaddockIntel',
    heading: 'Bem-vindo',
    paragraphs: [
      'Você se inscreveu no Digest da PaddockIntel.',
      'Toda semana: a economia da Fórmula 1 que não aparece nos melhores momentos. Contratos, teto de custos, números de patrocínio — os números por trás das manchetes, não o drama.',
      'Todo dado tem fonte — comunicados das equipes, regulamentos da FIA, resultados oficiais. Se não conseguimos verificar, não publicamos.',
      'Sua primeira edição chega em até uma semana. O arquivo completo já está disponível.',
    ],
    archiveLabel: 'Ver o arquivo →',
    byline: 'Por Ismael Sandoval',
    unsubscribeLabel: 'Cancelar inscrição',
  },
};

export default function WelcomeEmail({
  locale,
  archiveUrl,
  aboutUrl,
  unsubscribeUrl,
}: WelcomeEmailProps) {
  const copy = COPY[locale];

  const bg = '#F4F4F0';
  const ink = '#0A0A0A';
  const muted = '#6B6B6B';
  const ghost = '#B5B4AE';
  const mono = 'ui-monospace, "JetBrains Mono", "Courier New", monospace';
  const sans = 'ui-sans-serif, system-ui, -apple-system, sans-serif';
  const border = '1px solid #0A0A0A';
  const borderSubtle = '1px solid #B5B4AE';

  return (
    <Html lang={copy.lang}>
      <Head />
      <Preview>{copy.preview}</Preview>
      <Body style={{ backgroundColor: bg, margin: '0', padding: '0' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '0', backgroundColor: bg }}>

          {/* Header */}
          <Section style={{ borderBottom: border, padding: '20px 24px 14px' }}>
            <Text style={{ margin: '0', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: muted, fontFamily: mono }}>
              {copy.kicker}
            </Text>
            <Text style={{ margin: '4px 0 0', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: ghost, fontFamily: mono }}>
              {copy.heading}
            </Text>
          </Section>

          {/* Body */}
          <Section style={{ padding: '24px 24px 20px', borderBottom: borderSubtle }}>
            {copy.paragraphs.map((p, i) => (
              <Text
                key={i}
                style={{
                  margin: i === 0 ? '0 0 14px' : i === copy.paragraphs.length - 1 ? '0' : '0 0 14px',
                  fontSize: '15px',
                  lineHeight: '1.65',
                  color: ink,
                  fontFamily: sans,
                }}
              >
                {p}
              </Text>
            ))}
          </Section>

          {/* Footer */}
          <Section style={{ borderTop: border, padding: '16px 24px' }}>
            <Text style={{ margin: '0 0 8px', fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: mono }}>
              <Link href={archiveUrl} style={{ color: ink, textDecoration: 'none' }}>
                {copy.archiveLabel}
              </Link>
              <span style={{ color: ghost }}>{' · '}</span>
              <Link href={aboutUrl} style={{ color: ghost, textDecoration: 'none' }}>
                {copy.byline}
              </Link>
            </Text>
            <Text style={{ margin: '0', fontSize: '10px', color: ghost, fontFamily: mono }}>
              <Link href={unsubscribeUrl} style={{ color: ghost, textDecoration: 'underline', fontSize: '10px' }}>
                {copy.unsubscribeLabel}
              </Link>
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}
