import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { createClient } from '@/lib/supabase/server';

// Resend signs webhook deliveries using Svix's scheme (Resend doesn't ship
// its own SDK verifier in the `resend` package) -- verified here with Node's
// built-in `crypto` rather than adding the `svix` dependency for one HMAC
// check. See https://resend.com/docs/dashboard/webhooks/verify-webhooks-requests.
//
// Fails closed: no RESEND_WEBHOOK_SECRET configured, a missing/malformed
// signature header, or a signature that doesn't verify all return 401 before
// the body is ever parsed as an event. Until the Resend dashboard webhook is
// actually created (Resend dashboard -> Webhooks -> Add Endpoint, URL
// https://paddockintel.com/api/webhooks/resend, events: email.sent,
// email.delivered, email.opened, email.clicked, email.bounced,
// email.complained -- then paste its Signing Secret into the
// RESEND_WEBHOOK_SECRET repo/env secret, see .env.example), nothing can send
// this route a valid signature anyway -- rejecting unverified POSTs closes
// the endpoint rather than leaving it open to spoofed events.
function verifySignature(secret: string, id: string, timestamp: string, body: string, signatureHeader: string): boolean {
  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const signedContent = `${id}.${timestamp}.${body}`;
  const expected = createHmac('sha256', secretBytes).update(signedContent).digest('base64');

  // svix-signature carries one or more space-separated "v1,<base64>" tokens
  // (multiple during secret rotation) -- a match against any is valid.
  return signatureHeader.split(' ').some((token) => {
    const [version, sig] = token.split(',');
    if (version !== 'v1' || !sig) return false;
    const sigBuf = Buffer.from(sig, 'base64');
    const expectedBuf = Buffer.from(expected, 'base64');
    return sigBuf.length === expectedBuf.length && timingSafeEqual(sigBuf, expectedBuf);
  });
}

type ResendTag = { name: string; value: string };
type ResendWebhookPayload = {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    to: string[];
    tags?: ResendTag[];
    click?: { link: string };
    bounce?: { message?: string };
  };
};

const EVENT_TYPE_MAP: Record<string, string> = {
  'email.sent': 'sent',
  'email.delivered': 'delivered',
  'email.delivery_delayed': 'delivery_delayed',
  'email.opened': 'opened',
  'email.clicked': 'clicked',
  'email.bounced': 'bounced',
  'email.complained': 'complained',
};

export async function POST(req: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 401 });
  }

  const id = req.headers.get('svix-id');
  const timestamp = req.headers.get('svix-timestamp');
  const signature = req.headers.get('svix-signature');
  if (!id || !timestamp || !signature) {
    return NextResponse.json({ error: 'Missing signature headers' }, { status: 401 });
  }

  const body = await req.text();
  if (!verifySignature(secret, id, timestamp, body, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const payload = JSON.parse(body) as ResendWebhookPayload;
  const eventType = EVENT_TYPE_MAP[payload.type];
  if (!eventType) {
    // An event type this table doesn't model yet (e.g. email.failed) --
    // acknowledge rather than error, so Resend doesn't retry indefinitely.
    return NextResponse.json({ ignored: payload.type });
  }

  const issueIdTag = payload.data.tags?.find((t) => t.name === 'issue_id')?.value;
  const supabase = createClient();
  const { error } = await supabase.from('email_events').insert({
    resend_email_id: payload.data.email_id,
    event_type: eventType,
    email: payload.data.to[0],
    issue_id: issueIdTag ?? null,
    link_url: payload.data.click?.link ?? null,
    occurred_at: payload.created_at,
    raw: payload,
  });

  // A duplicate delivery (Resend retry) hits the dedupe unique index --
  // that's success, not a failure to surface.
  if (error && error.code !== '23505') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
