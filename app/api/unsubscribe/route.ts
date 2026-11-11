import { NextResponse } from 'next/server';
// Fresh (uncached) reads: this route checks or changes state, see lib/supabase/server.ts.
import { createFreshClient as createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get('email');

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }

  const supabase = createClient();
  await supabase.from('subscribers').delete().eq('email', email.toLowerCase().trim());

  redirect('/unsubscribed');
}
