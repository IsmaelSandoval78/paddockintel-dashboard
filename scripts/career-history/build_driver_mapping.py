"""
Construye scripts/career-history/driver_mapping.json

Uso:
    python3 build_driver_mapping.py --driver-ids russell hamilton verstappen
    python3 build_driver_mapping.py --all
"""
import argparse
import json
import os
import sys

import requests
from wiki_client import search_pages, fetch_wikitext, polite_delay

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "driver_mapping.json")


def get_drivers_from_supabase(driver_ids=None):
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.")
        sys.exit(1)

    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    }
    url = f"{SUPABASE_URL}/rest/v1/drivers?select=driver_ref,forename,surname"
    if driver_ids:
        ids_filter = ",".join(driver_ids)
        url += f"&driver_ref=in.({ids_filter})"
    resp = requests.get(url, headers=headers, timeout=15)
    resp.raise_for_status()
    return resp.json()


def name_matches(full_name: str, title: str) -> bool:
    """Verifica que el TITULO encontrado coincida en apellido Y nombre con el
    piloto buscado. Esto evita confundir padres/hijos/homonimos
    (ej: buscar 'Max Verstappen' y que devuelva 'Jos Verstappen')."""
    parts = full_name.lower().split()
    if len(parts) < 2:
        return True
    surname = parts[-1]
    forename_tokens = parts[:-1]
    title_lower = title.lower()

    if surname not in title_lower:
        return False

    title_words = title_lower.split()
    for tok in forename_tokens:
        if tok in title_lower:
            return True
        if len(tok) >= 4:
            for w in title_words:
                if tok.startswith(w[:4]) or w.startswith(tok[:4]):
                    return True
    return False


def guess_wikipedia_page(full_name: str):
    candidates = search_pages(f"{full_name} Formula One", limit=5)
    polite_delay()
    if not candidates:
        return None, "review", []

    for title, snippet in candidates:
        if not name_matches(full_name, title):
            continue
        confidence = "review"
        if "(racing driver)" in title.lower():
            confidence = "high"
        else:
            wt = fetch_wikitext(title)
            polite_delay()
            if wt and "Formula One" in wt[:3000]:
                confidence = "high"
        if confidence == "high":
            return title, confidence, candidates

    return candidates[0][0], "review", candidates


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--driver-ids", nargs="*", help="IDs especificos (ej: russell hamilton)")
    parser.add_argument("--all", action="store_true", help="Recorrer toda la tabla drivers")
    args = parser.parse_args()

    if not args.driver_ids and not args.all:
        print("Especifica --driver-ids <id1> <id2> ... o --all")
        sys.exit(1)

    drivers = get_drivers_from_supabase(args.driver_ids)
    mapping = {}

    if os.path.exists(OUTPUT_PATH):
        with open(OUTPUT_PATH) as f:
            mapping = json.load(f)

    for d in drivers:
        driver_id = d["driver_ref"]
        full_name = f"{d['forename']} {d['surname']}"
        print(f"Buscando: {full_name} ({driver_id}) ...")
        title, confidence, candidates = guess_wikipedia_page(full_name)
        mapping[driver_id] = {
            "full_name": full_name,
            "wikipedia_title": title,
            "confidence": confidence,
            "other_candidates": [c[0] for c in candidates if c[0] != title],
        }
        print(f"  -> {title}  [{confidence}]")

    with open(OUTPUT_PATH, "w") as f:
        json.dump(mapping, f, indent=2, ensure_ascii=False)

    review_count = sum(1 for v in mapping.values() if v["confidence"] == "review")
    print(f"\nGuardado en {OUTPUT_PATH}")
    print(f"Total: {len(mapping)} | Necesitan revision manual: {review_count}")


if __name__ == "__main__":
    main()
