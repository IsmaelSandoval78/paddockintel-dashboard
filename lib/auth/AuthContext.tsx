'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AuthUser } from '@/components/nav/AuthWidget';
import type { FollowRefs } from '@/lib/follows/actions';

// The signed-in state for the whole tree (Navbar's AuthWidget, every
// FollowButton/MiBoxIndicator/MiBoxStrip via lib/follows/useFollows.ts),
// fetched once per page load from /api/auth/me. It used to be read in
// app/[locale]/layout.tsx on the server, but any per-request read there makes
// every page render per request and skip the ISR cache, which held the
// article group's mobile LCP at 4.0s (Search Console, 2026-11-09). The fetch
// runs after the page has painted, so it never delays the LCP; the session
// cookies are httpOnly, so the browser can't tell on its own whether there is
// a session worth asking about.
type AuthContextValue = {
  user: AuthUser | null;
  initialFollows: FollowRefs;
  // Signed in or registered through the article gate (pi_subscribed): opens paywalled articles.
  subscribed: boolean;
  // False until /api/auth/me has answered: consumers that would show the
  // signed-out state (the sign-in button, cookie-based follows) wait for it.
  loaded: boolean;
};

const EMPTY_FOLLOWS: FollowRefs = { drivers: [], constructors: [] };

const SIGNED_OUT: AuthContextValue = { user: null, initialFollows: EMPTY_FOLLOWS, subscribed: false, loaded: false };

const AuthContext = createContext<AuthContextValue>(SIGNED_OUT);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<AuthContextValue>(SIGNED_OUT);

  useEffect(() => {
    let cancelled = false;
    // Trailing slash: the site runs with trailingSlash: true, so /api/auth/me would 308 first.
    fetch('/api/auth/me/', { cache: 'no-store', credentials: 'same-origin' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { user: AuthUser | null; follows: FollowRefs; subscribed: boolean } | null) => {
        if (cancelled) return;
        setValue({
          user: data?.user ?? null,
          initialFollows: data?.follows ?? EMPTY_FOLLOWS,
          subscribed: data?.subscribed ?? false,
          loaded: true,
        });
      })
      .catch(() => {
        if (!cancelled) setValue({ ...SIGNED_OUT, loaded: true });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthUser(): AuthUser | null {
  return useContext(AuthContext).user;
}

export function useInitialFollows(): FollowRefs {
  return useContext(AuthContext).initialFollows;
}

export function useSubscribed(): boolean {
  return useContext(AuthContext).subscribed;
}

export function useAuthLoaded(): boolean {
  return useContext(AuthContext).loaded;
}
