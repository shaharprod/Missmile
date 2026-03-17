import { Composition } from "remotion";
import { MissileVideoComposition } from "./MissileVideoComposition";
import { WIDTH, HEIGHT, FPS, TOTAL_FRAMES } from "./lib/constants";

export const RemotionRoot = () => {
  return (
    <Composition
      id="MissileDefense"
      component={MissileVideoComposition}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};
