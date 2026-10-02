import type { ArticleVoice } from '@/lib/blog/tags';

export default function ArticleVoices({ voices }: { voices: ArticleVoice[] }) {
  if (voices.length === 0) return null;

  return (
    <section className="mt-8 pt-6 border-t border-border-subtle">
      <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-2 mb-3">
        Voices On This
      </p>
      <div className="space-y-4">
        {voices.map((voice) => (
          <div key={voice.slug} className="pb-4 last:pb-0">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[14px] font-semibold text-text-1">{voice.name}</p>
              {voice.x_handle && (
                <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-text-3 shrink-0">
                  @{voice.x_handle}
                </span>
              )}
            </div>
            <p className="font-mono text-[9px] uppercase tracking-[0.05em] text-text-2 mt-0.5">
              {voice.role}
            </p>
            <p className="font-prose text-[13px] text-text-2 leading-relaxed mt-2">
              {voice.takeaway}
            </p>
            <a
              href={voice.post_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[10px] uppercase tracking-[0.06em] text-terracotta hover:opacity-70 transition-opacity duration-150 mt-1.5 inline-block"
            >
              Read the post →
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
