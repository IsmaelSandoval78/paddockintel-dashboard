#!/usr/bin/env python3
"""
Self-hosted SEO/EEAT audit — checks our own published content (articles,
glossary_terms) against the rules in EDITORIAL.md and the glossary's own
EEAT bar, instead of doing it by hand with a character-count one-liner
every time. Read-only, safe to run anytime.

Run: python scripts/seo_audit.py [--check-links]
  --check-links   also HEAD-request every source URL and flag dead ones
                   (slower — off by default)
"""

import os
import sys
from collections import defaultdict
from pathlib import Path

import requests
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(Path(__file__).parent.parent / ".env.local")

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

TITLE_MAX = 60
META_MAX = 145
META_MIN = 50
SHORT_DEF_MIN_WORDS = 30
SHORT_DEF_MAX_WORDS = 120

CHECK_LINKS = "--check-links" in sys.argv


def check_links(urls: list[str]) -> list[str]:
    """Return the subset of urls that fail a HEAD request. Best-effort —
    some sites block HEAD/bots, so a failure here is a signal to check
    manually, not an automatic verdict."""
    dead = []
    for url in urls:
        try:
            r = requests.head(url, timeout=6, allow_redirects=True, headers={"User-Agent": "Mozilla/5.0"})
            if r.status_code >= 400:
                # Some servers reject HEAD but accept GET — confirm before flagging
                r = requests.get(url, timeout=8, headers={"User-Agent": "Mozilla/5.0"})
                if r.status_code >= 400:
                    dead.append(f"{url} ({r.status_code})")
        except requests.RequestException as exc:
            dead.append(f"{url} ({type(exc).__name__})")
    return dead


def audit_articles(sb) -> list[tuple[str, list[str]]]:
    res = sb.table("articles").select(
        "slug, locale, title, meta_description, tags, translation_group_id, stats, faq_items, sources, status"
    ).eq("status", "published").execute()
    rows = res.data

    by_group: dict[str, list[dict]] = defaultdict(list)
    for r in rows:
        by_group[r["translation_group_id"]].append(r)

    findings = []
    for group_id, group_rows in by_group.items():
        locales_present = {r["locale"] for r in group_rows}
        missing = {"en", "es", "pt"} - locales_present
        if missing:
            slug = group_rows[0]["slug"]
            findings.append((f"articles/{slug} [{','.join(sorted(locales_present))}]",
                              [f"missing translation(s): {', '.join(sorted(missing))}"]))

        for r in group_rows:
            issues = []
            label = f"articles/{r['slug']} [{r['locale']}]"

            title = r.get("title") or ""
            if len(title) > TITLE_MAX:
                issues.append(f"title {len(title)} chars (> {TITLE_MAX})")

            meta = r.get("meta_description")
            if not meta:
                issues.append("missing meta_description")
            elif len(meta) > META_MAX:
                issues.append(f"meta_description {len(meta)} chars (> {META_MAX})")
            elif len(meta) < META_MIN:
                issues.append(f"meta_description only {len(meta)} chars (thin)")

            if not r.get("tags"):
                issues.append("no tags")

            faq = r.get("faq_items") or []
            if not faq:
                issues.append("no FAQ items (no People-Also-Ask schema signal)")

            stats = r.get("stats") or []
            if not stats:
                issues.append("no stat callouts")

            sources = r.get("sources") or []
            if not sources:
                issues.append("no sources cited")
            elif CHECK_LINKS:
                dead = check_links([s["url"] for s in sources if s.get("url")])
                if dead:
                    issues.append(f"dead/unreachable source(s): {'; '.join(dead)}")

            if issues:
                findings.append((label, issues))

    return findings


def audit_glossary(sb) -> list[tuple[str, list[str]]]:
    res = sb.table("glossary_terms").select(
        "slug, locale, term, category, short_definition, body_markdown, related_terms, sources, translation_group_id, status"
    ).eq("status", "published").execute()
    rows = res.data

    by_group: dict[str, list[dict]] = defaultdict(list)
    for r in rows:
        by_group[r["translation_group_id"]].append(r)

    findings = []
    for group_id, group_rows in by_group.items():
        locales_present = {r["locale"] for r in group_rows}
        missing = {"en", "es", "pt"} - locales_present
        if missing:
            slug = group_rows[0]["slug"]
            findings.append((f"glossary/{slug} [{','.join(sorted(locales_present))}]",
                              [f"missing translation(s): {', '.join(sorted(missing))}"]))

        for r in group_rows:
            issues = []
            label = f"glossary/{r['slug']} [{r['locale']}]"

            short_def = r.get("short_definition") or ""
            word_count = len(short_def.split())
            if word_count == 0:
                issues.append("missing short_definition")
            elif word_count < SHORT_DEF_MIN_WORDS:
                issues.append(f"short_definition only {word_count} words (thin, target 50-100)")
            elif word_count > SHORT_DEF_MAX_WORDS:
                issues.append(f"short_definition {word_count} words (over target 50-100)")

            if not (r.get("body_markdown") or "").strip():
                issues.append("missing body_markdown")

            if not r.get("related_terms"):
                issues.append("no related_terms (weak internal linking / topical authority)")

            sources = r.get("sources") or []
            if not sources:
                issues.append("no sources cited")
            elif CHECK_LINKS:
                dead = check_links([s["url"] for s in sources if s.get("url")])
                if dead:
                    issues.append(f"dead/unreachable source(s): {'; '.join(dead)}")

            if issues:
                findings.append((label, issues))

    return findings


def report(title: str, findings: list[tuple[str, list[str]]], total: int) -> None:
    print(f"\n{'=' * 60}\n{title} — {total} published, {len(findings)} with findings\n{'=' * 60}")
    if not findings:
        print("  Clean — nothing to flag.")
        return
    for label, issues in findings:
        print(f"\n  {label}")
        for issue in issues:
            print(f"    - {issue}")


def main() -> None:
    sb = create_client(SUPABASE_URL, SUPABASE_KEY)

    article_total = len(sb.table("articles").select("slug", count="exact").eq("status", "published").execute().data)
    glossary_total = len(sb.table("glossary_terms").select("slug", count="exact").eq("status", "published").execute().data)

    article_findings = audit_articles(sb)
    glossary_findings = audit_glossary(sb)

    report("ARTICLES", article_findings, article_total)
    report("GLOSSARY", glossary_findings, glossary_total)

    if not CHECK_LINKS:
        print("\n(Run with --check-links to also verify every cited source URL is still reachable.)")


if __name__ == "__main__":
    main()
