'use client';

import { useState, useRef, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CircuitRecord = {
  circuit_id: number;
  circuit_name: string;
  location: string;
  country: string;
  starts: number;
  wins: number;
  podiums: number;
  best_result: number | null;
  dnfs: number;
  fastest_laps: number;
  poles: number;
  win_pct: number;
};

type DriverMeta = {
  forename: string;
  surname: string;
  code: string | null;
  driver_ref: string;
};

// ─── Flag system (country → 3-stripe colours) ────────────────────────────────

const COUNTRY_FLAG: Record<string, readonly [string, string, string]> = {
  'UK':                  ['#012169', '#E8E6E0', '#C8102E'],
  'United Kingdom':      ['#012169', '#E8E6E0', '#C8102E'],
  'Great Britain':       ['#012169', '#E8E6E0', '#C8102E'],
  'Italy':               ['#009246', '#E8E6E0', '#CE2B37'],
  'Germany':             ['#000000', '#DD0000', '#FFCE00'],
  'France':              ['#002395', '#E8E6E0', '#ED2939'],
  'Spain':               ['#AA151B', '#F1BF00', '#AA151B'],
  'USA':                 ['#B22234', '#E8E6E0', '#3C3B6E'],
  'United States':       ['#B22234', '#E8E6E0', '#3C3B6E'],
  'Canada':              ['#FF0000', '#E8E6E0', '#FF0000'],
  'Brazil':              ['#009C3B', '#FEDF00', '#002776'],
  'Japan':               ['#E8E6E0', '#BC002D', '#E8E6E0'],
  'Australia':           ['#00008B', '#E8E6E0', '#FF0000'],
  'Monaco':              ['#CE1126', '#E8E6E0', '#CE1126'],
  'Hungary':             ['#CE2939', '#E8E6E0', '#436F4D'],
  'Belgium':             ['#000000', '#FAE042', '#EF3340'],
  'Netherlands':         ['#AE1C28', '#E8E6E0', '#21468B'],
  'Austria':             ['#EE0000', '#E8E6E0', '#EE0000'],
  'Mexico':              ['#006847', '#E8E6E0', '#CE1126'],
  'Argentina':           ['#74ACDF', '#E8E6E0', '#74ACDF'],
  'South Africa':        ['#007A4D', '#FFB81C', '#001489'],
  'Singapore':           ['#EF3340', '#E8E6E0', '#EF3340'],
  'China':               ['#DE2910', '#FFDE00', '#DE2910'],
  'Bahrain':             ['#CE1126', '#E8E6E0', '#CE1126'],
  'UAE':                 ['#00732F', '#E8E6E0', '#FF0000'],
  'United Arab Emirates':['#00732F', '#E8E6E0', '#FF0000'],
  'Saudi Arabia':        ['#006C35', '#E8E6E0', '#006C35'],
  'Qatar':               ['#8D1B3D', '#E8E6E0', '#8D1B3D'],
  'Azerbaijan':          ['#0092BC', '#E61919', '#009E60'],
  'Russia':              ['#E8E6E0', '#0039A6', '#D52B1E'],
  'Portugal':            ['#006600', '#FF0000', '#006600'],
  'Malaysia':            ['#CC0001', '#E8E6E0', '#CC0001'],
  'Turkey':              ['#E30A17', '#E8E6E0', '#E30A17'],
  'South Korea':         ['#E8E6E0', '#CD2E3A', '#E8E6E0'],
  'Korea':               ['#E8E6E0', '#CD2E3A', '#E8E6E0'],
  'Vietnam':             ['#DA251D', '#FFCD00', '#DA251D'],
  'Kazakhstan':          ['#00AFCA', '#FFDB00', '#00AFCA'],
  'Sweden':              ['#006AA7', '#FECC00', '#006AA7'],
  'Switzerland':         ['#FF0000', '#E8E6E0', '#FF0000'],
  'Morocco':             ['#C1272D', '#006233', '#C1272D'],
  'India':               ['#FF9933', '#E8E6E0', '#138808'],
  'New Zealand':         ['#00247D', '#E8E6E0', '#CC142B'],
  'Venezuela':           ['#CF142B', '#E8E6E0', '#003893'],
  'Poland':              ['#E8E6E0', '#DC143C', '#E8E6E0'],
};

function flagGradient(country: string): string {
  const c = COUNTRY_FLAG[country];
  if (!c) return 'linear-gradient(to right,#B0AFA8 0%,#6B6B6B 50%,#B0AFA8 100%)';
  return `linear-gradient(to right,${c[0]} 0%,${c[0]} 33.33%,${c[1]} 33.33%,${c[1]} 66.66%,${c[2]} 66.66%,${c[2]} 100%)`;
}

// ─── Card ─────────────────────────────────────────────────────────────────────

const CARD_BG   = '#EDEAE0';
const DIVIDER   = '#C8C5BB';
const RED       = '#E61919';
const LOGO_URL  = 'https://paddockintel.com/content/images/2026/02/paddockintel-logo-light-xl.png';

function CircuitCard({
  record,
  driver,
}: {
  record: CircuitRecord;
  driver: DriverMeta;
}) {
  const cardRef  = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);

  const handleShare = useCallback(async () => {
    if (!cardRef.current || sharing) return;
    setSharing(true);

    try {
      const { default: html2canvas } = await import('html2canvas');

      const CAPTURE_WIDTH = 640;
      const CAPTURE_SCALE = 2;

      // Clone off-screen at fixed dimensions so the captured image is
      // never constrained by the grid column or any overflow clipping.
      const original = cardRef.current;
      const clone = original.cloneNode(true) as HTMLDivElement;

      Object.assign(clone.style, {
        position:  'fixed',
        top:       '0',
        left:      '-9999px',
        width:     `${CAPTURE_WIDTH}px`,
        padding:   '28px',
        height:    'auto',
        maxHeight: 'none',
        overflow:  'visible',
        zIndex:    '-1',
      });

      // Force every descendant to expand fully — no overflow clipping,
      // no nowrap that could squash height, no max-height limits.
      document.body.appendChild(clone);
      clone.querySelectorAll<HTMLElement>('*').forEach((el) => {
        el.style.setProperty('overflow',   'visible', 'important');
        el.style.setProperty('white-space', 'normal',  'important');
        el.style.setProperty('max-height', 'none',     'important');
      });

      // Watermark footer — appended after the descendant reset so its
      // own styles are not overridden by the loop above.
      const footer = document.createElement('div');
      footer.style.cssText = `
        padding: 8px 0 4px 0;
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        color: #6B6B6B;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      `;
      footer.textContent = 'hub.paddockintel.com';
      clone.appendChild(footer);

      // Read height after footer is in the DOM so it's included.
      const captureHeight = clone.scrollHeight;

      const canvas = await html2canvas(clone, {
        scale:        CAPTURE_SCALE,
        width:        CAPTURE_WIDTH,
        height:       captureHeight,
        windowWidth:  CAPTURE_WIDTH,
        useCORS:      true,
        allowTaint:   true,
        backgroundColor: CARD_BG,
        logging:      false,
      });

      document.body.removeChild(clone);

      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Overlay logo (fail silently if CORS blocks)
        try {
          const logo = await new Promise<HTMLImageElement>((res, rej) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload  = () => res(img);
            img.onerror = rej;
            img.src = LOGO_URL;
          });
          const logoW = 120 * 2;
          const logoH = (logo.naturalHeight / logo.naturalWidth) * logoW;
          const pad   = 12 * 2;
          ctx.drawImage(logo, pad, canvas.height - logoH - pad, logoW, logoH);
        } catch {
          // logo unavailable — skip
        }

        // 4 px accent strip at bottom (8 px at 2x scale)
        ctx.fillStyle = RED;
        ctx.fillRect(0, canvas.height - 8, canvas.width, 8);
      }

      // Download PNG
      const safeCircuit = record.circuit_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const safeDriver  = (driver.code ?? driver.surname).toLowerCase();
      const link = document.createElement('a');
      link.download = `${safeDriver}-${safeCircuit}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Open X intent
      const display   = `${driver.forename[0]}. ${driver.surname}`;
      const winsLabel = record.wins === 1 ? '1 win' : `${record.wins} wins`;
      const tweetText = [
        `${display} at ${record.circuit_name}`,
        `${record.starts} starts · ${winsLabel} · ${record.win_pct.toFixed(1)}% win rate`,
        '',
        `Full stats → hub.paddockintel.com/drivers/${driver.driver_ref}`,
        '',
        `#F1 #PaddockIntel #${driver.surname}`,
      ].join('\n');

      window.open(
        `https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}`,
        '_blank',
        'noopener,noreferrer'
      );
    } finally {
      setSharing(false);
    }
  }, [record, driver, sharing]);

  const bestColor   = record.best_result === 1    ? RED : 'var(--text-1)';
  const winPctColor = record.win_pct > 20         ? RED : 'var(--text-2)';

  return (
    <div
      ref={cardRef}
      style={{
        background:   CARD_BG,
        boxShadow:    '0 2px 8px rgba(0,0,0,0.06)',
        border:       `1px solid ${DIVIDER}`,
        borderRadius: 0,
      }}
    >
      {/* ── Header: flag + circuit info ── */}
      <div className="px-4 pt-4 pb-3 flex items-start gap-3">
        <div
          aria-hidden="true"
          style={{
            width:      24,
            height:     16,
            flexShrink: 0,
            marginTop:  2,
            background: flagGradient(record.country),
          }}
        />
        <div className="min-w-0 flex-1">
          <p
            className="text-[13px] uppercase leading-tight truncate text-text-1"
            style={{ fontFamily: 'var(--pi-display)', fontWeight: 900 }}
          >
            {record.circuit_name}
          </p>
          <p className="font-mono text-[10px] text-text-2 mt-0.5 truncate">
            {record.location} · {record.country}
          </p>
        </div>
      </div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-4" style={{ borderTop: `1px solid ${DIVIDER}` }}>
        {[
          { label: 'STARTS', value: String(record.starts),  color: 'var(--text-1)' },
          { label: 'WINS',   value: String(record.wins),    color: 'var(--text-1)' },
          { label: 'POD',    value: String(record.podiums), color: 'var(--text-1)' },
          {
            label: 'BEST',
            value: record.best_result !== null ? `P${record.best_result}` : '—',
            color: bestColor,
          },
        ].map(({ label, value, color }, i) => (
          <div
            key={label}
            className="px-3 py-3"
            style={{ borderRight: i < 3 ? `1px solid ${DIVIDER}` : undefined }}
          >
            <p className="font-mono text-[9px] text-text-3 uppercase tracking-[0.06em] mb-1.5">
              {label}
            </p>
            <p
              className="font-mono text-[15px] tabular-nums leading-none"
              style={{ color }}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Footer: Poles · DNFs · Win% + Share ── */}
      <div
        className="px-4 py-2.5 flex items-center justify-between gap-2"
        style={{ borderTop: `1px solid ${DIVIDER}` }}
      >
        <p className="font-mono text-[10px] text-text-2 leading-none truncate">
          Poles: {record.poles} · DNFs: {record.dnfs} · Win%:{' '}
          <span style={{ color: winPctColor }}>{record.win_pct.toFixed(1)}%</span>
        </p>
        <button
          onClick={handleShare}
          disabled={sharing}
          title="Image downloads automatically — attach it to your tweet"
          className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-2 hover:text-text-1 transition-colors duration-100 disabled:opacity-40 shrink-0 bg-transparent border-0 p-0 cursor-pointer"
        >
          {sharing ? '...' : 'Share →'}
        </button>
      </div>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export default function CircuitRecordSection({
  records,
  driver,
}: {
  records: CircuitRecord[];
  driver: DriverMeta;
}) {
  const [search, setSearch] = useState('');

  const filtered = search
    ? records.filter(
        (r) =>
          r.circuit_name.toLowerCase().includes(search.toLowerCase()) ||
          r.country.toLowerCase().includes(search.toLowerCase())
      )
    : records;

  // Wins > 0 first (DESC), then 0-wins by starts DESC
  const sorted = [...filtered].sort(
    (a, b) => b.wins - a.wins || b.starts - a.starts
  );

  return (
    <section className="border-t border-border">

      {/* Section header */}
      <div className="px-6 py-3 border-b border-border flex items-baseline gap-2">
        <span className="font-mono text-xs text-text-2 leading-none">06 ·</span>
        <h2 className="text-[13px] font-medium text-text-2">Circuit Record</h2>
        <span className="font-mono text-[11px] text-text-3 ml-1 tabular-nums">
          {records.length}
        </span>
      </div>

      {/* Search */}
      <div className="px-6 py-3 border-b border-border">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search circuit..."
          className="font-mono text-[11px] text-text-2 bg-transparent border-0 p-0 focus:outline-none placeholder:text-text-3 w-full"
        />
      </div>

      {/* Card grid */}
      {sorted.length > 0 ? (
        <div className="px-6 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((record) => (
            <CircuitCard key={record.circuit_id} record={record} driver={driver} />
          ))}
        </div>
      ) : (
        <div className="px-6 py-8">
          <span className="font-mono text-[13px] text-text-3">—</span>
        </div>
      )}

    </section>
  );
}
