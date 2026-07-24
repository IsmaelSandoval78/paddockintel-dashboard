#!/usr/bin/env python3
"""
Flip a digest draft to published. The existing daily send cron
(app/api/digest/send) then mails it automatically on its next run.

Run: python scripts/publish_digest.py <slug>
"""

import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

load_dotenv(Path(__file__).parent.parent / ".env.local")


def main() -> None:
    if len(sys.argv) != 2:
        print("Usage: python scripts/publish_digest.py <slug>", file=sys.stderr)
        sys.exit(1)

    slug = sys.argv[1]
    sb = create_client(os.environ["NEXT_PUBLIC_SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])

    existing = sb.table("digest_issues").select("id, status").eq("slug", slug).single().execute()
    if not existing.data:
        print(f"No digest issue found with slug '{slug}'", file=sys.stderr)
        sys.exit(1)
    if existing.data["status"] == "published":
        print(f"'{slug}' is already published.")
        return

    sb.table("digest_issues").update({"status": "published"}).eq("slug", slug).execute()
    print(f"Published: {slug} — will be emailed on the next digest send cron run.")


if __name__ == "__main__":
    main()
