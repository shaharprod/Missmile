import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TitleScene } from "./scenes/TitleScene";
import { TehranFocus } from "./scenes/TehranFocus";
import { LaunchScene } from "./scenes/LaunchScene";
import { MissileTravel } from "./scenes/MissileTravel";
import { RadarScene } from "./scenes/RadarScene";
import { InterceptionScene } from "./scenes/InterceptionScene";
import { EndCard } from "./scenes/EndCard";
import {
  SCENE_TITLE,
  SCENE_TEHRAN,
  SCENE_LAUNCH,
  SCENE_TRAVEL,
  SCENE_RADAR,
  SCENE_INTERCEPT,
  SCENE_ENDCARD,
  TRANSITION_FRAMES,
  FPS,
  TOTAL_FRAMES,
} from "./lib/constants";

// Scene start frames (accounting for transitions)
const TEHRAN_START = SCENE_TITLE - TRANSITION_FRAMES;
const LAUNCH_START = TEHRAN_START + SCENE_TEHRAN - TRANSITION_FRAMES;
const TRAVEL_START = LAUNCH_START + SCENE_LAUNCH - TRANSITION_FRAMES;
const RADAR_START = TRAVEL_START + SCENE_TRAVEL - TRANSITION_FRAMES;
const INTERCEPT_START = RADAR_START + SCENE_RADAR - TRANSITION_FRAMES;

export const MissileVideoComposition = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      {/* ── Visual scenes ── */}
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENE_TITLE}>
          <TitleScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        <TransitionSeries.Sequence durationInFrames={SCENE_TEHRAN}>
          <TehranFocus />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        <TransitionSeries.Sequence durationInFrames={SCENE_LAUNCH}>
          <LaunchScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        <TransitionSeries.Sequence durationInFrames={SCENE_TRAVEL}>
          <MissileTravel />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        <TransitionSeries.Sequence durationInFrames={SCENE_RADAR}>
          <RadarScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        <TransitionSeries.Sequence durationInFrames={SCENE_INTERCEPT}>
          <InterceptionScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        <TransitionSeries.Sequence durationInFrames={SCENE_ENDCARD}>
          <EndCard />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* ── Audio layers ── */}

      {/* Horror drone - plays throughout, fades in at start, fades out at end */}
      <Audio
        src={staticFile("drone.wav")}
        volume={(f) => {
          const fadeIn = interpolate(f, [0, 2 * fps], [0, 1], {
            extrapolateRight: "clamp",
          });
          const fadeOut = interpolate(
            f,
            [TOTAL_FRAMES - 3 * fps, TOTAL_FRAMES],
            [1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );
          return fadeIn * fadeOut * 0.5;
        }}
        loop
      />

      {/* Alert siren - Tehran scene */}
      <Sequence from={TEHRAN_START + Math.round(2.5 * fps)} durationInFrames={SCENE_TEHRAN}>
        <Audio
          src={staticFile("siren.wav")}
          volume={(f) => {
            const fadeIn = interpolate(f, [0, fps], [0, 1], {
              extrapolateRight: "clamp",
            });
            const fadeOut = interpolate(
              f,
              [SCENE_TEHRAN - 2 * fps, SCENE_TEHRAN],
              [1, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            );
            return fadeIn * fadeOut * 0.3;
          }}
          loop
        />
      </Sequence>

      {/* Missile launch sound - starts at ignition (frame 75 in scene) */}
      <Sequence from={LAUNCH_START + 60} durationInFrames={SCENE_LAUNCH - 60}>
        <Audio
          src={staticFile("launch.wav")}
          volume={(f) =>
            interpolate(f, [0, 0.3 * fps, SCENE_LAUNCH], [0.1, 0.8, 0.4], {
              extrapolateRight: "clamp",
            })
          }
        />
      </Sequence>

      {/* Missile travel whoosh */}
      <Sequence from={TRAVEL_START} durationInFrames={SCENE_TRAVEL}>
        <Audio
          src={staticFile("whoosh.wav")}
          volume={(f) => {
            const fadeIn = interpolate(f, [0, fps], [0, 1], {
              extrapolateRight: "clamp",
            });
            const fadeOut = interpolate(
              f,
              [SCENE_TRAVEL - fps, SCENE_TRAVEL],
              [1, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            );
            return fadeIn * fadeOut * 0.4;
          }}
        />
      </Sequence>

      {/* Interceptor launch sounds - staggered (launch at frame 0 of scene) */}
      <Sequence from={INTERCEPT_START} durationInFrames={72}>
        <Audio src={staticFile("interceptor.wav")} volume={0.5} />
      </Sequence>
      <Sequence from={INTERCEPT_START + 10} durationInFrames={72}>
        <Audio src={staticFile("interceptor.wav")} volume={0.4} />
      </Sequence>
      <Sequence from={INTERCEPT_START + 18} durationInFrames={72}>
        <Audio src={staticFile("interceptor.wav")} volume={0.45} />
      </Sequence>

      {/* Explosion on impact */}
      <Sequence from={INTERCEPT_START + 128} durationInFrames={4 * fps}>
        <Audio src={staticFile("explosion.wav")} volume={0.85} />
      </Sequence>

      {/* Debris falling sounds */}
      <Sequence from={INTERCEPT_START + 152} durationInFrames={6 * fps}>
        <Audio
          src={staticFile("debris.wav")}
          volume={(f) => {
            const fadeOut = interpolate(
              f,
              [4 * fps, 6 * fps],
              [0.5, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            );
            return fadeOut;
          }}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
