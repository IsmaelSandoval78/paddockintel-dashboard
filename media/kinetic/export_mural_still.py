"""Export the full mural poster as still PNG(s) from mural.html + a story JSON.

Usage: python3 export_mural_still.py <story.json> <out_prefix> [WxH ...]
Default sizes: 1080x1920 (Stories/TikTok) and 1080x1350 (Instagram/X).
"""
import base64, json, pathlib, sys
from playwright.sync_api import sync_playwright

story_path = pathlib.Path(sys.argv[1]); prefix = sys.argv[2]
sizes = [tuple(map(int, s.split('x'))) for s in (sys.argv[3:] or ['1080x1920', '1080x1350'])]
page_path = pathlib.Path(__file__).parent / 'mural.html'
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
