#!/usr/bin/env python3
"""
Team radio watcher: lists the radio clips F1 published for a session (OpenF1's team_radio
endpoint, which links to the MP3s on livetiming.formula1.com), with driver and lap, and
transcribes the new ones with Whisper. Run it after each session so a radio quote can be checked
against our timing data before anyone else has transcribed it.

Read-only: it never writes to Supabase. The state file only remembers which clips were already
reported. The audio belongs to F1: quote short excerpts of the transcript with attribution, never
republish or host the MP3s (LEGAL-COMPLIANCE-EXPERT.md).

Usage:
  python3 scripts/team-radio.py                     # latest session, every clip
  python3 scripts/team-radio.py --session 11420     # a given OpenF1 session_key
  python3 scripts/team-radio.py --state radio-seen.json --audio-dir /tmp/radio
  python3 scripts/team-radio.py --no-transcribe     # list the clips only

Transcription needs faster-whisper, which is not a project dependency: install it in the
container only (python3 -m pip install faster-whisper); the first run downloads the model. Without
it the clips are listed untranscribed.

Caveats:
  - The clips are only the ones F1 chose to publish, not every message.
  - The lap is the driver's lap when the clip was timestamped, which can lag the message itself.
  - A quiet clip can make Whisper invent text ("Thanks for watching!"). Those are flagged
    [CHECK BY EAR] and must be listened to before quoting; so must every quote, really.
"""

import argparse
import json
import os
import sys
import urllib.request
from datetime import datetime

API = "https://api.openf1.org/v1"
# Phrases Whisper produces from silence or noise, not from speech.
HALLUCINATIONS = ("thanks for watching", "thank you for watching", "subscribe")


def get(endpoint, **params):
    query = "&".join(f"{k}={v}" for k, v in params.items())
    req = urllib.request.Request(f"{API}/{endpoint}?{query}", headers={"User-Agent": "PaddockIntel research"})
    with urllib.request.urlopen(req, timeout=60) as res:
        return json.load(res)


def lap_at(laps, when):
    lap = 0
    for l in laps:
        if l["date_start"] and datetime.fromisoformat(l["date_start"]) <= when:
            lap = max(lap, l["lap_number"])
    return lap


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--session", default="latest", help="OpenF1 session_key (default: latest)")
    ap.add_argument("--state", help="JSON file of clip URLs already reported; only new clips are shown")
    ap.add_argument("--audio-dir", default="/tmp/team-radio", help="where the MP3s are downloaded")
    ap.add_argument("--model", default="medium.en", help="Whisper model (default: medium.en)")
    ap.add_argument("--no-transcribe", action="store_true")
    args = ap.parse_args()

    session = get("sessions", session_key=args.session)
    if not session:
        sys.exit(f"No OpenF1 session {args.session}")
    s = session[-1]
    key = s["session_key"]
    print(f"{s['year']} {s['circuit_short_name']} {s['session_name']} (session_key {key})")

    clips = sorted(get("team_radio", session_key=key), key=lambda c: c["date"])
    seen = set()
    if args.state and os.path.exists(args.state):
        with open(args.state) as f:
            seen = set(json.load(f))
    fresh = [c for c in clips if c["recording_url"] not in seen]
    print(f"{len(clips)} clips published, {len(fresh)} new")
    if not fresh:
        return

    drivers = {d["driver_number"]: d["name_acronym"] for d in get("drivers", session_key=key)}
    laps = {}
    for l in get("laps", session_key=key):
        laps.setdefault(l["driver_number"], []).append(l)

    model = None
    if not args.no_transcribe:
        try:
            from faster_whisper import WhisperModel
            model = WhisperModel(args.model, device="cpu", compute_type="int8")
        except ImportError:
            print("faster-whisper not installed: listing clips without transcripts", file=sys.stderr)
    os.makedirs(args.audio_dir, exist_ok=True)

    for c in fresh:
        when = datetime.fromisoformat(c["date"])
        num = c["driver_number"]
        lap = lap_at(laps.get(num, []), when)
        print(f"\n{drivers.get(num, num)} #{num}  lap {lap or '-'}  {when:%H:%M:%S} UTC\n  {c['recording_url']}")
        if not model:
            continue
        path = os.path.join(args.audio_dir, os.path.basename(c["recording_url"]))
        if not os.path.exists(path):
            urllib.request.urlretrieve(c["recording_url"], path)
        segments, _ = model.transcribe(path, beam_size=5)
        segments = list(segments)
        text = " ".join(seg.text.strip() for seg in segments).strip()
        doubtful = (
            not text
            or any(h in text.lower() for h in HALLUCINATIONS)
            or all(seg.no_speech_prob > 0.6 or seg.avg_logprob < -1.0 for seg in segments)
        )
        print(f"  {'[CHECK BY EAR] ' if doubtful else ''}{text or '(no speech recognised)'}")

    if args.state:
        with open(args.state, "w") as f:
            json.dump(sorted(seen | {c["recording_url"] for c in clips}), f)


if __name__ == "__main__":
    main()
