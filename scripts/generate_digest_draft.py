#!/usr/bin/env python3
"""
Digest draft generator — live weekly newsletter (series='newsletter') and
retrospective Recap (series='recap').

Researches real F1 business/economics news for a date window via Claude's
web search, writes a digest issue in PaddockIntel's voice, and saves it to
Supabase as status='draft' — never auto-published. A GitHub issue is opened
so a human reviews before `scripts/publish_digest.py <slug>` flips it to
published.

For series='newsletter' (default), publishing triggers the existing daily
send cron (app/api/digest/send) which emails subscribers. For series='recap',
that cron explicitly excludes series != 'newsletter' — a Recap is web-only,
never emailed, by design (docs/ROADMAP-SEMANA.md, "Idea aprobada: serie de
Recaps retroactivos").

Usage:
  # Live newsletter, last 7 days ending today (default, unchanged behavior):
  python scripts/generate_digest_draft.py

  # Recap covering an explicit past range — always required for --series recap,
  # a "last 7 days" recap makes no sense (that's just a newsletter issue):
  python scripts/generate_digest_draft.py --series recap \\
      --week-start 2026-02-02 --week-end 2026-03-02

Env: ANTHROPIC_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
     GITHUB_TOKEN (for the notification issue; optional locally)
"""

import argparse
import json
import os
import re
import sys
import time
from datetime import date, timedelta
from pathlib import Path

import anthropic
import requests
from anthropic import Anthropic
from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv(Path(__file__).parent.parent / ".env.local")

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
ANTHROPIC_API_KEY = os.environ["ANTHROPIC_API_KEY"]
SITE_URL = os.environ.get("NEXT_PUBLIC_SITE_URL", "https://paddockintel.com")
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN")
GITHUB_REPO = os.environ.get("GITHUB_REPOSITORY", "IsmaelSandoval78/paddockintel-dashboard")

# A Recap is explicitly allowed to write with hindsight the live newsletter
# doesn't have ("this would prove decisive when, in April...") — the whole
# editorial point of the series (docs/ROADMAP-SEMANA.md). Below this floor,
# skip the range rather than force filler content — same "never invent"
# rule as the base prompt, just a stricter minimum for a retrospective batch.
RECAP_MIN_ITEMS = 3

DIGEST_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "intro_synthesis": {
            "type": "string",
            "description": "3-6 sentence editorial synthesis tying the week's stories together — PaddockIntel's own analytical voice, not a summary of headlines.",
        },
        "items": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "source_name": {"type": "string"},
                    "source_url": {"type": "string"},
                    "headline": {"type": "string"},
                    "our_summary": {
                        "type": "string",
                        "description": "2-4 sentences of PaddockIntel's own analysis/synthesis of this story — not a restatement of the headline.",
                    },
                    "entity_tags": {"type": "array", "items": {"type": "string"}},
                    "published_at": {"type": "string", "description": "ISO date YYYY-MM-DD"},
                },
                "required": ["source_name", "source_url", "headline", "our_summary", "entity_tags", "published_at"],
                "additionalProperties": False,
            },
        },
    },
    "required": ["intro_synthesis", "items"],
    "additionalProperties": False,
}

SYSTEM_PROMPT = """You are the editorial voice of PaddockIntel Digest — a weekly briefing on Formula 1
economics: sponsorship, media rights, team valuations, contracts, regulation, and the business side of
the sport. Not race results, not lap times — money and power.

Voice: dry, specific, analytical. Cite real dollar figures, real contract terms, real dates. Connect
stories to what they mean, don't just restate them. Never use hype language ("huge", "massive",
"game-changing"). Write like a trade publication analyst, not a sports blog.

CRITICAL — accuracy: every source_url must be a real URL you found via web search, not invented or
guessed. Every dollar figure, date, and name must come from what you actually read, not from prior
knowledge or plausible-sounding fabrication. If you cannot verify a specific figure, describe the
story without inventing the number. It is far better to return 4 well-sourced stories than 8 where
some are fabricated."""


def build_user_prompt(start: date, end: date, series: str) -> str:
    base = f"""Research real Formula 1 business/economics news published between {start.isoformat()} and
{end.isoformat()}. Use web search to find actual articles — sponsorship deals, broadcast/media rights,
team valuations or sales, driver/executive contracts, regulatory or Concorde Agreement developments,
race-hosting fees, technology/AI partnerships, cost-cap stories.

Find 4 to 9 stories from this window with real, verifiable sources. For each: the real source name and
URL, the real headline, your own 2-4 sentence analytical summary, entity tags (companies/people/teams
involved), and the real publish date.

Then write a 3-6 sentence intro_synthesis that ties the week's stories into one narrative — what they
mean together, not a list recap. Model the tone on this real example from a past issue:

"Kimi Antonelli converted pole into his sixth win of the season at Spa, stretching the championship
lead to 45 points over Lewis Hamilton with a dozen rounds still to run. But the number that matters
more for 2027 isn't on the timing sheet. Gwen Lagrue, the Mercedes scout who signed an 11-year-old
Antonelli to a factory contract in 2018, is leaving to run Red Bull's junior program — the exact seat
Helmut Marko vacated at the end of 2025."

Return only real findings. If fewer than 4 solid, verifiable stories exist for this window, return
fewer rather than inventing any."""

    if series == "recap":
        return base + f"""

This is a retrospective "Recap" covering a past window, written today ({date.today().isoformat()}) —
not the live weekly digest. Unlike the live edition, you may explicitly use hindsight: note when a
story from this window turned out to matter more than it seemed at the time (e.g. "this would prove
decisive when..."), as long as the later outcome you're referencing is itself something you can
verify, not a guess about how things turned out. If fewer than {RECAP_MIN_ITEMS} solid, verifiable
stories exist for this whole window, return fewer rather than inventing any — a thin or quiet window
gets skipped entirely rather than padded."""

    return base


def next_volume_number(sb: Client, series: str) -> int:
    prefix_re = re.compile(r"vol-(\d+)") if series == "newsletter" else re.compile(r"recap-(\d+)")
    res = sb.table("digest_issues").select("slug").eq("series", series).execute()
    max_vol = 0
    for row in res.data:
        m = prefix_re.match(row["slug"])
        if m:
            max_vol = max(max_vol, int(m.group(1)))
    return max_vol + 1


def generate_draft(start: date, end: date, series: str) -> dict:
    client = Anthropic(api_key=ANTHROPIC_API_KEY)

    max_attempts = 7
    response = None
    for attempt in range(1, max_attempts + 1):
        try:
            with client.messages.stream(
                # Sonnet, not Opus: this is web research + synthesis, not
                # heavy agentic reasoning — Sonnet 5 is close to Opus quality
                # here at ~40% of the cost, and every failed retry against an
                # overloaded API still bills partial search/token usage.
                model="claude-sonnet-5",
                max_tokens=16000,
                system=SYSTEM_PROMPT,
                tools=[{"type": "web_search_20260209", "name": "web_search", "max_uses": 12}],
                output_config={"format": {"type": "json_schema", "schema": DIGEST_JSON_SCHEMA}},
                messages=[{"role": "user", "content": build_user_prompt(start, end, series)}],
            ) as stream:
                response = stream.get_final_message()
            break
        except (anthropic.APIStatusError, anthropic.APIConnectionError) as exc:
            # Errors that arrive as an SSE "error" event mid-stream carry the
            # original 200 response, so response.status_code is useless for
            # retry decisions — the real error type is on exc.type (from the
            # error body) instead, e.g. "overloaded_error" with status_code 200.
            status = getattr(exc, "status_code", None)
            err_type = getattr(exc, "type", None)
            retryable = (
                status is None
                or status == 429
                or status >= 500
                or err_type in {"overloaded_error", "rate_limit_error", "api_error"}
            )
            if not retryable or attempt == max_attempts:
                raise
            wait_s = 30 * attempt
            print(f"Attempt {attempt}/{max_attempts} failed ({exc}); retrying in {wait_s}s", file=sys.stderr)
            time.sleep(wait_s)

    if response.stop_reason == "refusal":
        print("ERROR: request was refused, no draft generated", file=sys.stderr)
        sys.exit(1)

    if response.stop_reason == "max_tokens":
        print("ERROR: hit max_tokens before finishing — output was truncated", file=sys.stderr)
        sys.exit(1)

    text_blocks = [b.text for b in response.content if b.type == "text"]
    if not text_blocks:
        print("ERROR: no text content in response", file=sys.stderr)
        sys.exit(1)

    try:
        return json.loads(text_blocks[-1])
    except json.JSONDecodeError as exc:
        print(f"ERROR: model output was not valid JSON: {exc}", file=sys.stderr)
        print(text_blocks[-1], file=sys.stderr)
        sys.exit(1)


def save_draft(sb: Client, slug: str, series: str, issue_published_at: date, window_end: date, draft: dict) -> None:
    issue_row = (
        sb.table("digest_issues")
        .upsert(
            {
                "slug": slug,
                "series": series,
                "published_at": issue_published_at.isoformat(),
                "status": "draft",
                "intro_synthesis": draft["intro_synthesis"],
            },
            on_conflict="slug",
        )
        .execute()
    )
    issue_id = issue_row.data[0]["id"]

    sb.table("digest_items").delete().eq("issue_id", issue_id).execute()

    rows = [
        {
            "issue_id": issue_id,
            "source_name": item["source_name"],
            "source_url": item["source_url"],
            "headline": item["headline"],
            "our_summary": item["our_summary"],
            "entity_tags": item.get("entity_tags") or [],
            # Defensive fallback only — the schema requires the model to supply
            # published_at for every item. If it's ever missing, fall back to
            # the search window's end date, not the issue's own publish date
            # (which for a Recap can be months later and would misdate a
            # months-old story as if it happened today).
            "published_at": item.get("published_at") or window_end.isoformat(),
        }
        for item in draft["items"]
    ]
    if rows:
        sb.table("digest_items").insert(rows).execute()


def notify(slug: str, series: str, draft: dict) -> None:
    if not GITHUB_TOKEN:
        print("No GITHUB_TOKEN set — skipping notification issue (local run).")
        return

    headlines = "\n".join(f"- {item['headline']} ({item['source_name']})" for item in draft["items"])
    preview_path = "weekly" if series == "newsletter" else "recaps"
    body = f"""A new {series} draft is ready for review: **{slug}**

Preview: {SITE_URL}/{preview_path}/{slug}/

**{len(draft['items'])} stories found:**
{headlines}

---
To publish (triggers the existing daily send cron for newsletter issues only —
recap issues are web-only and never emailed):

```
python scripts/publish_digest.py {slug}
```
"""
    resp = requests.post(
        f"https://api.github.com/repos/{GITHUB_REPO}/issues",
        headers={"Authorization": f"Bearer {GITHUB_TOKEN}", "Accept": "application/vnd.github+json"},
        json={"title": f"Digest draft ready for review — {slug}", "body": body},
        timeout=30,
    )
    resp.raise_for_status()
    print(f"Notification issue opened: {resp.json()['html_url']}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument(
        "--series",
        choices=["newsletter", "recap"],
        default="newsletter",
        help="'newsletter' (default, live weekly digest) or 'recap' (retrospective, web-only, never emailed).",
    )
    parser.add_argument("--week-start", type=str, default=None, help="ISO date (YYYY-MM-DD) — start of the research window.")
    parser.add_argument("--week-end", type=str, default=None, help="ISO date (YYYY-MM-DD) — end of the research window.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    if args.week_start and args.week_end:
        start = date.fromisoformat(args.week_start)
        end = date.fromisoformat(args.week_end)
        if end < start:
            print("ERROR: --week-end is before --week-start", file=sys.stderr)
            sys.exit(1)
        if end > date.today():
            print("ERROR: --week-end is in the future", file=sys.stderr)
            sys.exit(1)
    elif args.week_start or args.week_end:
        print("ERROR: pass both --week-start and --week-end together, or neither", file=sys.stderr)
        sys.exit(1)
    elif args.series == "recap":
        print("ERROR: --series recap requires an explicit --week-start/--week-end range "
              "— a recap of 'the last 7 days' is just a newsletter issue.", file=sys.stderr)
        sys.exit(1)
    else:
        end = date.today()
        start = end - timedelta(days=7)

    sb = create_client(SUPABASE_URL, SUPABASE_KEY)

    vol = next_volume_number(sb, args.series)
    prefix = "vol" if args.series == "newsletter" else "recap"
    slug_date = end if args.series == "newsletter" else start
    slug = f"{prefix}-{vol:02d}-week-{slug_date.isoformat()}"

    print(f"Generating {args.series} draft {slug} for {start} .. {end}")
    draft = generate_draft(start, end, args.series)
    print(f"Got {len(draft['items'])} stories")

    if not draft["items"]:
        print("No verifiable stories found for this window — not saving an empty draft.")
        return

    if args.series == "recap" and len(draft["items"]) < RECAP_MIN_ITEMS:
        print(
            f"Only {len(draft['items'])} verifiable stories found — below the "
            f"{RECAP_MIN_ITEMS}-story floor for a Recap, skipping (no draft saved)."
        )
        return

    # The issue's own published_at is always "today" (when this draft is
    # actually saved/reviewed), never the covered window — a Recap's window
    # can be months in the past, and backdating published_at would violate
    # the project's "never fabricate a publish date" rule.
    save_draft(sb, slug, args.series, date.today(), end, draft)
    print(f"Saved as draft: {slug}")

    notify(slug, args.series, draft)


if __name__ == "__main__":
    main()
