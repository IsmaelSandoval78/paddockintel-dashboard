'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { AuthUser } from '@/components/nav/AuthWidget';
import type { FollowRefs } from '@/lib/follows/actions';

// One auth read per request (app/[locale]/layout.tsx), passed down through
// this context instead of every FollowButton/MiBoxIndicator instance across
// the site re-fetching or re-deriving login state itself. Follows are
// seeded the same way, from the same request, when there's a session — see
// getInitialFollows in layout.tsx: skipped entirely for the anonymous
// majority of requests (CLAUDE.md: no client-side fetching unless
// interactive, and no DB round-trip for a request that doesn't need one).
type AuthContextValue = {
  user: AuthUser | null;
  initialFollows: FollowRefs;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  initialFollows: { drivers: [], constructors: [] },
});

export function AuthProvider({ value, children }: { value: AuthContextValue; children: ReactNode }) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthUser(): AuthUser | null {
  return useContext(AuthContext).user;
}

export function useInitialFollows(): FollowRefs {
  return useContext(AuthContext).initialFollows;
}
