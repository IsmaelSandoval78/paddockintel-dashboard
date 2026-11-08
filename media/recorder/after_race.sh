#!/bin/bash
# After the race ends, keep retrying the export until FastF1 has the full session,
# then copy the zip + the raw recording to iCloud Drive. Edit TARGET for each race.
cd "$(dirname "$0")"
PI_DATA="${PI_DATA_DIR:-$HOME/PaddockIntel-Data}"
DEST="$HOME/Library/Mobile Documents/com~apple~CloudDocs/PaddockIntel"; mkdir -p "$DEST"
# wait until 6:00 p.m. Kentucky time on race day (the race starts at 4:00 p.m.)
TARGET=$(date -j -f "%Y-%m-%d %H:%M" "2026-10-25 18:00" +%s)
while [ "$(date +%s)" -lt "$TARGET" ]; do sleep 300; done
for i in $(seq 1 24); do
  echo "$(date) attempt $i"
  if python3.13 export_session.py 2026 "United States" R > /tmp/export_R.log 2>&1; then
    D=$(dirname "$(find "$PI_DATA/sessions" -name laps.csv -mmin -30 | head -1)")
    if [ -n "$D" ] && [ "$(wc -l < "$D/laps.csv")" -gt 100 ]; then
      (cd "$D" && zip -qr "$DEST/2026-austin-R.zip" .)
      LAST=$(ls -t "$PI_DATA/recordings" | head -1); [ -n "$LAST" ] && cp -R "$PI_DATA/recordings/$LAST" "$DEST/"
      echo "Done: $DEST"; exit 0
    fi
  fi
  sleep 900
done
echo "Gave up after 6 hours; see /tmp/export_R.log"
