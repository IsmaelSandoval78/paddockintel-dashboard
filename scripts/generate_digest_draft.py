#!/usr/bin/env python3
"""
Weekly digest draft generator.
Researches the past week's F1 business/economics news via Claude's web search,
writes a digest issue in PaddockIntel's voice, and saves it to Supabase as
status='draft' — never auto-published. A GitHub issue is opened so a human
reviews before `scripts/publish_digest.py <slug>` flips it to published,
at which point the existing daily send cron (app/api/digest/send) mails it.

Run: python scripts/generate_digest_draft.py
Env: ANTHROPIC_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
     GITHUB_TOKEN (for the notification issue; optional locally)
"""

import json
import os
import re
import sys
from datetime import date, timedelta
from pathlib import Path

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


def build_user_prompt(start: date, end: date) -> str:
    return f"""Research real Formula 1 business/economics news published between {start.isoformat()} and
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


def next_volume_number(sb: Client) -> int:
    res = sb.table("digest_issues").select("slug").execute()
    max_vol = 0
    for row in res.data:
        m = re.match(r"vol-(\d+)", row["slug"])
        if m:
            max_vol = max(max_vol, int(m.group(1)))
    return max_vol + 1


def generate_draft(start: date, end: date) -> dict:
    client = Anthropic(api_key=ANTHROPIC_API_KEY)
    response = client.messages.create(
        model="claude-opus-4-8",
        max_tokens=8000,
        system=SYSTEM_PROMPT,
        tools=[{"type": "web_search_20260209", "name": "web_search", "max_uses": 12}],
        output_config={"format": {"type": "json_schema", "schema": DIGEST_JSON_SCHEMA}},
        messages=[{"role": "user", "content": build_user_prompt(start, end)}],
    )

    if response.stop_reason == "refusal":
        print("ERROR: request was refused, no draft generated", file=sys.stderr)
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


def save_draft(sb: Client, slug: str, week_start: date, draft: dict) -> None:
    issue_row = (
        sb.table("digest_issues")
        .upsert(
            {
                "slug": slug,
                "published_at": week_start.isoformat(),
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
            "published_at": item.get("published_at") or week_start.isoformat(),
        }
        for item in draft["items"]
    ]
    if rows:
        sb.table("digest_items").insert(rows).execute()


def notify(slug: str, draft: dict) -> None:
    if not GITHUB_TOKEN:
        print("No GITHUB_TOKEN set — skipping notification issue (local run).")
        return

    headlines = "\n".join(f"- {item['headline']} ({item['source_name']})" for item in draft["items"])
    body = f"""A new digest draft is ready for review: **{slug}**

Preview: {SITE_URL}/weekly/{slug}/

**{len(draft['items'])} stories found:**
{headlines}

---
To publish (triggers the existing daily send cron):

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


def main() -> None:
    sb = create_client(SUPABASE_URL, SUPABASE_KEY)

    end = date.today()
    start = end - timedelta(days=7)
    vol = next_volume_number(sb)
    slug = f"vol-{vol:02d}-week-{end.isoformat()}"

    print(f"Generating draft {slug} for {start} .. {end}")
    draft = generate_draft(start, end)
    print(f"Got {len(draft['items'])} stories")

    if not draft["items"]:
        print("No verifiable stories found for this window — not saving an empty draft.")
        return

    save_draft(sb, slug, end, draft)
    print(f"Saved as draft: {slug}")

    notify(slug, draft)


if __name__ == "__main__":
    main()
