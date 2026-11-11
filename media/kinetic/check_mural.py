"""Check mural camera stops: the protagonist box of every stop must sit inside the
safe area (60px margins + TikTok/Reels safe zones). Run BEFORE rendering.

Usage: python3 check_mural.py <story.json> [--fmt 9x16|16x9]
Exit 0 = all stops pass; exit 1 = failures listed.
"""
import json, pathlib, sys
from playwright.sync_api import sync_playwright

story_path = sys.argv[1]
fmt = sys.argv[sys.argv.index('--fmt') + 1] if '--fmt' in sys.argv else '9x16'
page = sys.argv[sys.argv.index('--page') + 1] if '--page' in sys.argv else 'mural.html'
page_path = pathlib.Path(__file__).parent / page
story = json.load(open(story_path, encoding='utf-8'))

with sync_playwright() as p:
    b = p.chromium.launch(args=['--enable-unsafe-swiftshader'])
    pg = b.new_page(viewport={'width': 960, 'height': 540} if 'episode' in page else {'width': 540, 'height': 960})
    pg.add_init_script('window.STORY=' + json.dumps(story) + ';')
    pg.goto(page_path.resolve().as_uri() + f'?fmt={fmt}')
    pg.wait_for_function('window.ready===true')
    fails = pg.evaluate('checkStops()')
    b.close()

if fails:
    print(f'FALLAN {len(fails)} parada(s) [{fmt}]:')
    for f in fails:
        detail = f.get('why') or f"caja {f.get('box')} fuera de límites {f.get('limits')}"
        print(f"  · {f['stop']} (t={f['t']:.1f}s): {detail}")
    sys.exit(1)
print(f'OK [{fmt}]: todas las paradas dentro del área segura.')
