// A story's significance (lib/entityMentions.ts significanceScore: this week's press mentions of
// the most-covered name it carries) as a number plus a bar scaled to the page's top story, so it
// reads as a signal and not a vote count.

export default function Signal({ score, max, title }: { score: number; max: number; title: string }) {
  const pct = Math.max(6, Math.round((score / (max || 1)) * 100));
  return (
    <span className="inline-flex items-center gap-1.5 dusk-mono text-[11.5px] tabular-nums text-[color:var(--dusk-sunset)] whitespace-nowrap" title={title}>
      <span className="inline-block w-[34px] h-[5px] rounded-full bg-[#2A2631] overflow-hidden" aria-hidden="true">
        <span className="block h-full bg-[color:var(--dusk-warm)]" style={{ width: `${pct}%` }} />
      </span>
      {score}
    </span>
  );
}
