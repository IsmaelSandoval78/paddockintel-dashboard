# Brief: bring the PaddockIntel media tools into this repo (media/)

The owner is not a developer: explain every step in one short sentence in Spanish, and ask before anything destructive.

## MANDATORY before touching anything (orders, not suggestions)
1. Read `CLAUDE.md`, `docs/ROADMAP-SEMANA.md` and these advisor files: `docs/advisors/DATA-EXPERT.md` and `docs/advisors/CYBERSECURITY-EXPERT.md`. Apply them to every decision below.
2. Work on a NEW branch called `media-pipeline` (from the current main). Never commit to main, never push without asking.
3. Do not change anything in the website code (Next.js app, Supabase migrations, Cloudflare/wrangler config) except what is strictly needed to EXCLUDE `media/` from the website build, lint and type-check.
4. When you show or change a file, deliver the complete file, never a fragment.

## Where things are today (on this Mac)
- Live-timing recorder: `~/Desktop/Overtake/recorder/` (race_weekend.py, export_session.py, record_session.py, f1tv_auth.py, after_race.sh, recordings/ folder).
- 3D template (Three.js + Vite): `~/Desktop/paddockintel-3d/` (has node_modules, dist, data/, scripts/ with decode_recording.py and build_session.py).
- Kinetic typography kit: `~/Desktop/kinetic-kit/` (render.py, HTML pages, fonts, story files).

## Target layout
```
media/
  README.md            short map of the folders
  recorder/            the recorder scripts (NO recordings, NO tokens)
  pipeline/            decode_recording.py, build_session.py (recording -> CSVs -> session.json)
  3d/                  the 3D template source (NO node_modules, NO dist)
  kinetic/             the kinetic kit (render.py, templates, fonts)
```
Heavy and private files live OUTSIDE the repo, in `~/PaddockIntel-Data/`:
```
~/PaddockIntel-Data/recordings/   live-timing .txt recordings
~/PaddockIntel-Data/sessions/     decoded zips and session.json files
~/PaddockIntel-Data/renders/      finished videos
~/PaddockIntel-Data/music/        PaddockIntel_Decoded.wav and the editions
```

## Tasks
1. Create `~/PaddockIntel-Data/` with the four folders. COPY (do not move yet) the existing recordings, music files and finished videos into it.
2. COPY the code into `media/` following the layout. Exclude node_modules, dist, recordings, .mp4/.wav/.mov and any token or auth file.
3. Paths: make every script read the data folder from an environment variable `PI_DATA_DIR` (default `~/PaddockIntel-Data`). The recorder must write new recordings to `$PI_DATA_DIR/recordings`.
4. Secrets: verify that no token, cookie, password or `~/.f1tv_token` / FastF1 auth file is copied or referenced with its contents. Tokens stay in the home folder.
5. `.gitignore`: add `media/**/node_modules`, `media/**/dist`, `*.mp4`, `*.mov`, `*.wav`, `media/**/recordings/`, and any cache folders. Show me the final file.
6. Make sure the website build ignores `media/` (tsconfig include/exclude, ESLint ignore, any bundler or Cloudflare build config). Then run the website type-check/build and confirm it still passes exactly as before.
7. Write `docs/MEDIA-PIPELINE.md`: the race-weekend flow step by step (renew F1 TV login, start recorder, after each session decode -> session.json -> 3D or kinetic render -> publish), the commands, the folders, and the data rules (no invented data; every figure from the recording or verified sources; mark provisional results).
8. Add a short "Media pipeline" section to `CLAUDE.md` pointing to `docs/MEDIA-PIPELINE.md` and stating the rules above.
9. Verify everything from the new locations: recorder `--dry-run`, the pipeline on one existing recording, the 3D template with `npm install && npm run dev`, and one kinetic render with `render.py`.
10. Commit on `media-pipeline` with a clear message and show me `git status`. Only after I confirm that everything works, tell me which Desktop folders can be deleted (do not delete them yourself).
