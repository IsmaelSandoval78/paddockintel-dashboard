"""
Cliente minimo para la API publica de Wikipedia (sin API key).
"""
import requests
import time

API_URL = "https://en.wikipedia.org/w/api.php"
HEADERS = {"User-Agent": "PaddockIntel-CareerHistoryBot/1.0 (hub.paddockintel.com)"}


def _get_with_retry(params, max_retries=4):
    """GET con reintento y backoff exponencial si Wikipedia responde 429."""
    delay = 2.0
    for attempt in range(max_retries):
        resp = requests.get(API_URL, params=params, headers=HEADERS, timeout=15)
        if resp.status_code == 429:
            wait = float(resp.headers.get("Retry-After", delay))
            print(f"  (429 Too Many Requests, esperando {wait:.0f}s...)")
            time.sleep(wait)
            delay *= 2
            continue
        resp.raise_for_status()
        return resp
    resp.raise_for_status()
    return resp


def fetch_wikitext(page_title: str) -> str | None:
    """Devuelve el wikitext crudo de una pagina, o None si no existe."""
    params = {
        "action": "parse",
        "page": page_title,
        "prop": "wikitext",
        "format": "json",
        "formatversion": "2",
    }
    resp = _get_with_retry(params)
    data = resp.json()
    if "error" in data:
        return None
    return data["parse"]["wikitext"]


def search_pages(query: str, limit: int = 3):
    """Busqueda de texto completo (no prefix-match) via action=query&list=search.
    Devuelve lista de (titulo, snippet)."""
    params = {
        "action": "query",
        "list": "search",
        "srsearch": query,
        "srlimit": limit,
        "format": "json",
    }
    resp = _get_with_retry(params)
    data = resp.json()
    results = data.get("query", {}).get("search", [])
    return [(r["title"], r.get("snippet", "")) for r in results]


def polite_delay():
    """Wikipedia pide no golpear la API sin pausas entre requests."""
    time.sleep(1.2)
