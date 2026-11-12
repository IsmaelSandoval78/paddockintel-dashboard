"""Export the full mural poster as still PNG(s) from a mural engine + a story JSON.

Usage: python3 export_mural_still.py <story.json> <out_prefix> [--page <engine.html>] [WxH ...]
Default page: mural.html. Default sizes: 1080x1920 (Stories/TikTok) y 1080x1350 (feed 4:5).
"""
import base64, json, pathlib, sys
from playwright.sync_api import sync_playwright

args = sys.argv[1:]
page_name = 'mural.html'
if '--page' in args:
    i = args.index('--page'); page_name = args[i + 1]; del args[i:i + 2]
story_path = pathlib.Path(args[0]); prefix = args[1]
sizes = [tuple(map(int, s.split('x'))) for s in (args[2:] or ['1080x1920', '1080x1350'])]
page_path = pathlib.Path(__file__).parent / page_name
story = json.load(open(story_path, encoding='utf-8'))

with sync_playwright() as p:
    b = p.chromium.launch(args=['--enable-unsafe-swiftshader'])
    pg = b.new_page(viewport={'width': 540, 'height': 960})
    pg.add_init_script('window.STORY=' + json.dumps(story) + ';')
    pg.goto(page_path.resolve().as_uri())
    pg.wait_for_function('window.ready===true')
    for w, h in sizes:
        d = pg.evaluate(f"(()=>{{still({w},{h}); return document.getElementById('c').toDataURL('image/png');}})()")
        out = f'{prefix}-{w}x{h}.png'
        open(out, 'wb').write(base64.b64decode(d.split(',')[1]))
        print('ok', out)
    b.close()
