"""Build the long-form episode story (media/kinetic/mural-episode.html) by merging:
  · the race's mural story JSON (track, climb, podium, verified texts)
  · the episode plan JSON (chapter schedule + per-word cue times, bar-aligned)
  · the word-level transcripts JSON (for subtitles)

The episode format assumes the 10-chapter structure documented in
docs/MEDIA-PIPELINE.md (Hook, Interlagos/Circuit, Start, Lead, Tyres, Climb,
Flag, Stewards, Championship, Close) with cues in the plan's order.

Usage:
  python3 build_episode_story.py --mural story-mural.json --plan plan.json \
    --transcripts transcripts.json --texts texts.json --out story-episode.json
`--texts` carries the episode's verified display strings (see the SP example in
the docs); nothing is invented here.
"""
import argparse, json

ap = argparse.ArgumentParser()
ap.add_argument('--mural', required=True)
ap.add_argument('--plan', required=True)
ap.add_argument('--transcripts', required=True)
ap.add_argument('--texts', required=True)
ap.add_argument('--out', required=True)
a = ap.parse_args()

mural = json.load(open(a.mural, encoding='utf-8'))
plan = json.load(open(a.plan, encoding='utf-8'))
tr = json.load(open(a.transcripts, encoding='utf-8'))
texts = json.load(open(a.texts, encoding='utf-8'))

CUE_NAMES = [
    ['p21', 'hook_p2', 'chip19', 'rain'],
    ['s71', 'srain', 'ssc', 'svsc'],
    ['pole', 'p3', 'c_ant', 'c_law'],
    ['lead0', 'lead1', 'lead2', 'lead3', 'led48', 'led23'],
    ['ty1', 'ty17', 'ty63'],
    ['cl0', 'cl1', 'cl2', 'cl3', 'gap14', 'places19'],
    ['wins', 'row2', 'row3', 'fl', 'fl55'],
    ['mv_ham', 'mv_lin', 'mv_bea'],
    ['br_bor', 'br_cam', 'br_debut', 'br_res'],
    ['ret2', 'ret_str', 'ret_bot'],
    ['pen5', 'pen0', 'pen1', 'pen2'],
    ['champ', 'nine', 'y2021'],
    ['cta', 'vegas'],
]

cue = {}
chapters = []
for ch, names in zip(plan['chapters'], CUE_NAMES):
    chapters.append({'start': ch['start'], 'end': ch['end']})
    for name, c in zip(names, ch['cues']):
        if c['t'] is None:
            raise SystemExit(f"cue sin tiempo: {name} — revisa la transcripción")
        cue[name] = c['t']

climb_steps = [{'t': cue[f'cl{i}'], 'pos': p, 'lap': l}
               for i, (p, l) in enumerate(texts['climb_steps'])]

# correcciones de transcripción (nombres/cifras que Whisper falla)
FIXES = [(r'Interlargos|[Ii]nto Lagos', 'Interlagos'),
         (r"wins for Stappen's 2nd", 'wins. Verstappen second'),
         (r'Isaac Hadja\b', 'Isack Hadjar'),
         (r'a?\s*112\s*\.689', 'a 1:12.689'),
         (r'Ismail', 'Ismael'),
         (r'Patek Intel', 'PaddockIntel'),
         (r'Beerman', 'Bearman'),
         (r'Bortolito', 'Bortoleto'),
         (r'[Ll]and [Ss]troll', 'Lance Stroll'),
         (r'\bCamara\b', 'Câmara')]
def fix(text):
    for pat, rep in FIXES:
        text = __import__('re').sub(pat, rep, text)
    return text

# subtítulos: trocear palabras en frases cortas (≤38 caracteres)
captions = []
keys = [ch['file'] for ch in plan['chapters']]   # orden del plan (soporta 7B/7C/7D)
for ch, key in zip(chapters, keys):
    words, chunk = tr[key], []
    for w in words:
        chunk.append(w)
        text = ' '.join(x['w'] for x in chunk)
        if len(text) >= 30 and (w['w'].rstrip()[-1:] in '.,?!' or len(text) >= 38):
            text = fix(text)
            captions.append({'t0': round(ch['start'] + chunk[0]['s'] - 0.05, 2),
                             't1': round(ch['start'] + chunk[-1]['e'] + 0.25, 2),
                             'text': text})
            chunk = []
    if chunk:
        captions.append({'t0': round(ch['start'] + chunk[0]['s'] - 0.05, 2),
                         't1': round(ch['start'] + chunk[-1]['e'] + 0.25, 2),
                         'text': fix(' '.join(x['w'] for x in chunk))})
for i in range(len(captions) - 1):                 # sin solapes
    captions[i]['t1'] = min(captions[i]['t1'], captions[i + 1]['t0'] - 0.02)

story = {
    'seconds': plan['t_end'], 'bpm': plan['bpm'],
    'track': mural['track'], 'climb': mural['climb'], 'data': mural['data'],
    'texts': {**mural['texts'], **texts['texts']},
    'episode': {'chapters': chapters, 'cue': cue,
                'climb_steps': climb_steps, 'captions': captions},
}
json.dump(story, open(a.out, 'w', encoding='utf-8'), separators=(',', ':'), ensure_ascii=False)
print('ok', a.out, f"| {len(cue)} cues, {len(captions)} subtítulos, {plan['t_end']}s")
