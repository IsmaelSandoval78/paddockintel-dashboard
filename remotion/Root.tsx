import { Composition } from "remotion";
import { LapComparison, LAP_COMPARISON_FPS, LAP_COMPARISON_DURATION_IN_FRAMES, type LapComparisonData } from "./LapComparison";
import belgiumAntVsLec from "./data/belgium-2026-ant-vs-lec.json";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="LapComparison-Belgium2026-ANT-vs-LEC"
        component={LapComparison}
        durationInFrames={LAP_COMPARISON_DURATION_IN_FRAMES}
        fps={LAP_COMPARISON_FPS}
        width={1080}
        height={1920}
        defaultProps={{ data: belgiumAntVsLec satisfies LapComparisonData }}
      />
    </>
  );
};
