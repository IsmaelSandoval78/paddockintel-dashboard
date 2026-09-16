'use client';

import { useEffect } from 'react';

// Registers public/sw.js. A silent no-op in dev (Cloudflare Workers preview,
// most browsers without HTTPS) and in any browser without the API -- this
// should never be able to break a page load, only quietly fail to install.
export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);

  return null;
}
