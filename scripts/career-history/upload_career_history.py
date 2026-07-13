"""
Uso:
    python3 upload_career_history.py --driver-ids russell
    python3 upload_career_history.py --all
    python3 upload_career_history.py --all --include-review
    python3 upload_career_history.py --driver-ids russell --dry-run
"""
import argparse
import json
import os
import sys

import requests
from wiki_client import fetch_wikitext, polite_delay
from parse_summary_table import parse_career_summary

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
MAPPING_PATH = os.path.join(os.path.dirname(__file__), "driver_mapping.json")


def upload_rows(rows):
    if not rows:
        return 0
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    url = f"{SUPABASE_URL}/rest/v1/driver_career_history"
    resp = requests.post(url, headers=headers, json=rows, timeout=30)
    resp.raise_for_status()
    return len(rows)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--driver-ids", nargs="*")
    parser.add_argument("--all", action="store_true")
    parser.add_argument("--include-review", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if not os.path.exists(MAPPING_PATH):
        print(f"No existe {MAPPING_PATH}. Corre primero build_driver_mapping.py")
        sys.exit(1)

    with open(MAPPING_PATH) as f:
        mapping = json.load(f)

    driver_ids = args.driver_ids if args.driver_ids else list(mapping.keys())

    total_uploaded = 0
    for driver_id in driver_ids:
        entry = mapping.get(driver_id)
        if not entry:
            print(f"[{driver_id}] no esta en el mapeo, saltando")
            continue
        if entry["confidence"] != "high" and not args.include_review:
            print(f"[{driver_id}] confianza '{entry['confidence']}' -> saltado (usa --include-review para forzar)")
            continue

        title = entry["wikipedia_title"]
        print(f"[{driver_id}] descargando '{title}' ...")
        wikitext = fetch_wikitext(title)
        polite_delay()
        if not wikitext:
            print(f"[{driver_id}] no se pudo descargar la pagina, saltando")
            continue

        source_url = f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}"
        rows = parse_career_summary(wikitext, driver_id=driver_id, source_url=source_url)

        if not rows:
            print(f"[{driver_id}] no se encontro tabla resumen de carrera reconocible")
            continue

        print(f"[{driver_id}] {len(rows)} filas parseadas")
        if args.dry_run:
            for r in rows:
                print("   ", r)
        else:
            uploaded = upload_rows(rows)
            total_uploaded += uploaded
            print(f"[{driver_id}] {uploaded} filas subidas a Supabase")

    print(f"\nTotal filas subidas: {total_uploaded}")


if __name__ == "__main__":
    main()
