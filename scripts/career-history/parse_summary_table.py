"""
Parsea la tabla "Career results summary" de una pagina de piloto de Wikipedia
(wikitext crudo) y la convierte en filas estructuradas.

Columnas esperadas (con variantes toleradas):
Season | Series | Team | Races | Wins | Poles | F/Laps | Podiums | Points | Position
"""
import re
import wikitextparser as wtp

EXPECTED_HEADERS = ["season", "series", "team", "races", "wins", "poles",
                    "f/laps", "podiums", "points", "position"]

HEADER_ALIASES = {
    "season": "season", "series": "series", "team": "team",
    "races": "races", "starts": "races", "wins": "wins",
    "poles": "poles", "pole": "poles",
    "f/laps": "fastest_laps", "fastest laps": "fastest_laps", "fl": "fastest_laps",
    "podiums": "podiums",
    "points": "points", "pts": "points",
    "position": "position", "pos": "position", "pos.": "position", "dc": "position",
}

STAT_KEYS = ["races", "wins", "poles", "fastest_laps", "podiums", "points", "position"]

SEASON_PATTERN = re.compile(r'^\d{4}(\u2013\d{2,4}|-\d{2,4})?$')


def clean_cell(text: str) -> str:
    if text is None:
        return ""
    text = text.strip()
    text = re.sub(r'^[a-zA-Z]+="[^"]*"\s*\|', '', text).strip()
    text = re.sub(r'\[\[([^\|\]]+)\|([^\]]+)\]\]', r'\2', text)
    text = re.sub(r'\[\[([^\]]+)\]\]', r'\1', text)
    text = re.sub(r"'''([^']+)'''", r'\1', text)
    text = re.sub(r"''([^']+)''", r'\1', text)
    text = re.sub(r'<ref[^>]*>.*?</ref>', '', text, flags=re.DOTALL)
    text = re.sub(r'<ref[^/]*/>', '', text)
    return text.strip()


def has_unresolved_template(text: str) -> bool:
    """Detecta plantillas de Wikipedia sin resolver, ej: {{F1stat|RUS|wins}}.
    Estas son valores 'en vivo' que Wikipedia calcula, no numeros reales -> descartar."""
    return "{{" in text or "}}" in text


def is_valid_season(text: str) -> bool:
    return bool(SEASON_PATTERN.match(text.strip()))


def find_summary_table(wikitext: str):
    parsed = wtp.parse(wikitext)
    for table in parsed.tables:
        try:
            data = table.data(span=True)
        except Exception:
            continue
        if not data or len(data) < 2:
            continue
        header_row = [clean_cell(h).lower() for h in data[0]]
        matches = sum(1 for h in header_row if h in HEADER_ALIASES)
        if matches >= 5 and "season" in header_row and "series" in header_row:
            return data
    return None


def parse_career_summary(wikitext: str, driver_id: str, source_url: str):
    data = find_summary_table(wikitext)
    if data is None:
        return []

    header_row = [clean_cell(h).lower() for h in data[0]]
    col_map = {}
    for i, h in enumerate(header_row):
        mapped = HEADER_ALIASES.get(h)
        if mapped:
            col_map[mapped] = i

    rows = []
    last_season = None
    for raw_row in data[1:]:
        cells = [clean_cell(c) for c in raw_row]

        season_val = cells[col_map["season"]] if "season" in col_map and col_map["season"] < len(cells) else ""

        # Filtro 1: filas de pie de tabla (ej "Source:") -> descartar
        if season_val and not is_valid_season(season_val):
            continue

        if season_val:
            last_season = season_val
        season_val = last_season
        if season_val is None:
            continue

        def get(key):
            idx = col_map.get(key)
            if idx is None or idx >= len(cells):
                return None
            val = cells[idx]
            if val in ("", "-", "\u2014"):
                return None
            # Filtro 2: plantillas sin resolver (stats "en vivo") -> None, nunca inventar
            if has_unresolved_template(val):
                return None
            return val

        stat_values = {k: get(k) for k in STAT_KEYS}

        # Filtro 3: fila placeholder tipo "Test driver"/"Reserve driver" (colspan) -> nota, no stats
        non_null_stats = [v for v in stat_values.values() if v is not None]
        role_note = None
        if non_null_stats and len(set(non_null_stats)) == 1 and not non_null_stats[0].replace(".", "").isdigit():
            role_note = non_null_stats[0]
            stat_values = {k: None for k in STAT_KEYS}

        row = {
            "driver_id": driver_id,
            "season": season_val,
            "series_name": get("series"),
            "team": get("team"),
            "races": stat_values["races"],
            "wins": stat_values["wins"],
            "poles": stat_values["poles"],
            "fastest_laps": stat_values["fastest_laps"],
            "podiums": stat_values["podiums"],
            "points": stat_values["points"],
            "position": stat_values["position"],
            "role_note": role_note,
            "source_url": source_url,
        }
        if row["series_name"]:
            rows.append(row)
    return rows


if __name__ == "__main__":
    import sys
    from wiki_client import fetch_wikitext
    if len(sys.argv) < 2:
        print("Uso: python3 parse_summary_table.py \"Nombre Pagina Wikipedia\"")
        sys.exit(1)
    page = sys.argv[1]
    wt = fetch_wikitext(page)
    if not wt:
        print(f"No se encontro la pagina: {page}")
        sys.exit(1)
    result = parse_career_summary(wt, driver_id="test", source_url=f"https://en.wikipedia.org/wiki/{page.replace(' ', '_')}")
    for r in result:
        print(r)
