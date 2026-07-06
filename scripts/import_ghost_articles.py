#!/usr/bin/env python3
"""One-time migration: Ghost(Pro) blog -> Supabase `articles` table.

Pulls every published post from the Ghost Content API, converts HTML to
Markdown (images intentionally dropped — the magazine is text-only), and
inserts them as locale='en' published rows. Slugs and published_at are
preserved so the 99 historical URLs resolve at the exact same root-level
trailing-slash paths they had on Ghost (SEO continuity).

Idempotent: slugs already present in `articles` are skipped, so the two
articles written natively in the new system are never touched.

Usage:
  GHOST_KEY=... GHOST_URL=https://paddock-intel.ghost.io \
  NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  python3 scripts/import_ghost_articles.py [--dry-run]
"""

import json
import os
import re
import sys
import uuid

import html2text
import requests

GHOST_URL = os.environ["GHOST_URL"].rstrip("/")
GHOST_KEY = os.environ["GHOST_KEY"]
SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
DRY_RUN = "--dry-run" in sys.argv

SB_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}


def fetch_ghost_posts():
    posts, page = [], 1
    while True:
        r = requests.get(
            f"{GHOST_URL}/ghost/api/content/posts/",
            params={
                "key": GHOST_KEY,
                "limit": 50,
                "page": page,
                "formats": "html",
                "include": "tags",
            },
            timeout=30,
        )
        r.raise_for_status()
        data = r.json()
        posts.extend(data["posts"])
        pagination = data["meta"]["pagination"]
        if pagination["next"] is None:
            return posts
        page = pagination["next"]


def to_markdown(html):
    h = html2text.HTML2Text()
    h.ignore_images = True   # magazine is text-only by design
    h.body_width = 0         # no hard wrapping
    h.ignore_emphasis = False
    h.protect_links = True
    md = h.handle(html or "")
    # Ghost cards sometimes leave empty figure remnants; collapse 3+ blank lines
    md = re.sub(r"\n{3,}", "\n\n", md).strip()
    return strip_ghost_header(md)


def strip_ghost_header(md):
    """Every Ghost post opens with a kicker ("PaddockIntel.com Market Report"),
    an H1 repeating the title, and a meta line ("May 22-24 • ... • PaddockIntel.com").
    The new article template renders title/date itself, so drop that head block."""
    blocks = md.split("\n\n")
    i = 0
    if i < len(blocks) and blocks[i].startswith("PaddockIntel.com"):
        i += 1
    if i < len(blocks) and blocks[i].lstrip().startswith("# "):
        i += 1
    if i < len(blocks) and ("PaddockIntel.com" in blocks[i] or "•" in blocks[i]) and len(blocks[i]) < 200:
        i += 1
    return "\n\n".join(blocks[i:]).strip()


def existing_slugs():
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/articles",
        params={"select": "slug", "limit": "1000"},
        headers=SB_HEADERS,
        timeout=30,
    )
    r.raise_for_status()
    return {row["slug"] for row in r.json()}


def main():
    posts = fetch_ghost_posts()
    print(f"fetched {len(posts)} published posts from Ghost")

    skip = existing_slugs()
    rows = []
    for p in posts:
        if p["slug"] in skip:
            print(f"  skip (exists): {p['slug']}")
            continue
        body = to_markdown(p.get("html"))
        if not body:
            print(f"  skip (empty body): {p['slug']}")
            continue
        rows.append(
            {
                "id": str(uuid.uuid4()),
                "translation_group_id": str(uuid.uuid4()),
                "locale": "en",
                "slug": p["slug"],
                "title": p["title"],
                "meta_description": p.get("meta_description")
                or p.get("custom_excerpt")
                or None,
                "cover_image_url": None,
                "body_markdown": body,
                "tags": [t["slug"] for t in p.get("tags", [])],
                "status": "published",
                "published_at": p["published_at"],
            }
        )

    print(f"prepared {len(rows)} rows ({len(skip)} slugs already in table)")
    if DRY_RUN:
        for r_ in rows[:3]:
            print(json.dumps({k: (v[:80] if isinstance(v, str) else v) for k, v in r_.items()}, indent=2))
        print("dry run — nothing inserted")
        return

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

    print("done")


if __name__ == "__main__":
    main()
