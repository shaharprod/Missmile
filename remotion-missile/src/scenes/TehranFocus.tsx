import { AbsoluteFill, interpolate, Easing, useCurrentFrame, useVideoConfig } from "remotion";
import { MilitaryMap } from "../components/MilitaryMap";
import { C, TEHRAN, TEL_AVIV, BG_CITIES, FPS } from "../lib/constants";

export const TehranFocus = () => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  // Fade in
  const fadeIn = interpolate(frame, [0, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Phase 1: Wide view (frames 30-90), Phase 2: Zoom into Tehran (frames 90-end)
  const scale = interpolate(
    frame,
    [24, 72, durationInFrames - 1],
    [0.85, 0.8, 2.2],
    {
      easing: Easing.inOut(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  // Pan toward Tehran - accelerates in zoom phase
  const tehranOffsetX = interpolate(
    frame,
    [24, 72, durationInFrames - 1],
    [0, -60, -480],
    {
      easing: Easing.inOut(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const tehranOffsetY = interpolate(
    frame,
    [24, 72, durationInFrames - 1],
    [0, 20, 200],
    {
      easing: Easing.inOut(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  // "THREAT DETECTED" flash
  const threatShow = frame > 64;
  const threatBlink = Math.floor(frame / 8) % 2 === 0;

  // Mission time
  const seconds = frame / FPS;
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(Math.floor(seconds % 60)).padStart(2, "0");
  const ms = String(Math.floor((seconds % 1) * 100)).padStart(2, "0");

  // HUD text
  const hudLines: string[] = [
    "DEFENSE COMMAND // TACTICAL DISPLAY",
    `LAT: ${TEHRAN.lat.toFixed(3)}°N  LNG: ${TEHRAN.lng.toFixed(3)}°E`,
  ];
  if (frame > 48) {
    hudLines.push(`ZOOM: ${scale.toFixed(1)}x`);
  }

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <MilitaryMap
        width={width}
        height={height}
        scale={scale}
        offsetX={tehranOffsetX}
        offsetY={tehranOffsetY}
        opacity={fadeIn}
        cities={[
          { ...TEHRAN, color: C.hudRed, role: "capital" },
          { ...TEL_AVIV, color: C.hudGreen, role: "capital" },
          ...BG_CITIES,
        ]}
        hudText={hudLines}
        missionTime={`${mm}:${ss}.${ms}`}
      />

      {/* THREAT DETECTED overlay */}
      {threatShow && threatBlink && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontFamily: "monospace",
            fontSize: 83,
            fontWeight: "bold",
            color: C.hudRed,
            textShadow: `2px 2px 6px rgba(0,0,0,0.4)`,
            letterSpacing: 8,
          }}
        >
          ⚠ THREAT DETECTED
        </div>
      )}

      {/* Scan line effect */}
      {frame > 8 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: `${((frame * 3) % height / height) * 100}%`,
            height: 2,
            backgroundColor: C.hudGreen,
            opacity: 0.04,
          }}
        />
      )}
    </AbsoluteFill>
  );
};
