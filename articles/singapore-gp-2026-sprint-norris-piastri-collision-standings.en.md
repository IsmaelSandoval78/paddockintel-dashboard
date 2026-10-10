---
slug: "singapore-gp-2026-sprint-norris-piastri-collision-standings"
title: "Norris and Piastri's Crash Cost McLaren More Than a Result"
locale: en
meta_description: "Norris hit his own teammate on the final lap of Singapore's Sprint. It also broke a tied points battle with Verstappen nobody's tracked yet."
status: published
paywalled: false
published_at: "2026-10-10T13:00:00+00:00"
translation_group_id: "da842c17-d7ba-4972-9899-67897c35f9b7"
tags: ["featured", "race-analysis", "mclaren", "red-bull"]

stats:
  - value: "196-189"
    label: "VERSTAPPEN VS. NORRIS AFTER THE SPRINT"
    unit: "tied 188-188 entering the weekend"
  - value: "+7 pts"
    label: "THE SWING TODAY'S COLLISION HANDED RED BULL"
    unit: "vs. McLaren in the constructors' championship"
  - value: "P4 to the wall"
    label: "PIASTRI'S FINAL LAP"
    unit: "classified 14th, one lap down, after hitting the wall at Turn 5"
  - value: "Lap 20 of 20"
    label: "WHEN THE McLARENS COLLIDED"
    unit: "the Sprint's last lap, fighting for 4th"

faq:
  - q: "What happened between Lando Norris and Oscar Piastri in the Singapore Sprint?"
    a: "On the final lap, running fourth (Piastri) and fifth (Norris) and stuck behind Charles Leclerc, Norris dove inside Piastri at Turn 5 and pulled alongside, then backed out through the corner. His left-front tyre hit Piastri's right-rear. Both spun; Piastri hit the wall and retired, while Norris resumed and finished eighth."
  - q: "Did the collision change the drivers' championship standings?"
    a: "Yes, indirectly. Norris and Max Verstappen entered the weekend tied at 188 points for fifth place. Verstappen's Sprint win and Norris's reduced haul from finishing eighth instead of fourth or fifth put Verstappen 7 points ahead afterward."
  - q: "Will Lando Norris be penalized for the collision?"
    a: "The stewards opened an investigation into Norris for causing a collision. No decision had been announced as of publication. Norris has said he believes he had the right to attempt the move; Piastri said he hadn't seen Norris at the apex and that \"the team can do what it needs to do.\""
  - q: "Does this set the grid for Sunday's Singapore Grand Prix?"
    a: "No. The Sprint and its qualifying only decide Saturday's Sprint grid and result. A separate qualifying session, run later the same weekend, sets the grid for Sunday's Grand Prix."

sources:
  - name: "Formula1.com — Verstappen wins dramatic, rain-hit Singapore Sprint as Russell crashes and McLarens collide"
    url: "https://www.formula1.com/en/latest/article/verstappen-wins-dramatic-rain-hit-singapore-sprint-as-russell-crashes-and-mclarens-collide.4r90mH2skljBa5sinFAsyp"
  - name: "Formula1.com — Norris and Piastri offer verdicts on McLaren intra-team collision"
    url: "https://www.formula1.com/en/latest/article/norris-and-piastri-offer-verdicts-on-mclaren-intra-team-collision-in-singapore-gp-sprint.1aNdfxcp4bRsnOwUXTg7rd"
  - name: "The Race — F1 2026 Singapore Grand Prix sprint race result"
    url: "https://www.the-race.com/formula-1/f1-2026-singapore-grand-prix-sprint-race-result/"
  - name: "RacingNews365 — McLaren last-lap horror as Lando Norris takes out Oscar Piastri"
    url: "https://racingnews365.com/mclaren-last-lap-horror-as-lando-norris-takes-out-oscar-piastri"
  - name: "PaddockIntel — live-timing feed analysis, Singapore GP Sprint 2026 (own analysis)"
    url: "https://hub.paddockintel.com/drivers/"

charts:
  - type: "grid_to_finish"
    title: "Singapore Sprint — Grid to Finish"
    note: "Sprint Qualifying grid to Sprint finish, full field. Norris's and Piastri's lines both fall on the final lap -- Piastri's falls hardest, into retirement. Russell's ends in the DNF column after he crashed out of the lead on lap one."
    rows:
      - { code: "VER", team: "redbull", quali: 1, finish: 1 }
      - { code: "RUS", team: "mercedes", quali: 2, finish: null, dnf: true, highlight: true }
      - { code: "LEC", team: "ferrari", quali: 3, finish: 3 }
      - { code: "PIA", team: "mclaren", quali: 4, finish: 14, highlight: true }
      - { code: "NOR", team: "mclaren", quali: 5, finish: 8, highlight: true }
      - { code: "HAM", team: "ferrari", quali: 6, finish: 2 }
      - { code: "ANT", team: "mercedes", quali: 7, finish: 4 }
      - { code: "LAW", team: "rb", quali: 8, finish: 5 }
      - { code: "HAD", team: "redbull", quali: 9, finish: null, dnf: true }
      - { code: "GAS", team: "alpine", quali: 10, finish: 9 }
      - { code: "COL", team: "alpine", quali: 11, finish: null, dnf: true }
      - { code: "HUL", team: "audi", quali: 12, finish: 7 }
      - { code: "BEA", team: "haas", quali: 13, finish: 6 }
      - { code: "BOR", team: "audi", quali: 14, finish: null, dnf: true }
      - { code: "ALO", team: "aston", quali: 15, finish: 11 }
      - { code: "OCO", team: "haas", quali: 16, finish: 10 }
      - { code: "LIN", team: "rb", quali: 17, finish: 13 }
      - { code: "STR", team: "aston", quali: 18, finish: null, dnf: true }
      - { code: "ALB", team: "williams", quali: 19, finish: null, dnf: true }
      - { code: "PER", team: "cadillac", quali: 20, finish: null, dnf: true }
      - { code: "BOT", team: "cadillac", quali: 21, finish: null, dnf: true }
      - { code: "SAI", team: "williams", quali: 22, finish: 12 }
  - type: "lap_pace_heatmap"
    title: "Verstappen, Norris, Piastri — Lap by Lap"
    note: "Every completed lap for the Sprint's pole-sitter and the two McLarens. The dashed block after the start is the Safety Car period following Russell's lap-one crash. The single dashed lap at the far end of Norris's row is the collision itself, nearly double his normal pace -- and Piastri's row simply stops. He never completed lap 20."
    outlierThresholdMs: 115000
    drivers:
      - code: "VER"
        team: "redbull"
        laps: [null, 141429, 163035, 164033, 160924, 155705, 106112, 106682, 106873, 106649, 106657, 106688, 106722, 106409, 106408, 106739, 106487, 106341, 106017, 106345]
      - code: "NOR"
        team: "mclaren"
        laps: [null, 148191, 159484, 164084, 157830, 153416, 108330, 107302, 107764, 107381, 107408, 107830, 107731, 107346, 106892, 106902, 106911, 107575, 107682, 120229]
      - code: "PIA"
        team: "mclaren"
        laps: [null, 145480, 161807, 162879, 159465, 153723, 107769, 107155, 107784, 107645, 107636, 107504, 107432, 107088, 107185, 107166, 107094, 107842, 107698, null]
---

## What Happened

Max Verstappen won a rain-delayed, Safety Car-interrupted Singapore Sprint — the first Sprint race ever run at Marina Bay — but the result that will follow this weekend around isn't the win. It's what happened behind him, twice.

George Russell passed Verstappen into Turn 1 at the start and led the opening lap in the Mercedes specification that had out-qualified teammate Kimi Antonelli's upgraded car the day before. He never completed a second one. Exiting the final corner, he lost control, slid across the track, and hit the wall. "I'm fine. Sorry, sorry, sorry," he said over the radio. The Safety Car that followed ran until the end of lap six.

The bigger story came on the last of the Sprint's twenty laps. Lando Norris and Oscar Piastri — fourth and fifth, both stuck behind Charles Leclerc's Ferrari — went for the same piece of track at Turn 5. Norris dove inside his teammate, pulled alongside, then backed out through the corner as the gap closed. His left-front tyre caught Piastri's right-rear. Both cars spun. Piastri's hit the wall and stayed there; Norris's didn't, and he rejoined to take the chequered flag eighth. Piastri was classified 14th, one lap down, in a race he'd been running fourth for nineteen laps.

Max Verstappen's own stewards' investigation from Friday — for passing Lewis Hamilton under yellow flags in SQ1 — was cleared without penalty, which is why he started this Sprint from the pole he'd taken fair and square. Hamilton's yellow-flag note from this race was cleared the same way. The Norris-Piastri contact is a different matter: stewards opened a "causing a collision" investigation after the race, and no decision had been announced as of publication.

## Why It Happened

Both drivers gave their own account afterward, and neither assigns blame outright. "It was a big gap, I went for it, I have the right to do that," Norris said, adding that he'd tried to avoid the contact once the gap closed more than he expected. Piastri's version: "I need to look at it. I didn't see him at the apex. I looked behind into the corner and saw he was a reasonable way behind for a corner like that." His conclusion was procedural, not accusatory: "the team can do what it needs to do."

That's a real disagreement about what "fully alongside" means with two seconds left in a Sprint and nothing but pride and a handful of points on the table — the normal, boring kind of racing incident that happens between strangers every week without becoming a story. It becomes one here only because of who was in the other car.

The lap-by-lap pace makes the moment itself unambiguous, even without a ruling. Every car on this list ran within a second of the others for thirteen straight green-flag laps. Then Norris's final lap very nearly doubles, and Piastri's row simply ends — he never crossed the line to complete it. Both charts below lay it out in full: the grid-to-finish sweep for every car in the field, and the lap-by-lap pace trace for the pole-sitter and the two McLarens.

## Economic Impact

Here's the detail that's gone unremarked in the race reports: Norris and Max Verstappen arrived in Singapore dead level, 188 points apiece, fifth in the drivers' championship down to the last digit. Verstappen's Sprint win is worth 8 points under the Sprint's scoring scale. Norris, running fourth when the collision happened, would have scored somewhere between 4 and 5 points for fourth or fifth; instead, eighth paid 1. The net effect: Verstappen leaves Singapore's Saturday at 196, Norris at 189. A tie becomes a 7-point gap, and the mechanism that produced it wasn't a faster Red Bull — it was contact with his own teammate.

The constructors' side carries the same arithmetic with real money attached to it. McLaren arrived third in that championship, 314 points, 19 clear of fourth-placed Red Bull's 295. A clean Sprint for both McLarens — Piastri fourth, Norris fifth — was worth roughly 9 combined points against Verstappen's 8 for Red Bull, holding that 19-point gap steady. Instead McLaren banked 1 combined point to Red Bull's 8, and the gap between the two teams for a top-three constructors' finish — which determines a real share of Formula 1's prize fund at the end of the season — tightened by 7 points in a single session, for reasons that had nothing to do with either team's car.

## The Framework

Compare this to the other spec story running through the Mercedes garage this same weekend. Russell and Antonelli are driving genuinely different aerodynamic packages on purpose, to settle a real engineering question — different equipment, a deliberate experiment, no contact between them. Norris and Piastri were driving identical cars, fighting each other for the same piece of track, with nothing experimental about it at all. One of F1's oldest tensions — how hard a team lets its own drivers race each other — doesn't need a title fight to produce a costly afternoon. It just needs a closing gap, a last lap, and a teammate in it.

McLaren's own review, which Norris himself pointed to ("the rest we go review as a team"), is the part of this story that hasn't happened yet. How a team handles an intra-team contact that measurably cost it points — whether that's a quiet word, a public statement, or a change to how closely its drivers are allowed to race each other for position — tends to say more about a team's internal culture than the move itself ever could.

## Verdict

Nothing here is settled. The stewards haven't ruled on Norris, so there's no penalty to weigh against what already happened in the standings — win or lose that review, Piastri's result and the points both cars missed are final. What is settled is the table: a tied battle for fifth in the drivers' championship became a 7-point gap, and a comfortable gap between McLaren and Red Bull in the constructors' championship got measurably less comfortable, both by a car running into its own teammate rather than anything a rival team did on track. Sunday's Grand Prix, set by a different qualifying session, is the next chance for either side of that ledger to move back the other way.
