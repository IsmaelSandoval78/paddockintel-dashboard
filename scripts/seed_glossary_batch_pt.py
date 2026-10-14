#!/usr/bin/env python3
"""PT (pt-BR) editions of the 20 glossary terms that only existed in EN/ES.

Each term's three depths (eli5 / technical / fia) are translated from the EN
rows in scripts/glossary_pt/<slug>.json. Everything that isn't prose is copied
from the EN row of the same depth so the editions can't drift: category,
related_terms, sources, translation_group_id and published_at. Glossary links
written as /glossary/<slug> are localized to /pt/glossary/<slug>.

Run from the repo root, with NEXT_PUBLIC_SUPABASE_URL and
SUPABASE_SERVICE_ROLE_KEY in .env.local:

    python scripts/seed_glossary_batch_pt.py            # dry run: checks only
    python scripts/seed_glossary_batch_pt.py --apply    # upsert as published

Idempotent: upserts on (locale, slug, depth). Refuses to write if a check
fails: missing EN row, a glossary link to a slug with no PT edition, or a
number in the EN text that doesn't appear in the PT text.
"""

import glob
import json
import os
import re
import sys

from dotenv import load_dotenv
from supabase import create_client

load_dotenv(".env.local")

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
DEPTHS = ("eli5", "technical", "fia")
COPIED = ("category", "related_terms", "sources", "translation_group_id", "published_at")


def numbers(text: str) -> list[str]:
    # Normalize EN (1,000.5) and PT (1.000,5) to bare digits so the two can be compared.
    found = re.findall(r"\d[\d.,]*\d|\d", text)
    return sorted(re.sub(r"[.,]", "", n) for n in found)


def main() -> None:
    apply = "--apply" in sys.argv
    sb = create_client(SUPABASE_URL, SUPABASE_KEY)

    terms = [json.load(open(f, encoding="utf-8")) for f in sorted(glob.glob("scripts/glossary_pt/*.json"))]
    slugs = {t["slug"] for t in terms}
    existing_pt = {r["slug"] for r in sb.table("glossary_terms").select("slug").eq("locale", "pt").execute().data}
    pt_slugs = slugs | existing_pt

    rows, problems = [], []
    for t in terms:
        for depth in DEPTHS:
            en = sb.table("glossary_terms").select("*").eq("locale", "en").eq("slug", t["slug"]).eq("depth", depth).execute().data
            if not en:
                problems.append(f"{t['slug']}/{depth}: no EN row")
                continue
            en = en[0]
            pt = t["depths"][depth]
            body = re.sub(r"\]\(/glossary/", "](/pt/glossary/", pt["body_markdown"])

            for target in re.findall(r"\]\(/pt/glossary/([a-z0-9-]+)", body):
                if target not in pt_slugs:
                    problems.append(f"{t['slug']}/{depth}: links /pt/glossary/{target}, which has no PT edition")

            # An EN-only "*Corrected YYYY-MM-DD: ...*" note documents a fix to the EN text; the PT
            # edition is written from the corrected text, so the note (and its date) isn't carried over.
            en_body = re.sub(r"^\*Corrected \d{4}-\d{2}-\d{2}:.*\*$", "", en["body_markdown"], flags=re.M)
            en_nums = numbers(en["short_definition"] + " " + en_body)
            pt_nums = numbers(pt["short_definition"] + " " + pt["body_markdown"])
            missing = [n for n in en_nums if en_nums.count(n) > pt_nums.count(n)]
            if missing:
                problems.append(f"{t['slug']}/{depth}: EN numbers missing in PT: {sorted(set(missing))}")

            rows.append({
                "locale": "pt",
                "slug": t["slug"],
                "depth": depth,
                "term": t["term"],
                "short_definition": pt["short_definition"],
                "body_markdown": body,
                "status": "published",
                **{k: en[k] for k in COPIED},
            })

    print(f"{len(rows)} rows prepared from {len(terms)} terms")
    if problems:
        print("Refusing to write:\n  " + "\n  ".join(problems))
        sys.exit(1)
    if not apply:
        print("Dry run OK. Re-run with --apply to write.")
        return
    for row in rows:
        sb.table("glossary_terms").upsert(row, on_conflict="locale,slug,depth").execute()
    print(f"Upserted {len(rows)} PT rows.")


if __name__ == "__main__":
    main()
