import GridToFinishChart, { type GridToFinishChartSpec } from '@/components/blog/charts/GridToFinishChart';
import LapPaceHeatmap, { type LapPaceHeatmapSpec } from '@/components/blog/charts/LapPaceHeatmap';

// Dispatches on `type` so a new chart form is one more case here and one
// more component under charts/, never a change to the article page
// template itself. See the `charts` column migration
// (supabase/migrations/20260926150000_articles_charts_column.sql) for the
// data-shape rationale — this exists so a Race Report can carry a real
// chart without embedding markup or JS in body_markdown.
export type ChartSpec = GridToFinishChartSpec | LapPaceHeatmapSpec;

export default function ArticleCharts({ charts }: { charts: ChartSpec[] }) {
  if (!charts || charts.length === 0) return null;

  return (
    <>
      {charts.map((chart, i) => {
        switch (chart.type) {
          case 'grid_to_finish':
            return <GridToFinishChart key={i} spec={chart} />;
          case 'lap_pace_heatmap':
            return <LapPaceHeatmap key={i} spec={chart} />;
          default:
            return null;
        }
      })}
    </>
  );
}
