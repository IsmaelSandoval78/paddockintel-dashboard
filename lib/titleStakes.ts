// Can the championship leader clinch the drivers' title at the next Grand Prix? Pure arithmetic on
// the current standings and the points left on the calendar; every outcome of the race is
// enumerated, so no rule of thumb can drift from the real points table.
//
// A rival is beaten for good when, after this race, the leader is more than `pointsAfter` ahead,
// or exactly that far ahead and the leader would win the countback. Reaching a tie means the rival
// wins every remaining Grand Prix, so the countback compares the leader's wins with the rival's
// wins plus every race left. Equal wins would go to second places, which aren't modelled here, so
// that case counts as not clinched (the stated margins are then never too small).

// Grand Prix points, P1..P10 (no fastest-lap point since 2025).
export const GP_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
export const SPRINT_WIN_POINTS = 8;

export type StandingRow = { driverId: number; surname: string; points: number; wins: number };

export type TitleStakes = {
  leader: string;
  pointsAfter: number;
  rivals: Array<{
    surname: string;
    gap: number;
    // Smallest points swing (leader minus rival, in this race) that clinches against this rival;
    // negative means the leader can afford to be outscored by that much.
    need: number;
    // If the leader wins the race: the rival must finish this position or lower (11 = out of the
    // points). Null when any result for this rival is enough.
    worstIfWin: number | null;
  }>;
};

type Outcome = { points: number; won: boolean };
// P1..P10 and "no points" (P11 or lower, or not classified).
const OUTCOMES: Outcome[] = [...GP_POINTS.map((points, i) => ({ points, won: i === 0 })), { points: 0, won: false }];

// After this race, given the leader's result `l` and this rival's `r`: is the rival beaten for good?
function beaten(leader: StandingRow, rival: StandingRow, l: Outcome, r: Outcome, pointsAfter: number, racesAfter: number) {
  const after = leader.points - rival.points + l.points - r.points;
  const leaderWins = leader.wins + (l.won ? 1 : 0);
  const rivalWins = rival.wins + (r.won ? 1 : 0) + racesAfter;
  return after > pointsAfter || (after === pointsAfter && leaderWins > rivalWins);
}

// Fewest points the leader must score at this race to be champion whatever every rival does,
// or null when not even a win is enough. Same rule and caveats as titleStakes below.
export function clinchPoints(standings: StandingRow[], pointsAfter: number, racesAfter: number): number | null {
  const [leader, ...others] = [...standings].sort((a, b) => b.points - a.points || b.wins - a.wins);
  if (!leader) return null;
  const byPoints = [...OUTCOMES].sort((a, b) => a.points - b.points);
  const enough = byPoints.find((l) =>
    others.every((rival) =>
      OUTCOMES.filter((r) => r.points === 0 || r.points !== l.points).every((r) => beaten(leader, rival, l, r, pointsAfter, racesAfter)),
    ),
  );
  return enough ? enough.points : null;
}

export function titleStakes(standings: StandingRow[], pointsAfter: number, racesAfter: number): TitleStakes | null {
  const sorted = [...standings].sort((a, b) => b.points - a.points || b.wins - a.wins);
  const [leader, ...others] = sorted;
  if (!leader) return null;

  const rivals: TitleStakes['rivals'] = [];
  for (const rival of others) {
    const gap = leader.points - rival.points;
    const clinched = (l: Outcome, r: Outcome) => beaten(leader, rival, l, r, pointsAfter, racesAfter);
    const combos = OUTCOMES.flatMap((l) =>
      OUTCOMES.filter((r) => r.points === 0 || r.points !== l.points).map((r) => ({ swing: l.points - r.points, ok: clinched(l, r) })),
    );
    // Already beaten whatever happens: not part of the story.
    if (combos.every((c) => c.ok)) continue;

    const swings = [...new Set(combos.map((c) => c.swing))].sort((a, b) => b - a);
    let need: number | null = null;
    for (const s of swings) {
      if (!combos.filter((c) => c.swing === s).every((c) => c.ok)) break;
      need = s;
    }
    // Not even a win with the rival scoreless is enough: no title this weekend.
    if (need === null) return null;

    const win = OUTCOMES[0];
    let worstIfWin: number | null = null;
    for (let pos = 2; pos <= 11; pos++) {
      const rest = OUTCOMES.slice(pos - 1);
      if (rest.every((r) => clinched(win, r))) {
        worstIfWin = pos === 2 ? null : pos;
        break;
      }
    }
    rivals.push({ surname: rival.surname, gap, need, worstIfWin });
  }

  return rivals.length ? { leader: leader.surname, pointsAfter, rivals } : null;
}
