'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  MI_BOX_COOKIE,
  EMPTY_MI_BOX,
  parseMiBox,
  serializeMiBox,
  toggleFollowed,
  withPersonalNumber,
  randomPersonalNumber,
  type MiBoxState,
} from './miBox';

const CHANGE_EVENT = 'mibox-change';

function readCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

function writeCookie(name: string, value: string) {
  // 1 year, client-readable (not httpOnly — needs to be writable from here), site-wide path.
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`;
  // Multiple components mount their own useMiBox() instance on the same page (nav badge,
  // follow buttons, the Hub strip) — each has its own React state, so a write in one needs
  // to tell the others to re-read the cookie. No accounts/server round-trip, so a same-tab
  // custom event is the whole sync mechanism (a "storage" event only fires cross-*tab*, not
  // for writes made in this tab).
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

// Reads/writes the pi_box cookie (lib/miBox.ts) — no accounts. Every change writes straight
// to the cookie; every instance of this hook, anywhere on the page, reacts within the tab.
export function useMiBox() {
  const [state, setState] = useState<MiBoxState>(EMPTY_MI_BOX);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    function sync() {
      setState(parseMiBox(readCookie(MI_BOX_COOKIE)));
    }

    let current = parseMiBox(readCookie(MI_BOX_COOKIE));
    if (current.number === null) {
      current = withPersonalNumber(current, randomPersonalNumber());
      writeCookie(MI_BOX_COOKIE, serializeMiBox(current)); // fires CHANGE_EVENT, sync() below also catches it
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(current);
    setReady(true);

    window.addEventListener(CHANGE_EVENT, sync);
    return () => window.removeEventListener(CHANGE_EVENT, sync);
  }, []);

  const toggle = useCallback((kind: 'driver' | 'constructor', ref: string) => {
    const next = toggleFollowed(parseMiBox(readCookie(MI_BOX_COOKIE)), kind, ref);
    writeCookie(MI_BOX_COOKIE, serializeMiBox(next)); // triggers this instance's own listener too
  }, []);

  const isFollowed = useCallback(
    (kind: 'driver' | 'constructor', ref: string) => state[kind === 'driver' ? 'drivers' : 'constructors'].includes(ref),
    [state],
  );

  return { state, ready, toggle, isFollowed };
}
