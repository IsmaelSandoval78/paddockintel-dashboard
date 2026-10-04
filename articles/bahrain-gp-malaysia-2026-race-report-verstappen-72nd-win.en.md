---
slug: "bahrain-gp-malaysia-2026-race-report-verstappen-72nd-win"
title: "Verstappen's Win Is the Receipt Saturday Promised"
locale: en
meta_description: "Verstappen's 72nd win ties Schumacher's record and gives Red Bull-Ford its first win -- delayed 100 minutes by rain and a power-unit fault."
status: published
published_at: "2026-10-04T16:00:00+00:00"
paywalled: false
translation_group_id: "a1ed0cba-4e97-4c50-a161-0034ea7f0172"
tags: ["race-analysis", "red-bull", "featured"]

stats:
  - value: "2.307s"
    label: "VERSTAPPEN'S WINNING MARGIN OVER ANTONELLI"
    unit: "pole to flag, no safety-car luck needed at the front"
  - value: "72"
    label: "VERSTAPPEN'S CAREER WINS -- TIES SCHUMACHER'S RECORD"
    unit: "Schumacher's 72 all came at Ferrari; Verstappen's all at Red Bull"
  - value: "~100 min"
    label: "HOW LONG RAIN AND A POWER-UNIT FAULT DELAYED THE START"
    unit: "40 min of rain, then an FIA-distributed fix for a software fault"
  - value: "84 pts"
    label: "ANTONELLI'S CHAMPIONSHIP LEAD OVER RUSSELL AFTER SEPANG"
    unit: "a season-high, with 7 races remaining"

faq:
  - q: "Who won the 2026 Bahrain Grand Prix in Malaysia?"
    a: "Max Verstappen, leading every lap once the race actually started and beating Kimi Antonelli by 2.307 seconds at the flag -- his first win of 2026 and Red Bull-Ford Powertrains' first win in its debut season."
  - q: "Why was the Bahrain Grand Prix in Malaysia delayed?"
    a: "Torrential rain hit Sepang forty minutes before the scheduled start, and when it eased, a power-unit software fault the FIA called \"unprecedented\" struck several cars on the formation lap and forced a further delay -- roughly 100 minutes in total before a fix was distributed and the race got underway."
  - q: "How many Grand Prix has Max Verstappen won in his career?"
    a: "72, as of the 2026 Bahrain Grand Prix in Malaysia -- tying Michael Schumacher's record for the most wins with a single team. Schumacher's 72 all came at Ferrari; Verstappen's have all come with Red Bull Racing."
  - q: "What happened to George Russell in the Bahrain Grand Prix in Malaysia?"
    a: "His Mercedes failed during the race's second Safety Car period, five laps from the end -- Toto Wolff confirmed an engine issue. Combined with Kimi Antonelli's second-place finish, it pushed Russell's championship deficit to a season-high 84 points with seven races left."

charts:
  - type: grid_to_finish
    title: "Qualifying to Finish"
    note: "Qualifying order, not final grid -- Hadjar's 5-place engine-component penalty (P3 on pace to a P8 start) moves everyone from P4 down one grid slot, which doesn't change any of these finishing positions. Lindblad's own penalty was far bigger: a 30-place drop put him dead last on the grid (P22) despite qualifying 16th on pace, so his P10 finish is a last-to-points drive through the whole field, not the modest 16-to-10 gain this chart alone would suggest. Finish positions per the official classification; Russell's retirement came in the second Safety Car period, five laps from the end."
    rows:
      - { code: "VER", team: "redbull", quali: 1, finish: 1, highlight: true }
      - { code: "HAM", team: "ferrari", quali: 2, finish: 3, highlight: true }
      - { code: "HAD", team: "redbull", quali: 3, finish: 5 }
      - { code: "ANT", team: "mercedes", quali: 4, finish: 2, highlight: true }
      - { code: "LEC", team: "ferrari", quali: 5, finish: 4 }
      - { code: "NOR", team: "mclaren", quali: 6, finish: 9 }
      - { code: "PIA", team: "mclaren", quali: 7, finish: 6 }
      - { code: "RUS", team: "mercedes", quali: 8, finish: null, dnf: true, highlight: true }
      - { code: "LAW", team: "rb", quali: 11, finish: 7 }
      - { code: "ALO", team: "aston", quali: 12, finish: 8 }
      - { code: "LIN", team: "rb", quali: 16, finish: 10 }

  - type: lap_pace_heatmap
    title: "Lap Pace, Front of the Field"
    note: "Every lap for the top 5 finishers, colored against each driver's own best lap of the race. Blanked cells are the wet opening laps, pit stops, and the Safety Car period around laps 43-50 -- not real pace data for anyone. Laps 1-2 have no timed data in the source feed (rolling/delayed start)."
    outlierThresholdMs: 108000
    drivers:
      - code: "VER"
        team: "redbull"
        laps: [null,null,114550,109030,109634,110519,111456,111887,123556,null,147418,null,104849,103456,102227,101198,100980,100953,101386,101102,101154,101263,101409,101335,101553,101717,101753,101900,101895,101957,102005,102190,108881,121354,100888,100275,100675,100813,101173,100690,100935,100965,117083,null,135018,null,147148,null,null,145454,null,98423,98529,98614,98220]
      - code: "ANT"
        team: "mercedes"
        laps: [null,null,111458,108702,109756,110741,112884,112623,122695,null,147449,null,106383,104307,102901,101930,101337,101388,101415,101576,101441,101542,101607,103354,102031,101992,101881,102190,102175,102384,102429,102399,109078,121917,100338,100761,100610,100654,100829,101409,101230,101691,117598,136465,null,140144,145311,null,149726,145542,null,98589,98866,98904,98930]
      - code: "HAM"
        team: "ferrari"
        laps: [null,null,141532,133074,124251,121279,116549,112876,140394,143525,113622,128062,110975,104923,104598,102044,102784,102938,102498,102295,102490,101858,102174,102477,101727,102223,102013,102276,102145,102504,108868,120477,100178,100906,101158,101432,101183,101021,101612,101596,101175,101675,129124,null,136606,132150,129173,149879,149109,143882,null,99625,98610,99103,99445]
      - code: "LEC"
        team: "ferrari"
        laps: [null,null,null,139763,110859,110593,111829,111529,143096,null,116505,115259,111392,107355,104926,102023,101896,102138,103147,103477,103400,103885,103016,102907,103167,103316,103964,109954,121443,101804,100906,101264,101040,101328,101165,101456,101399,101549,101455,101902,101875,101765,132814,null,133830,132657,113770,null,148305,143965,null,99610,99396,99336,99808]
      - code: "HAD"
        team: "redbull"
        laps: [null,null,114964,111757,111549,112005,111570,112021,127852,null,145335,null,107028,104340,103392,103020,102518,101867,102045,102128,102406,102271,102452,102434,102768,102895,103014,103096,103302,103901,110437,122721,100627,101297,100369,101494,101237,101480,101683,101186,101700,101557,124013,138310,null,133181,129246,null,149136,144167,null,99792,100526,100920,99819]

sources:
  - name: "RacingNews365 — Max Verstappen and Red Bull-Ford make F1 history: 'Incredible!'"
    url: "https://racingnews365.com/max-verstappen-and-red-bull-ford-make-f1-history-incredible"
  - name: "RacingNews365 — Red Bull hail 'untouchable' Max Verstappen after smashing vital milestone"
    url: "https://racingnews365.com/red-bull-hail-untouchable-max-verstappen-after-smashing-vital-milestone"
  - name: "Sky Sports — Verstappen wins 'absolutely wild' Bahrain GP"
    url: "https://www.skysports.com/f1/news/12433/13594860/bahrain-gp-in-malaysia-max-verstappen-wins-first-race-of-2026-f1-season-in-wild-rain-hit-grand-prix-as-lewis-hamilton-surges-back"
  - name: "Crash.net — Max Verstappen wins bonkers Bahrain GP in Malaysia, George Russell's F1 title hopes up in smoke"
    url: "https://www.crash.net/f1/race-report/1106502/1/max-verstappen-wins-bonkers-bahrain-gp-malaysia-george-russells-f1-title"
  - name: "Autosport — F1 Bahrain GP in Malaysia: Verstappen wins chaotic race from Antonelli as Russell retires late on"
    url: "https://www.autosport.com/f1/news/f1-bahrain-gp-in-malaysia-report/10861849/"
  - name: "f1mania — Verstappen iguala marca de Schumacher com vitória no GP do Bahrein na Malásia"
    url: "https://www.f1mania.net/f1/f1-verstappen-iguala-marca-de-schumacher-com-vitoria-no-gp-do-bahrein-na-malasia/"
---

Max Verstappen won a race that took longer to start than most races take to finish. Torrential rain hit Sepang forty minutes before the scheduled start, and when it eased, a power-unit software fault the FIA called "unprecedented" struck several cars on the formation lap and forced a further delay — roughly 100 minutes in total before a fix went out and the field actually got racing. Martin Brundle, commentating, called it "one of the craziest Formula 1 races I have ever seen. That was absolutely wild."

Verstappen won it clean once it started: pole to flag, 2.307 seconds clear of Kimi Antonelli at the line. It was his first win of 2026, his 72nd career victory — tying Michael Schumacher's record for most wins with a single team, Schumacher's all at Ferrari, Verstappen's all at Red Bull Racing — and Red Bull-Ford Powertrains' first win in its debut season, at the sixteenth attempt. "To win our first race in our first year with our own power unit is pretty impressive," Verstappen said. Team principal Laurent Mekies didn't hedge: "Max has been untouchable."

## Qualifying to Finish

The chart below carries the real shape of the race: eleven drivers whose qualifying position tells you almost nothing about where they actually finished, because almost nobody's race went the way Saturday suggested it would. Hadjar qualified third fastest, his own personal-best weekend since returning from a wrist injury, and finished fifth after a five-place grid penalty for a seventh internal combustion engine did what grid penalties do. Antonelli qualified fourth and finished second — not because of anyone else's misfortune, but because his race pace matched Verstappen's in everything but the opening laps.

Hamilton's line on the chart undersells his afternoon. He qualified second, on the front row next to Verstappen, and Ferrari sent him out on slick tyres for a still-wet, drying track. The gamble backfired immediately — he fell to 18th before the race had properly started — and he spent the rest of the afternoon driving back through the field to finish third, 4.919 seconds off the win. A quali-to-finish chart reads that as "P2 to P3." It was not a P2-to-P3 kind of race for him.

George Russell's line ends early. His Mercedes failed in the second Safety Car period, five laps from the end, in what Crash.net described as echoing Hamilton's own engine failure at the same corner a decade ago. Toto Wolff confirmed an engine issue; Russell's own reaction was "You've got to laugh." Paired with Antonelli's second place, it pushed his championship deficit to a season-high 84 points with seven races left.

The chart's quietest line hides its biggest story. Arvid Lindblad qualified 16th, then took a 30-place grid penalty that put him dead last — P22, behind all 21 other cars. He finished tenth and scored a point. That's not a recovery from 16th; it's a drive through the entire field from the very back of it, and the quali-to-finish format above can't show that without saying so directly.

## Lap Pace, Front of the Field

The heatmap below is every lap for the top five finishers, colored against each driver's own best lap — lighter is closer to their fastest, darker is further off it. The wet opening laps, the pit stops, and the Safety Car period in the mid-40s are blanked out rather than colored, since none of those are real pace data for anyone.

What's left is two genuine green-flag stints: roughly laps 13 to 42, and the sprint to the flag from lap 52 on. Verstappen's row is the one worth reading closest — not meaningfully faster than Antonelli or Hamilton on any single lap, but the most consistently near his own best across both stints, which is exactly the kind of race a 2.307-second, lights-to-flag win is actually built from. Hadjar's row tells the quieter version of his story: matching the same tight pace band as the four drivers in this chart who finished ahead of him, with nothing on the stopwatch explaining the gap to any of them except the penalty that was already decided before he turned a wheel.

## Verdict

[Saturday's pole](/verstappen-sepang-pole-red-bull-ford-engine-2026) was the clean version of this argument: dry track, one lap, nothing to react to. Sunday was the version with everything thrown at it — a start delayed by rain and a power-unit software fault bad enough to need an FIA fix mid-grid, two Safety Car periods, a tyre gamble that cost the driver who'd lined up second on the grid eighteen places in the opening laps, and a title contender's engine failing outright five laps from the end. None of that happened to Red Bull-Ford. Verstappen never needed a strategy gamble, because Saturday's pace simply held, lap after lap, through exactly the kind of conditions built to expose a weakness in a power unit sixteen races into its own existence.

A clean pole is one data point. A win that survives a race actively trying to break everything around it is harder to write off as a one-off. The FIA's own measurements said months ago that Red Bull-Ford had built the best engine on the 2026 grid. Sepang is the first time the result and the data agree on a day when nothing else went right.
