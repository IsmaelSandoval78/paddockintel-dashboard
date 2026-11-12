"""Pipeline de producción del mural: UNA llamada → comprobación + las tres salidas.

  python3 mural_run.py <engine.html> <story.json> <out_base> \
      [--music <wav>] [--music-start <s>] \
      [--episode <engine16x9.html> <story16x9.json> <mix.wav>]

Pasos (en orden, aborta si falla alguno):
  1. check_mural.py (OBLIGATORIO — zonas seguras, cifra, texto mínimo)
  2. Short 9:16  → <out_base>.mp4
  3. Pósters     → <out_base>-1080x1920.png y <out_base>-1080x1350.png
  4. Episodio 16:9 (opcional, si se pasa --episode) → <out_base>-episode.mp4
La paleta por sede vive en mural-config.json; el story la lleva en story.palette.
"""
import pathlib, subprocess, sys

HERE = pathlib.Path(__file__).parent
args = sys.argv[1:]

episode = None
if '--episode' in args:
    i = args.index('--episode'); episode = args[i + 1:i + 4]; del args[i:i + 4]
music = []
if '--music' in args:
    i = args.index('--music'); music = ['--music', args[i + 1]]; del args[i:i + 2]
if '--music-start' in args:
    i = args.index('--music-start'); music += ['--music-start', args[i + 1]]; del args[i:i + 2]

engine, story, out_base = args[0], args[1], args[2]

def run(cmd, what):
    print(f'── {what}')
    r = subprocess.run(cmd, cwd=HERE)
    if r.returncode != 0:
        sys.exit(f'ABORTADO en: {what}')

run(['python3', 'check_mural.py', story, '--page', engine], 'comprobación de paradas')
run(['python3.13', 'render.py', engine, out_base + '.mp4', '--story', story] + music, 'short 9:16')
run(['python3', 'export_mural_still.py', story, out_base, '--page', engine], 'pósters 9:16 + 4:5')
if episode:
    ep_engine, ep_story, ep_mix = episode
    run(['python3', 'check_mural.py', ep_story, '--page', ep_engine, '--fmt', '16x9'], 'comprobación episodio')
    run(['python3.13', 'render.py', ep_engine, out_base + '-episode.mp4', '--story', ep_story,
         '--music', ep_mix, '--music-start', '0'], 'episodio 16:9')
print('✓ salidas completas:', out_base + '.mp4, pósters' + (', episodio' if episode else ''))
