'use client';

import { useEffect } from 'react';
import Script from 'next/script';

declare global {
  interface Window {
    twttr?: { widgets: { load: (el?: HTMLElement) => void } };
  }
}

export default function XProfileEmbed({ handle }: { handle: string }) {
  useEffect(() => {
    window.twttr?.widgets.load();
  }, [handle]);

  return (
    <div>
      <a
        className="twitter-timeline"
        data-height="600"
        href={`https://twitter.com/${handle}?ref_src=twsrc%5Etfw`}
      >
        Tweets by @{handle}
      </a>
      <Script
        src="https://platform.twitter.com/widgets.js"
        strategy="afterInteractive"
        onLoad={() => window.twttr?.widgets.load()}
      />
    </div>
  );
}
