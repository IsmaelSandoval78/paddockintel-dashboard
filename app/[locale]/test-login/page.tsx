'use client';

// TEMPORARY — disposable verification harness for the real Google OAuth
// flow in production (paddockintel.com / hub.paddockintel.com). No design,
// no i18n on purpose: this is not the real login UI (that's a separate
// task with its own DESIGN.md/Critique Gate pass). Delete after the
// end-to-end cookie/cross-domain verification is confirmed — see
// docs/ROADMAP-SEMANA.md, paso 6.
import { createAuthBrowserClient } from '@/lib/supabase/authBrowserClient';

export default function TestLoginPage() {
  async function signIn() {
    const supabase = createAuthBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
    if (error) alert('signInWithOAuth error: ' + error.message);
  }

  return (
    <div style={{ padding: 40 }}>
      <p>Temporary auth verification harness — not the real login UI.</p>
      <button onClick={signIn}>Sign in with Google</button>
    </div>
  );
}
