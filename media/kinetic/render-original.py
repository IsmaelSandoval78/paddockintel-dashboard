"""Render an HTML animation (with window.draw(t) and window.ready) to an MP4, optionally with music.
Usage: python3.13 render.py <page.html> <out.mp4> --seconds 24 [--hold 22.5] [--music track.wav --music-start 22.646]"""
import argparse, base64, os, subprocess, tempfile, pathlib
from playwright.sync_api import sync_playwright
import imageio_ffmpeg
ap = argparse.ArgumentParser(); ap.add_argument('page'); ap.add_argument('out'); ap.add_argument('--seconds', type=float, default=24)
ap.add_argument('--hold', type=float, default=None, help='freeze the animation from this second on'); ap.add_argument('--fps', type=int, default=30)
ap.add_argument('--music'); ap.add_argument('--music-start', type=float, default=0)
a = ap.parse_args(); n = int(a.seconds * a.fps); tmp = tempfile.mkdtemp()
url = pathlib.Path(a.page).resolve().as_uri()
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1080, 'height': 1920}); pg.goto(url); pg.wait_for_function('window.ready===true')
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
