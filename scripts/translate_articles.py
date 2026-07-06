#!/usr/bin/env python3
"""Translate EN articles to ES/PT via the Anthropic Message Batches API.

Two subcommands:
  submit             — collect EN articles missing an es/pt sibling, create
                       one batch (2 requests per article), print the batch id
  fetch <batch_id>   — poll until the batch ends, parse results, insert the
                       translated rows into `articles`

Translations share the EN row's translation_group_id, slug, tags, and
published_at; only title / meta_description / body_markdown are localized.
Idempotent on both sides: submit skips already-translated groups, fetch
re-checks before inserting.

Usage:
  ANTHROPIC_API_KEY=... NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  python3 scripts/translate_articles.py submit
  python3 scripts/translate_articles.py fetch msgbatch_...
"""

import json
import os
import sys
import time
import uuid

import requests
from anthropic import Anthropic
from anthropic.types.message_create_params import MessageCreateParamsNonStreaming
from anthropic.types.messages.batch_create_params import Request

MODEL = "claude-opus-4-8"
TARGET_LOCALES = ["es", "pt"]

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
SB_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}

LOCALE_NAMES = {"es": "Latin American Spanish (neutral, international)", "pt": "Brazilian Portuguese"}

SCHEMA = {
    "type": "object",
    "properties": {
        "title": {"type": "string"},
        "meta_description": {"type": ["string", "null"]},
        "body_markdown": {"type": "string"},
    },
    "required": ["title", "meta_description", "body_markdown"],
    "additionalProperties": False,
}

SYSTEM = """You are the staff translator for PaddockIntel, an F1 economics publication.
Translate the given article to {language}. Rules:
- Preserve ALL Markdown structure exactly: headings, bold, lists, links, tables, blockquotes.
- Do not translate: proper nouns, team names (Red Bull Racing, Mercedes-AMG), driver names,
  circuit names, series names (F1, IndyCar, NASCAR), company/sponsor names, URLs, link targets.
- Keep every number, currency amount, unit, and percentage exactly as written.
- F1 jargon: use the terms F1 media in that language actually uses (e.g. Spanish keeps
  "pole position", "pit stop", "paddock"); translate only what is naturally translated.
- title: natural headline in the target language, aim for <= 60 characters.
- meta_description: <= 145 characters. If the source meta_description is null, return null.
- Editorial tone: sharp, factual, business-journalism register. No embellishment."""


def sb_get(path, params):
    r = requests.get(f"{SUPABASE_URL}/rest/v1/{path}", params=params, headers=SB_HEADERS, timeout=30)
    r.raise_for_status()
    return r.json()


def existing_locale_groups():
    """translation_group_ids that already have a row per target locale."""
    have = {loc: set() for loc in TARGET_LOCALES}
    rows = sb_get("articles", {"select": "translation_group_id,locale", "limit": "1000"})
    for row in rows:
        if row["locale"] in have:
            have[row["locale"]].add(row["translation_group_id"])
    return have


def cmd_submit():
    client = Anthropic()
    articles = sb_get(
        "articles",
        {
            "select": "id,translation_group_id,slug,title,meta_description,body_markdown,tags,published_at",
            "locale": "eq.en",
            "status": "eq.published",
            "limit": "1000",
        },
    )
    have = existing_locale_groups()

    batch_requests = []
    for a in articles:
        payload = json.dumps(
            {"title": a["title"], "meta_description": a["meta_description"], "body_markdown": a["body_markdown"]},
            ensure_ascii=False,
        )
        for loc in TARGET_LOCALES:
            if a["translation_group_id"] in have[loc]:
                continue
            batch_requests.append(
                Request(
                    custom_id=f"{a['id']}_{loc}",
                    params=MessageCreateParamsNonStreaming(
                        model=MODEL,
                        max_tokens=16000,
                        system=SYSTEM.format(language=LOCALE_NAMES[loc]),
                        output_config={"format": {"type": "json_schema", "schema": SCHEMA}},
                        messages=[{"role": "user", "content": payload}],
                    ),
                )
            )

    if not batch_requests:
        print("nothing to translate — all groups have es+pt rows")
        return

    print(f"{len(articles)} EN articles -> {len(batch_requests)} translation requests")
    batch = client.messages.batches.create(requests=batch_requests)
    print(f"batch created: {batch.id}")
    print(f"next: python3 scripts/translate_articles.py fetch {batch.id}")


def cmd_fetch(batch_id):
    client = Anthropic()
    while True:
        batch = client.messages.batches.retrieve(batch_id)
        counts = batch.request_counts
        print(f"status={batch.processing_status} ok={counts.succeeded} err={counts.errored} pending={counts.processing}")
        if batch.processing_status == "ended":
            break
        time.sleep(30)

    # source rows keyed by id, for slug/tags/dates
    articles = {
        a["id"]: a
        for a in sb_get(
            "articles",
            {
                "select": "id,translation_group_id,slug,title,tags,published_at",
                "locale": "eq.en",
                "limit": "1000",
            },
        )
    }
    have = existing_locale_groups()

    rows, failed = [], []
    for result in client.messages.batches.results(batch_id):
        art_id, loc = result.custom_id.rsplit("_", 1)
        if result.result.type != "succeeded":
            failed.append((result.custom_id, result.result.type))
            continue
        msg = result.result.message
        if msg.stop_reason != "end_turn":
            failed.append((result.custom_id, f"stop_reason={msg.stop_reason}"))
            continue
        src = articles.get(art_id)
        if src is None or src["translation_group_id"] in have[loc]:
            continue
        try:
            out = json.loads(msg.content[0].text)
        except (ValueError, IndexError, AttributeError) as e:
            failed.append((result.custom_id, f"parse: {e}"))
            continue
        rows.append(
            {
                "id": str(uuid.uuid4()),
                "translation_group_id": src["translation_group_id"],
                "locale": loc,
                "slug": src["slug"],
                "title": out["title"],
                "meta_description": out["meta_description"],
                "cover_image_url": None,
                "body_markdown": out["body_markdown"],
                "tags": src["tags"],
                "status": "published",
                "published_at": src["published_at"],
            }
        )

    print(f"parsed {len(rows)} translations, {len(failed)} failed")
    for cid, why in failed:
        print(f"  FAILED {cid}: {why}")

    for i in range(0, len(rows), 50):
        chunk = rows[i : i + 50]
        r = requests.post(
            f"{SUPABASE_URL}/rest/v1/articles",
            headers={**SB_HEADERS, "Prefer": "return=minimal"},
            json=chunk,
            timeout=60,
        )
        if r.status_code >= 300:
            print(f"INSERT FAILED at chunk {i}: {r.status_code} {r.text}")
            sys.exit(1)
        print(f"inserted {i + len(chunk)}/{len(rows)}")
    print("done" if not failed else "done — re-run `submit` to retry the failed ones")


if __name__ == "__main__":
    if len(sys.argv) >= 2 and sys.argv[1] == "submit":
        cmd_submit()
    elif len(sys.argv) >= 3 and sys.argv[1] == "fetch":
        cmd_fetch(sys.argv[2])
    else:
        print(__doc__)
        sys.exit(1)
