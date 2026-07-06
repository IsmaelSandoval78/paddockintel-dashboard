import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export const metadata: Metadata = {
  title: 'About — PaddockIntel',
  description:
    'F1 economic intelligence by Ismael Sandoval — applying Fortune 100 supply chain expertise to decode racing strategy and team economics.',
};

const PILLARS = [
  {
    label: 'F1 Economic Intelligence',
    body: 'The financial architecture of Formula 1\'s $20 billion ecosystem. Team budgets. Sponsor deals. Cost cap strategies. Driver markets. Manufacturer investments. Revenue distribution.',
  },
  {
    label: 'Operational Strategy',
    body: 'Real-time decision-making under pressure. Tire strategies that turn P13 into P3. Pit stop coordination. Race weekend logistics. Risk calculations when milliseconds and millions collide.',
  },
  {
    label: 'Supply Chain & Logistics',
    body: 'The invisible infrastructure. Equipment transport across 24 countries. Spare parts management. Factory-to-track pipelines. Procurement efficiency. The logistics that keep teams racing.',
  },
];

const PHILOSOPHY = [
  {
    num: '01',
    title: 'Business First, Racing Context Second',
    body: 'We analyze F1 as a $20 billion business where operational excellence and economic strategy determine competitive outcomes—not as a racing blog.',
  },
  {
    num: '02',
    title: 'Data-Driven Intelligence',
    body: 'Every analysis is backed by numbers: dollar amounts, lap times, probability calculations, and ROI assessments. If we can\'t quantify it, we explain why.',
  },
  {
    num: '03',
    title: 'Operational Depth',
    body: 'Most analysis stops at "great strategy call." We explain the logistics coordination, supply chain readiness, risk calculations, and economic incentives that made the call possible—or impossible.',
  },
  {
    num: '04',
    title: 'Insider Perspective',
    body: 'We reconstruct the decision-making process using operational frameworks, economic incentives, and competitive dynamics—the analysis teams discuss internally but never share publicly.',
  },
];

const AUDIENCE = [
  "F1's business and economic landscape",
  'Operational strategy and decision-making under pressure',
  'Supply chain and logistics in high-performance environments',
  'Sports business and team valuation',
  'Data-driven competitive analysis',
];

export default async function AboutPage() {
  const tDisclaimer = await getTranslations('aboutDisclaimer');
  return (
    <main className="bg-bg min-h-screen px-5 py-12 max-w-2xl mx-auto">

      {/* 00 · Top label */}
      <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-2 border-b border-border pb-3 mb-8">
        00 · About PaddockIntel
      </p>

      {/* Hero */}
      <h1 className="font-display text-[clamp(1.7rem,4.5vw,2.5rem)] uppercase text-text-1 leading-[0.93] tracking-[-0.03em]">
        Formula 1 moves at<br />
        200 miles per hour.<br />
        The decisions that determine<br />
        winners and losers happen faster.
      </h1>

      <p className="font-sans text-text-1 leading-relaxed mt-6">
        Paddock Intel decodes the operational intelligence, strategic execution, and economic
        calculations that transform grid positions into podium finishes—and racing teams into
        billion-dollar businesses.
      </p>

      {/* 01 · What We Cover */}
      <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-2 border-b border-border pb-3 mt-12 mb-0">
        01 · What We Cover
      </p>
      <ul className="grid grid-cols-1 sm:grid-cols-3 border-l border-b border-border">
        {PILLARS.map((p) => (
          <li key={p.label} className="border-r border-t border-border p-5 flex flex-col gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-2">
              {p.label}
            </span>
            <p className="font-sans text-sm text-text-1 leading-relaxed">{p.body}</p>
          </li>
        ))}
      </ul>

      {/* 02 · Why This Perspective Matters */}
      <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-2 border-b border-border pb-3 mt-12 mb-6">
        02 · Why This Perspective Matters
      </p>
      <p className="font-sans text-sm text-text-2 leading-relaxed mb-5">
        Most F1 media covers what happened. Paddock Intel explains why it happened and what it cost.
      </p>

      <div className="space-y-3">
        <p className="font-sans text-sm text-text-1 leading-relaxed border-l-2 border-red pl-4">
          When a team executes a one-stop strategy while competitors commit to two stops, that&apos;s not
          luck—it&apos;s calculated risk backed by operational execution, supply chain readiness, and
          economic incentive structures.
        </p>
        <p className="font-sans text-sm text-text-1 leading-relaxed border-l-2 border-red pl-4">
          When a sponsor signs a $90 million deal with the grid&apos;s worst-performing team, that&apos;s not
          irrational—it&apos;s defensive market positioning in a proxy war for consumer attention.
        </p>
        <p className="font-sans text-sm text-text-1 leading-relaxed border-l-2 border-red pl-4">
          When Red Bull invests $500 million to become an engine manufacturer, that&apos;s not
          ambition—it&apos;s vertical integration to control competitive destiny and enterprise valuation.
        </p>
      </div>

      <p className="font-sans text-sm text-text-2 leading-relaxed mt-5">
        The numbers tell the real story. The operations determine the outcome.
      </p>

      {/* 03 · Who's Behind This */}
      <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-2 border-b border-border pb-3 mt-12 mb-6">
        03 · Who&apos;s Behind This
      </p>

      <p className="font-sans text-text-1 leading-relaxed mb-5">
        I&apos;m Ismael, and I analyze Formula 1 through the lens of supply chain operations and
        business strategy.
      </p>

      <div className="border border-border">
        <div className="flex gap-4 px-4 py-3 border-b border-border-subtle">
          <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-2 w-20 shrink-0">
            Current
          </span>
          <span className="font-mono text-[11px] text-text-1">
            Onboarding & Estimating Coordinator · Verst Logistics
          </span>
        </div>
        <div className="flex gap-4 px-4 py-3 border-b border-border-subtle">
          <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-2 w-20 shrink-0">
            Previous
          </span>
          <span className="font-mono text-[11px] text-text-1">
            Production Planner · Jabil (Fortune 500 Manufacturing)
          </span>
        </div>
        <div className="flex gap-4 px-4 py-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-2 w-20 shrink-0">
            Clients
          </span>
          <span className="font-mono text-[11px] text-text-1">
            P&G · Unilever · Sazerac (Fortune 100 scale)
          </span>
        </div>
      </div>

      <p className="font-sans text-sm text-text-2 leading-relaxed mt-5">
        I&apos;ve followed Formula 1 since the Schumacher era. Attending the 2024 Las Vegas Grand Prix
        crystallized something: the operational complexity I manage daily in supply chain—coordinating
        multi-million-dollar shipments, optimizing production schedules, managing procurement under cost
        pressure—maps directly to how F1 teams execute race weekends.
      </p>
      <p className="font-sans text-sm text-text-2 leading-relaxed mt-3">
        The difference: F1 operates under time compression, public scrutiny, and higher stakes. A
        delayed shipment in logistics costs money. A delayed pit stop costs podium positions and
        championship points.
      </p>
      <p className="font-sans text-sm text-text-2 leading-relaxed mt-3">
        That parallel fascinated me. So I started analyzing Formula 1 as an operations and economics
        case study, applying frameworks from corporate supply chain management to understand how teams
        make decisions when performance, budgets, and milliseconds intersect.
      </p>

      {/* 04 · Philosophy */}
      <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-2 border-b border-border pb-3 mt-12 mb-0">
        04 · The Paddock Intel Philosophy
      </p>
      <ol className="border-b border-border">
        {PHILOSOPHY.map((item) => (
          <li key={item.num} className="py-5 border-b border-border-subtle flex gap-5 last:border-b-0">
            <span className="font-mono text-[11px] text-text-3 tracking-[0.06em] mt-0.5 shrink-0">
              {item.num} ·
            </span>
            <div>
              <h3 className="font-display uppercase text-text-1 text-base leading-tight">
                {item.title}
              </h3>
              <p className="font-sans text-sm text-text-2 leading-relaxed mt-1.5">{item.body}</p>
            </div>
          </li>
        ))}
      </ol>

      {/* 05 · What You Get */}
      <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-2 border-b border-border pb-3 mt-12 mb-0">
        05 · What You Get
      </p>
      <div className="border-b border-border">
        <div className="py-5 border-b border-border-subtle">
          <div className="flex items-baseline gap-3">
            <span className="font-display uppercase text-text-1 text-base">Weekly Newsletter</span>
            <span className="font-mono text-[10px] text-red uppercase tracking-[0.08em]">Free</span>
          </div>
          <p className="font-sans text-sm text-text-2 leading-relaxed mt-1.5">
            Economic and operational analysis of major F1 business developments. Sponsor deals. Team
            budgets. Market movements. Strategic decisions. Delivered to your inbox.
          </p>
        </div>
        <div className="py-5 border-b border-border-subtle">
          <div className="flex items-baseline gap-3">
            <span className="font-display uppercase text-text-1 text-base">
              Race Weekend Intelligence
            </span>
            <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.08em]">
              Coming Soon
            </span>
          </div>
          <p className="font-sans text-sm text-text-2 leading-relaxed mt-1.5">
            Real-time operational analysis during Grand Prix weekends. Strategy execution. Pit stop
            efficiency. Risk decisions. The paddock intelligence that explains how races are won in
            the garage, not just on track.
          </p>
        </div>
        <div className="py-5">
          <div className="flex items-baseline gap-3">
            <span className="font-display uppercase text-text-1 text-base">Premium Analysis</span>
            <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.08em]">
              Coming Soon
            </span>
          </div>
          <p className="font-sans text-sm text-text-2 leading-relaxed mt-1.5">
            Deep-dive reports. Team financial health assessments. Season-long strategy tracking.
            Proprietary data tables. Institutional-grade intelligence for investors, analysts, and
            industry professionals.
          </p>
        </div>
      </div>

      {/* 06 · Who This Is For */}
      <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-2 border-b border-border pb-3 mt-12 mb-6">
        06 · Who This Is For
      </p>
      <p className="font-sans text-sm text-text-2 leading-relaxed mb-4">
        Paddock Intel is for people who want to understand Formula 1&apos;s invisible layer—the operations,
        economics, and strategic execution that racing media doesn&apos;t cover because they require supply
        chain expertise, financial analysis, and operational thinking to decode.
      </p>
      <ul className="space-y-2">
        {AUDIENCE.map((item) => (
          <li key={item} className="flex items-start gap-3">
            <span className="font-mono text-[11px] text-red mt-0.5 shrink-0">—</span>
            <span className="font-sans text-sm text-text-1">{item}</span>
          </li>
        ))}
      </ul>

      {/* 07 · Disclaimer */}
      <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-2 border-b border-border pb-3 mt-12 mb-6">
        07 · {tDisclaimer('heading')}
      </p>
      <p className="font-sans text-sm text-text-2 leading-relaxed mb-4">
        {tDisclaimer('affiliation')}
      </p>
      <p className="font-sans text-sm text-text-2 leading-relaxed">
        {tDisclaimer('accuracy')}
      </p>

      <p className="mt-12 pt-6 border-t border-border-subtle font-mono text-[11px] uppercase tracking-[0.06em] text-text-3">
        PaddockIntel · paddockintel.com
      </p>
    </main>
  );
}
