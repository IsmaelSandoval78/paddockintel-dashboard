'use client';

import { useCallback, useMemo, useState } from 'react';
import { useMiBox } from '@/lib/useMiBox';
import { useAuthUser, useInitialFollows } from '@/lib/auth/AuthContext';
import { toggleFollowed, type MiBoxState } from '@/lib/miBox';
import { toggleFollow, type FollowKind } from './actions';

// Drop-in replacement for useMiBox() in every follow-toggling component
// (FollowButton, MiBoxIndicator, MiBoxStrip) — same {state, ready, toggle,
// isFollowed} shape, so no consumer needs its own branching logic.
//
// Signed out: delegates entirely to useMiBox() (the pi_box cookie).
// Signed in: drivers/constructors come from the account (driver_follows/
// constructor_follows via Server Actions in lib/follows/actions.ts), seeded
// from the server-rendered initialFollows (lib/auth/AuthContext.tsx) so
// there's no loading flash. `number` (the personal car-number flourish)
// always comes from the cookie regardless of login state — it was never
// part of what the privacy policy discloses storing on an account (see
// docs/advisors/EEAT-EXPERT.md), so it's guest-only by design, not a gap.
export function useFollows() {
  const user = useAuthUser();
  const initialFollows = useInitialFollows();
  const miBox = useMiBox();

  const [dbState, setDbState] = useState<MiBoxState>({
    number: null,
    drivers: initialFollows.drivers,
    constructors: initialFollows.constructors,
  });

  const signedIn = user !== null;
  const state: MiBoxState = useMemo(
    () => ({
      number: miBox.state.number,
      drivers: signedIn ? dbState.drivers : miBox.state.drivers,
      constructors: signedIn ? dbState.constructors : miBox.state.constructors,
    }),
    [signedIn, dbState, miBox.state],
  );
  const ready = signedIn ? true : miBox.ready;

  const isFollowed = useCallback(
    (kind: FollowKind, ref: string) => state[kind === 'driver' ? 'drivers' : 'constructors'].includes(ref),
    [state],
  );

  const toggle = useCallback(
    (kind: FollowKind, ref: string) => {
      if (!signedIn) {
        miBox.toggle(kind, ref);
        return;
      }
      // Optimistic update — toggleFollowed() is its own inverse, so
      // reverting on a failed server call is just calling it again.
      setDbState((prev) => toggleFollowed(prev, kind, ref));
      void toggleFollow(kind, ref).then((result) => {
        if ('error' in result) {
          setDbState((prev) => toggleFollowed(prev, kind, ref));
        }
      });
    },
    [signedIn, miBox],
  );

  return { state, ready, toggle, isFollowed };
}
