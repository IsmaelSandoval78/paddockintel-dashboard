'use client';

import { BattleChart } from '@/components/ui/BattleChart';

export interface SeasonBattleChartRound {
  round: number;
  raceName: string;
  championPoints: number;
  runnerUpPoints: number;
}

export function SeasonBattleChart({
  rounds,
  championName,
  runnerUpName,
}: {
  rounds: SeasonBattleChartRound[];
  championName: string;
  runnerUpName: string;
}) {
  if (rounds.length === 0) return null;

  return (
    <BattleChart
      variant="compact"
      motionOk={false}
      ariaLabel={`Points battle: ${championName} vs ${runnerUpName}`}
      rounds={rounds.map((r) => ({ round: r.round, raceName: r.raceName }))}
      series={[
        {
          id: 'champion',
          label: championName,
          points: rounds.map((r) => r.championPoints),
          color: 'var(--red)',
          emphasize: true,
        },
        {
          id: 'runner-up',
          label: runnerUpName,
          points: rounds.map((r) => r.runnerUpPoints),
          color: 'var(--text-2)',
        },
      ]}
    />
  );
}
