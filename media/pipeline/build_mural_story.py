"""Build a mural story JSON (media/kinetic/mural.html) from a race_story.json.

Every number comes from the recording (race_story.json + the 3D race.json's
positions/track). Editorial lines (hook tag, bottom chip, note) are flags, never
invented here. If the race_story carries a `provisional` section, a warning is
printed: mark provisional results as provisional unless stewards' decisions are
already applied and approved.

Usage:
  python3 build_mural_story.py <race_story.json> --track <race.json (3D)> \
    --title "SÃO PAULO" --circuit INTERLAGOS --year 2026 \
    [--track-label "AUTÓDROMO JOSÉ CARLOS PACE"] [--hook-tag "FROM THE BACK OF THE GRID"] \
    [--chip "MERCEDES CLINCH THE CONSTRUCTORS' TITLE"] [--note "FINAL AFTER STEWARDS' PENALTIES"] \
    [--out story-mural.json]
"""
import argparse, json, sys

ap = argparse.ArgumentParser()
ap.add_argument('race_story')
ap.add_argument('--track', required=True, help='3D race.json with track pts + positions_by_lap')
ap.add_argument('--title', required=True)
ap.add_argument('--circuit', required=True)
ap.add_argument('--year', required=True)
ap.add_argument('--hook-tag', default='', help='editorial tag after the climber name in the hook')
ap.add_argument('--chip', default='', help='editorial bottom chip (e.g. a clinched title)')
ap.add_argument('--note', default='', help='small classification note (e.g. stewards penalties)')
ap.add_argument('--seconds', type=float, default=42)
ap.add_argument('--out', default=None)
a = ap.parse_args()

rs = json.load(open(a.race_story, encoding='utf-8'))
r3 = json.load(open(a.track, encoding='utf-8'))

if rs.get('provisional'):
    print('[AVISO provisional] el race_story trae notas post-carrera sin clasificación FIA final:',
          file=sys.stderr)
    print('  ' + rs['provisional'].get('classification', ''), file=sys.stderr)
    print('  Revisa --note/--chip: no des resultados por finales sin verificarlos.', file=sys.stderr)

# pista: planta 2D normalizada al bbox
xs = [p[0] for p in r3['track']]; ys = [p[1] for p in r3['track']]
x0, y0, w, h = min(xs), min(ys), max(xs) - min(xs), max(ys) - min(ys)
pts = [[round((p[0] - x0) / w, 4), round((p[1] - y0) / h, 4)] for p in r3['track']]

cl = rs['biggest_climber']
positions = r3['positions_by_lap'].get(cl['code'])
if not positions:
    sys.exit(f"El race.json 3D no trae positions_by_lap para {cl['code']} — regenera los datos 3D con ese piloto.")

total = rs['total_laps']
win = rs['winner']
led = rs['laps_led']
fl = rs['fastest_lap']
interruptions = rs['interruptions']['track_status']
weather = rs['weather']
surname = lambda n: n.split()[-1]

tyres = rs['tyres']['most_common'][0].replace('INTERMEDIATE', 'INTER').replace('→', ' · ')
stats = [[str(total), 'LAPS'],
         [str(len(interruptions)), 'SAFETY CARS' if not interruptions else 'INTERRUPTIONS']]
if weather.get('rain'):
    lo, hi = weather['air_temp']
    stats.append(['RAIN', f'AIR {lo:g}–{hi:g}°C'])
stats.append([f"×{rs['tyres']['stops_winner']}", 'PIT STOPS · WINNER', tyres])
led_line = ' · '.join(f"{d['code']} LED {d['laps']} LAPS" if i == 0 else f"{d['code']} {d['laps']}"
                      for i, d in enumerate(led[:2]))
winner_sub = ('POLE · ' if win['grid'] == 1 else '') + \
             f"LED {next((d['laps'] for d in led if d['code'] == win['code']), 0)} OF {total} LAPS"
hook_sub = up = cl['name'].upper() + (f" · {a.hook_tag}" if a.hook_tag else '')

story = {
  'seconds': a.seconds, 'bpm': 106.06,
  'track': {'aspect': round(w / h, 4), 'pts': pts},
  'climb': {'grid': cl['grid'], 'positions': positions,
            'pmax': max(cl['grid'], max(positions), 20)},
  'data': {
    'total_laps': total,
    'podium': [{'pos': p['pos'], 'name': surname(p['name']), 'gap': p['gap']} for p in rs['podium']],
    'lead_changes': rs['lead_changes'],
  },
  'texts': {
    'header_left': 'PADDOCKINTEL RACE REPORT',
    'header_right': f'{a.circuit.upper()} · {a.year}',
    'title_lines': [w.strip().upper() for w in (a.title.split('/') if '/' in a.title
                    else a.title.split(maxsplit=1))],
    'hook_big': f"P{cl['grid']}", 'hook_to': f"→ P{cl['finish']}.",
    'hook_sub': hook_sub, 'hook_chip': f"+{cl['gain']} PLACES",
    'race_label': 'THE RACE',
    'track_outline': a.circuit.upper(),
    'stats': stats, 'tyres': tyres,
    'climb_label': f"{surname(cl['name']).upper()} · THE CLIMB",
    'climb_sub': f"+{cl['gain']} PLACES",
    'lead_label': 'THE LEAD', 'led_line': led_line,
    'winner_big': [surname(win['name']).upper(), 'WINS.'],
    'winner_sub': winner_sub,
    'chip_bottom': a.chip.upper(), 'note': a.note.upper(),
    'fl_line': f"FASTEST LAP · {fl['code']} {fl['time']} · L{fl['lap']}",
    'footer_lines': ['EVERY F1 SESSION,', 'IN DATA.'],
    'footer_chip': 'SUBSCRIBE · PADDOCKINTEL.COM',
    'closing_bar': 'EVERY F1 SESSION, IN DATA · SUBSCRIBE',
  },
}
out = a.out or 'story-mural.json'
json.dump(story, open(out, 'w', encoding='utf-8'), separators=(',', ':'), ensure_ascii=False)
print('ok', out)
