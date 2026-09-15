# PaddockIntel — Instagram Guide

Growth playbook for `@paddockintel.com` on Instagram. This is an operational guide, not a
compliance gate — it doesn't replace `EDITORIAL.md` or the four content advisors in
`docs/advisors/`. Every fact, stat, and quote posted to Instagram still has to clear the same
sourcing bar as an article: verified, attributed, traceable. Instagram is a distribution channel
for that work, not a lower-trust exception to it.

Research current as of **2026-09-13**. Instagram's ranking systems change often enough that this
file should be re-verified every few months, not treated as permanent fact.

---

## How the algorithm actually works right now

Instagram doesn't run one algorithm. It runs **four separate AI ranking systems** — one each for
Feed, Reels, Stories, and Explore — and each weighs signals differently. It also shifted from a
social graph model (who you follow) to an **interest graph model**: reach depends on how people
engage with your content, not how many followers you have. A small account with the right post
can out-reach a large one.

### The three signals Adam Mosseri confirmed matter most, across every surface
1. **Watch time**
2. **Sends per reach** — DMs. This is the single heaviest-weighted signal on the platform right
   now. Mosseri's own words: shares via DM "carry tremendous weight."
3. **Likes per reach**

**Saves** function as a fourth de facto top signal, especially for carousels (see below) — they
tell Instagram the content has reference value, not just a moment of interest.

### Per-surface signals

| Surface | Weighs most |
|---|---|
| **Feed** | Relationship strength (interaction history with that account), post engagement velocity |
| **Reels** | Watch time + replay rate (a 15s Reel watched 3x beats a 60s Reel watched once), DM sends, original audio |
| **Stories** | Recency, viewing history, closeness — serves existing followers, not discovery |
| **Explore** | Engagement velocity, match to the viewer's interest graph, creator's recent engagement — not follower count |

### Carousels specifically
Carousels get their own set of rules and currently outperform every other format for save rate:
- Average **3.2% save rate vs. 0.6%** for a single image.
- Top two ranking signals: **dwell time** and **completion rate** (not likes).
- **Optimal length: 4–8 slides.** Below 4 doesn't build a real arc; past 8, completion rate drops
  from fatigue. Six is a safe default for a story with a hook, a turn, and a payoff.
- If someone doesn't finish a carousel, Instagram **re-serves it starting from the slide they
  didn't reach** — the only format with this behavior. A weak middle slide costs you twice.
- A carousel needs to read as **one story**, not several unrelated posts stapled together — mixed
  visual systems slide-to-slide measurably hurt completion rate.

### What kills distribution outright
- Content fingerprinted as reposted from elsewhere (TikTok watermarks especially) — original,
  made-for-Instagram content gets up to **3x** the distribution of anything recycled.
- Misinformation, self-harm/violence/sexual content, regulated-goods promotion — Explore/Reels
  promotion is withheld entirely, not just down-ranked.
- Engagement bait ("comment X for Y," etc.) — actively penalized, not neutral.

### Hashtags are dead as a ranking lever
Hashtags stopped driving reach in December 2024. Use 3–5 relevant ones for on-platform search
only — don't rely on them for discovery. What actually helps discovery now:
- **Keywords in the caption** (plain language, not tags)
- **Keywords in the profile bio**
- **Alt text** on the image/video

### Posting cadence
- **Consistency beats frequency.** Accounts that post on a steady rhythm get roughly **5x** the
  engagement per post of sporadic accounts.
- Don't post multiple pieces back-to-back — Instagram suppresses some when they compete for the
  same engagement window. Space same-day posts hours apart.
- **Trial Reels** (available once an account passes ~1,000 followers): test a Reel with
  non-followers before it goes to your own audience. Useful for testing which angle on a story
  actually lands before committing your organic reach to it.

---

## PaddockIntel's five working formats

These map directly to the tests built in the "Madring Post Concepts" artifact — reuse the same
visual system (kraft base, Archivo Black for numbers, Lora for prose/quotes, JetBrains Mono for
labels/sources) so every post is recognizably PaddockIntel on sight, the same discipline
`DESIGN.md` v3.0.0 already enforces on-site.

| # | Format | Built for | When to use |
|---|---|---|---|
| 1 | **Hero Number** | Saves | Any post where a single stat is the whole story — reuses the same Hero Number pattern already live on article OG images |
| 2 | **Quote Card** | Sends (DM) | A quote dramatic or blunt enough that someone forwards it to a specific person, not just likes it |
| 3 | **Correction Split** | Comments | PaddockIntel's actual differentiator — visibly correcting its own earlier framing when new reporting changes the picture, per `EEAT-EXPERT.md`'s corrections policy |
| 4 | **Result Grid** | Baseline reach via consistency | The recurring, every-Grand-Prix post — post it regardless of whether there's a bigger story that weekend |
| 5 | **Economic Angle** | New-follower conversion via Explore | The post that explains *why follow PaddockIntel specifically* to someone who lands on it cold — money/stakes framing no other F1 account runs |

### Carousel structure (when a story has enough material for one)
Six slides, hook-and-payoff order, one visual system throughout:
1. **Hook** — a striking number with no context yet
2. **Twist** — the detail that recontextualizes slide 1
3. **Mechanism** — the "why," in PaddockIntel's actual analytical voice
4. **Quote or emotional peak** — the most send/comment-worthy line available
5. **Second storyline** — pivot without losing momentum
6. **CTA** — lands on the economic/stakes angle, links to the full article

### The evolving-motif technique (do this on every carousel from here on)

Validated 2026-09-14 on the Honda/Fukao leadership carousel — this is now the standard, not a
one-off. The difference between a carousel that's "just six stat cards" and one that reads as a
single visual story is one motif, not six icons:

1. **Pick one visual symbol tied to the story's actual mechanism, not a generic icon set.**
   For the Honda piece it was a signal/waveform line — because the real story was a vibrating
   engine. It appeared steady (hook), split in two (the leadership handoff), turned into an
   actual jagged waveform (the RA626H problem), calmed slightly (the quote), stopped in an
   hourglass (development time lost), and resolved into a forward arrow (the CTA). The icon
   isn't decoration — it's a second, wordless telling of the same arc. Find this motif *in the
   story's own subject matter* (an engine problem → vibration; a VSC-decided race → a pit-lane
   timing line; a budget story → a bar filling/draining) before defaulting to something generic.
2. **Use a real side-by-side comparison layout for any handoff/before-after beat**, instead of a
   single stat card, whenever the article already has two comparable entities with real data —
   two people, two teams, two seasons. Pull the actual bios/numbers for both sides; don't waste
   the slide on only one half of a comparison the article already makes.
3. **Tag interpretation visibly.** Any slide making PaddockIntel's own analytical claim (not a
   sourced fact) gets a small, explicit label in-frame — e.g. `PADDOCKINTEL ANALYSIS — NOT
   [SOURCE]'S STATEMENT` — instead of relying on tone or caption context alone. This is the
   `EEAT-EXPERT.md` distinction between sourced fact and PaddockIntel's own inference, made
   visible in the image itself, not just implied.
4. **Gate PNG export on real fonts being loaded** (`document.fonts.ready`) before enabling any
   "Generate PNG" button. Exporting before Archivo Black/Lora/JetBrains Mono finish loading
   silently captures a fallback system font — a bug that only shows up in the final PNG, not
   while looking at the live page.

---

## Caption checklist

- Lead with the specific fact, not a generic hook ("Norris built a 5-second lead" beats
  "Big drama in Madrid 🚨").
- Real keywords in plain language (driver names, team names, "constructors' championship") —
  this is what search/Explore actually reads now, not hashtags.
- 3–5 hashtags max, if any — treat them as on-platform search tags, not a reach lever.
- End with a specific CTA to the site (`paddockintel.com/[slug]`), not a vague "link in bio."
- No engagement bait. No fabricated urgency.
- Every number/quote in the caption must trace back to a sourced fact already verified for the
  linked article — Instagram copy isn't a lower bar than the article it promotes.

## Before publishing any post

- [ ] Every stat/quote matches what's in the linked article's `sources` frontmatter
- [ ] Visual system matches the five formats above — no one-off styling
- [ ] Caption has real keywords, not hashtag stuffing
- [ ] If it's a carousel: 4–8 slides, one consistent visual system, ends on a CTA
- [ ] If it's a carousel: one evolving motif tied to the story's actual mechanism runs through
      all 6 slides — not six unrelated icons
- [ ] If the carousel has a handoff/before-after beat with two comparable entities: built as a
      real side-by-side with both sides' actual data, not a single stat card
- [ ] Any slide stating PaddockIntel's own analysis (not a sourced fact) carries a visible
      "PaddockIntel analysis" tag in-frame
- [ ] If the post corrects earlier PaddockIntel coverage: use the Correction Split format, don't
      silently reframe
- [ ] Exported at 1080×1080 (square) or the correct aspect ratio for Reels/Stories — PNG export
      gated on fonts actually being loaded (`document.fonts.ready`), not fired immediately
