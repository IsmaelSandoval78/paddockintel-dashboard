"""Render an HTML animation (with window.draw(t) and window.ready) to an MP4, optionally with music.
Usage: python3.13 render.py <page.html> <out.mp4> --seconds 24 [--hold 22.5] [--music track.wav --music-start 22.646]
Template: python3.13 render.py kinetic.html out.mp4 --story story-mercedes.json  (seconds default to the story)"""
import argparse, base64, json, os, subprocess, tempfile, pathlib
from playwright.sync_api import sync_playwright
import imageio_ffmpeg
ap = argparse.ArgumentParser(); ap.add_argument('page'); ap.add_argument('out'); ap.add_argument('--seconds', type=float, default=None)
ap.add_argument('--hold', type=float, default=None, help='freeze the animation from this second on'); ap.add_argument('--fps', type=int, default=30)
ap.add_argument('--music'); ap.add_argument('--music-start', type=float, default=0)
ap.add_argument('--story', help='story .json to play with kinetic.html')
a = ap.parse_args(); story = json.load(open(a.story, encoding='utf-8')) if a.story else None
if a.seconds is None: a.seconds = float(story.get('seconds', 24)) if story else 24.0
n = int(a.seconds * a.fps); tmp = tempfile.mkdtemp()
url = pathlib.Path(a.page).resolve().as_uri()
with sync_playwright() as p:
    b = p.chromium.launch(args=['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']); pg = b.new_page(viewport={'width': 1080, 'height': 1920})
    if story: pg.add_init_script('window.STORY=' + json.dumps(story) + ';')
    pg.on('console', lambda m: print('[página]', m.text) if m.type in ('warning', 'error') else None)
    pg.goto(url); pg.wait_for_function('window.ready===true')
    for i in range(n):
        t = i / a.fps
        if a.hold is not None: t = min(t, a.hold)
        d = pg.evaluate(f"(()=>{{draw({t}); return document.getElementById('c').toDataURL('image/jpeg',0.93);}})()")
        open(f'{tmp}/f{i:05d}.jpg', 'wb').write(base64.b64decode(d.split(',')[1]))
        if i % 60 == 0: print(f'frame {i}/{n}')
    b.close()
ff = imageio_ffmpeg.get_ffmpeg_exe()
cmd = [ff, '-y', '-v', 'error', '-framerate', str(a.fps), '-i', f'{tmp}/f%05d.jpg']
if a.music: cmd += ['-ss', str(a.music_start), '-t', str(a.seconds), '-i', a.music, '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '192k', '-af', f'afade=t=out:st={a.seconds - 2}:d=2', '-shortest']
cmd += ['-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', a.out]
subprocess.run(cmd, check=True); print('Listo:', a.out)
