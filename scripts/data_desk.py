#!/usr/bin/env python3
"""Data desk: post-race findings generator.

Runs a battery of queries against Supabase for one race and prints ranked,
verifiable findings (records broken, historical context, anomalies) as
Markdown — the raw material for the Monday data-autopsy article.

Note on pit stops: Ergast-style `pit_stops.duration` is TOTAL PIT LANE TIME
(entry to exit, typically 20s+), not the ~2s stationary time DHL publishes.
Findings are labeled accordingly.

Usage:
  NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  python3 scripts/data_desk.py <year> <round>
"""

import os
import sys
from datetime import date

import requests

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
H = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
PAGE = 1000


def get(path, params):
    r = requests.get(f"{SUPABASE_URL}/rest/v1/{path}", params=params, headers=H, timeout=30)
    r.raise_for_status()
    return r.json()


def get_all(path, params):
    """Paged fetch — PostgREST caps responses at 1,000 rows."""
    rows, offset = [], 0
    while True:
        chunk = get(path, {**params, "limit": PAGE, "offset": offset})
        rows.extend(chunk)
        if len(chunk) < PAGE:
            return rows
        offset += PAGE


def count_where(path, params):
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/{path}",
        params={**params, "limit": 1},
        headers={**H, "Prefer": "count=exact"},
        timeout=30,
    )
    r.raise_for_status()
    return int(r.headers["content-range"].split("/")[1])


def lap_ms(t):
    """'1:29.734' -> milliseconds, or None."""
    if not t or ":" not in t:
        return None
    try:
        m, rest = t.split(":")
        return int(m) * 60000 + int(round(float(rest) * 1000))
    except ValueError:
        return None


def main(year, rnd):
    findings = []  # (weight, headline, detail) — higher weight = more wow

    race = get("races", {"year": f"eq.{year}", "round": f"eq.{rnd}", "select": "id,name,date,circuit_id"})
    if not race:
        sys.exit(f"no race found for {year} round {rnd}")
    race = race[0]
    race_id, circuit_id = race["id"], race["circuit_id"]

    circuit = get("circuits", {"id": f"eq.{circuit_id}", "select": "name,location,country"})[0]

    # lookups
    drivers = {d["id"]: d for d in get_all("drivers", {"select": "id,forename,surname,code,dob"})}
    constructors = {c["id"]: c for c in get_all("constructors", {"select": "id,name"})}
    statuses = {s["id"]: s["status"] for s in get_all("status", {"select": "id,status"})}

    def dname(did):
        d = drivers[did]
        return f"{d['forename']} {d['surname']}"

    results = get_all("results", {"race_id": f"eq.{race_id}", "select": "*"})
    if not results:
        sys.exit(f"race {race_id} has no results loaded yet")

    # ---- 1. podium ----
    podium = sorted([r for r in results if r["position"] in (1, 2, 3)], key=lambda r: r["position"])
    winner = podium[0]
    win_drv, win_con = dname(winner["driver_id"]), constructors[winner["constructor_id"]]["name"]
    findings.append((1, f"Ganó {win_drv} ({win_con})",
                     "Podio: " + " / ".join(f"P{r['position']} {dname(r['driver_id'])}" for r in podium)))

    # ---- historical results at this circuit (all years) ----
    circuit_races = get_all("races", {"circuit_id": f"eq.{circuit_id}", "select": "id,year"})
    past_ids = [r["id"] for r in circuit_races if r["id"] != race_id]
    year_by_race = {r["id"]: r["year"] for r in circuit_races}
    hist = []
    for i in range(0, len(past_ids), 60):
        ids = ",".join(str(x) for x in past_ids[i : i + 60])
        hist.extend(get_all("results", {"race_id": f"in.({ids})", "select": "race_id,driver_id,constructor_id,grid,position,position_text"}))

    # ---- 2. grid -> win pattern ----
    win_grid = winner["grid"]
    past_wins = [h for h in hist if h["position"] == 1]
    from_pole = sum(1 for h in past_wins if h["grid"] == 1)
    same_slot = sum(1 for h in past_wins if h["grid"] == win_grid)
    if past_wins:
        pct = 100 * from_pole / len(past_wins)
        detail = f"Históricamente {from_pole}/{len(past_wins)} victorias aquí salieron de la pole ({pct:.0f}%)."
        if win_grid == 1:
            findings.append((2, f"Victoria desde la pole (P{win_grid})", detail))
        else:
            findings.append((3, f"Victoria desde P{win_grid} — solo {same_slot} veces en la historia de este circuito",
                             detail + f" Desde P{win_grid}: {same_slot} veces en {len(past_wins)} ediciones."))

    # ---- 3. biggest mover this race vs circuit history ----
    movers = [(r["grid"] - r["position"], r) for r in results if r["position"] and r["grid"]]
    if movers:
        gain, best = max(movers, key=lambda x: x[0])
        hist_movers = sorted(
            ((h["grid"] - h["position"], h) for h in hist if h["position"] and h["grid"]),
            key=lambda x: x[0], reverse=True,
        )
        better = sum(1 for g, _ in hist_movers if g > gain)
        top = hist_movers[0] if hist_movers else None
        detail = f"{dname(best['driver_id'])} pasó de P{best['grid']} a P{best['position']}."
        if top:
            detail += (f" Récord del circuito: +{top[0]} ({dname(top[1]['driver_id'])}, "
                       f"{year_by_race.get(top[1]['race_id'], '?')}).")
        weight = 8 if better == 0 and gain > 0 else (5 if better <= 3 else 2)
        label = "RÉCORD DEL CIRCUITO — " if better == 0 and gain > 0 else (f"top-{better+1} histórico — " if better <= 3 else "")
        findings.append((weight, f"{label}Remontada del día: +{gain} posiciones", detail))

    # ---- 4. pit stops ----
    stops = get_all("pit_stops", {"race_id": f"eq.{race_id}", "select": "driver_id,stop,lap,milliseconds"})
    if stops:
        fastest = min(stops, key=lambda s: s["milliseconds"])
        con_of = {r["driver_id"]: r["constructor_id"] for r in results}
        f_team = constructors[con_of[fastest["driver_id"]]]["name"]
        secs = fastest["milliseconds"] / 1000
        faster_here = count_where("pit_stops", {
            "milliseconds": f"lt.{fastest['milliseconds']}",
            "race_id": f"in.({','.join(str(x) for x in past_ids)})" if past_ids else "in.(0)",
        }) if past_ids else 0
        faster_ever = count_where("pit_stops", {"milliseconds": f"lt.{fastest['milliseconds']}"})
        weight = 8 if faster_here == 0 else (5 if faster_here <= 5 else 2)
        label = "RÉCORD DEL CIRCUITO — " if faster_here == 0 else ""
        findings.append((weight,
                         f"{label}Pit stop más rápido: {secs:.3f}s en pit lane ({dname(fastest['driver_id'])}, {f_team})",
                         f"Nº {faster_here+1} en la historia de este circuito; nº {faster_ever+1} de todos los tiempos "
                         f"(tiempo total en pit lane, no tiempo estacionario). Lap {fastest['lap']}, stop #{fastest['stop']}."))
        # team totals
        team_ms = {}
        for s in stops:
            t = constructors[con_of[s["driver_id"]]]["name"]
            team_ms.setdefault(t, []).append(s["milliseconds"])
        ranked = sorted(team_ms.items(), key=lambda kv: sum(kv[1]) / len(kv[1]))
        best_t, worst_t = ranked[0], ranked[-1]
        delta = (sum(worst_t[1]) / len(worst_t[1]) - sum(best_t[1]) / len(best_t[1])) / 1000
        findings.append((4, f"Pit lane: {best_t[0]} promedió {sum(best_t[1])/len(best_t[1])/1000:.2f}s; "
                            f"{worst_t[0]} el más lento, {delta:.2f}s/stop de diferencia",
                         f"{len(stops)} stops en total. Promedios por equipo sobre todos sus stops."))

    # ---- 5. retirements ----
    dnfs = [r for r in results if r["position"] is None]
    if dnfs:
        causes = {}
        for r in dnfs:
            causes.setdefault(statuses.get(r["status_id"], "?"), []).append(dname(r["driver_id"]))
        cause_txt = "; ".join(f"{k}: {', '.join(v)}" for k, v in causes.items())
        hist_by_race = {}
        for h in hist:
            hist_by_race.setdefault(h["race_id"], []).append(h)
        rates = [sum(1 for x in rs if x["position"] is None) / len(rs) for rs in hist_by_race.values() if rs]
        avg_rate = 100 * sum(rates) / len(rates) if rates else 0
        this_rate = 100 * len(dnfs) / len(results)
        findings.append((3 if this_rate > 2 * avg_rate else 1,
                         f"{len(dnfs)} abandonos ({this_rate:.0f}% del grid; promedio histórico aquí: {avg_rate:.0f}%)",
                         cause_txt))

    # ---- 6. race leaders from lap_times ----
    laps = get_all("lap_times", {"race_id": f"eq.{race_id}", "select": "driver_id,lap,position"})
    if laps:
        leaders_seq = [l["driver_id"] for l in sorted((l for l in laps if l["position"] == 1), key=lambda x: x["lap"])]
        changes = sum(1 for a, b in zip(leaders_seq, leaders_seq[1:]) if a != b)
        led = {}
        for d in leaders_seq:
            led[d] = led.get(d, 0) + 1
        led_txt = ", ".join(f"{dname(d)} {n} vueltas" for d, n in sorted(led.items(), key=lambda kv: -kv[1]))
        findings.append((4 if changes >= 4 else 2,
                         f"{len(led)} líderes distintos, {changes} cambios de líder en {len(leaders_seq)} vueltas",
                         f"Vueltas al frente: {led_txt}."))

    # ---- 7. fastest lap vs circuit record ----
    fl = [(lap_ms(r["fastest_lap_time"]), r) for r in results if lap_ms(r["fastest_lap_time"])]
    if fl:
        ms, r = min(fl, key=lambda x: x[0])
        findings.append((2, f"Vuelta rápida: {r['fastest_lap_time']} ({dname(r['driver_id'])})",
                         f"Velocidad media reportada: {r.get('fastest_lap_speed') or 'n/d'} km/h."))

    # ---- 8. winner milestones + age ----
    ds = get("driver_stats", {"driver_id": f"eq.{winner['driver_id']}", "select": "*"})
    if ds:
        wins = ds[0].get("wins")
        if wins in (1, 5, 10, 25, 50, 100) or (wins and wins % 10 == 0):
            findings.append((7, f"Victoria nº {wins} en la carrera de {win_drv}", "Cifra redonda — ángulo de artículo."))
        elif wins:
            findings.append((1, f"Victoria nº {wins} en la carrera de {win_drv}", ""))
    dob = drivers[winner["driver_id"]]["dob"]
    if dob:
        bd = date.fromisoformat(dob)
        rd = date.fromisoformat(race["date"])
        age = (rd - bd).days / 365.25
        ages = []
        for h in past_wins:
            hdob = drivers.get(h["driver_id"], {}).get("dob")
            hyr = year_by_race.get(h["race_id"])
            if hdob and hyr:
                ages.append((hyr - date.fromisoformat(hdob).year, h["driver_id"]))
        if ages:
            youngest = min(a for a, _ in ages)
            if age < youngest:
                findings.append((8, f"RÉCORD — ganador más joven en la historia de este circuito: {age:.1f} años", ""))

    # ---- 9. championship picture ----
    st = get("driver_standings", {"race_id": f"eq.{race_id}", "select": "driver_id,points,position,wins", "order": "position.asc", "limit": "3"})
    prev_race = get("races", {"year": f"eq.{year}", "round": f"eq.{rnd-1}", "select": "id"})
    if st and prev_race:
        prev = {s["driver_id"]: s for s in get("driver_standings", {"race_id": f"eq.{prev_race[0]['id']}", "select": "driver_id,points,position"})}
        gap_now = st[0]["points"] - st[1]["points"]
        p1_prev = prev.get(st[0]["driver_id"], {})
        p2_prev = prev.get(st[1]["driver_id"], {})
        gap_prev = (p1_prev.get("points", 0) - p2_prev.get("points", 0)) if p1_prev and p2_prev else None
        move = ""
        if gap_prev is not None:
            move = f" (era {gap_prev:.0f} antes de esta carrera)"
        lead_change = p1_prev.get("position") != 1 if p1_prev else False
        findings.append((9 if lead_change else 4,
                         ("CAMBIO DE LÍDER DEL CAMPEONATO — " if lead_change else "") +
                         f"Campeonato: {dname(st[0]['driver_id'])} lidera por {gap_now:.0f} pts{move}",
                         " · ".join(f"P{s['position']} {dname(s['driver_id'])} {s['points']:.0f} pts" for s in st)))

    # ---- output ----
    print(f"# Data desk — {race['name']} {year} (Round {rnd})")
    print(f"{circuit['name']}, {circuit['location']}, {circuit['country']} · {race['date']}")
    print(f"Ediciones históricas en la base para contexto: {len(set(year_by_race.values()))}\n")
    for w, headline, detail in sorted(findings, key=lambda f: -f[0]):
        print(f"## [{w}] {headline}")
        if detail:
            print(detail)
        print()


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(int(sys.argv[1]), int(sys.argv[2]))
