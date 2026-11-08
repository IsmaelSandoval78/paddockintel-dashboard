# PaddockIntel kinetic-typography videos (Swiss style)

`mercedes-9.html` is a working example: a 1080x1920 canvas animation with `window.draw(t)` (t in seconds) and `window.ready`.
It uses huge black grotesque type (Inter Tight 900/500) on paper (#F4F2EE), one accent colour, and three signature moves:
1. Zoom-through: the camera scales 40-60x onto a point INSIDE a letter (a stroke goes to full black, a counter/hole goes to full paper), then cuts to the next poster.
2. Motion blur: when the camera moves fast, each frame averages 8 sub-frames (see `draw` and `cam`).
3. Kinetic rows: big lines slide in from alternating sides on the beat (106.06 BPM).

`render.py` renders any such page to MP4 with music: `python3.13 render.py page.html out.mp4 --seconds 24 --hold 22.5 --music PaddockIntel_Decoded.wav --music-start 22.646`.
Open a page with `?play=1` to preview it in real time.

## What to build
Turn this into a template: a `story.json` describes the posters (title lines, small labels, numbers, accent colour, which letter to dive into, timing in beats) and one HTML engine (`kinetic.html`) plays any story. Keep the exact look and moves of `mercedes-9.html`.
Then make a second story from my request, and render it with render.py.
Explain each step to me in Spanish; I am not a developer.
