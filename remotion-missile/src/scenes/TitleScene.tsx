import {
  AbsoluteFill,
  interpolate,
  Easing,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C } from "../lib/constants";

export const TitleScene = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Scanline position
  const scanY = (frame * 4) % 1080;

  // Fade in from black
  const fadeIn = interpolate(frame, [0, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Title text reveal (typewriter-like stagger)
  const titleReveal = interpolate(frame, [12, 36], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subtitle reveal
  const subtitleReveal = interpolate(frame, [32, 48], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Date reveal
  const dateReveal = interpolate(frame, [44, 56], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Classification blink
  const classifiedShow = frame > 24;
  const classifiedBlink = Math.floor(frame / 8) % 2 === 0;

  // Glitch effect (occasional)
  const glitchActive =
    (frame > 20 && frame < 23) ||
    (frame > 44 && frame < 46) ||
    (frame > 64 && frame < 66);
  const glitchOffset = glitchActive ? Math.sin(frame * 47) * 8 : 0;

  // Horizontal glitch bars
  const glitchBars = glitchActive
    ? Array.from({ length: 3 }).map((_, i) => ({
        top: ((frame * 13 + i * 337) % 1080),
        height: 2 + (i % 3) * 3,
        offset: Math.sin(frame * 19 + i) * 20,
      }))
    : [];

  // Fade out at end
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 12, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const masterOpacity = fadeIn * fadeOut;

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, opacity: masterOpacity }}>
      {/* Grid background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 59px, rgba(20,60,40,0.04) 59px, rgba(20,60,40,0.04) 60px), repeating-linear-gradient(90deg, transparent, transparent 59px, rgba(20,60,40,0.04) 59px, rgba(20,60,40,0.04) 60px)",
        }}
      />

      {/* Scanline */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: scanY,
          height: 2,
          backgroundColor: C.hudGreen,
          opacity: 0.06,
        }}
      />

      {/* Horizontal scan bars (scanline overlay) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 4px)",
          pointerEvents: "none",
        }}
      />

      {/* Glitch bars */}
      {glitchBars.map((bar, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: bar.top,
            height: bar.height,
            backgroundColor: C.hudGreen,
            opacity: 0.15,
            transform: `translateX(${bar.offset}px)`,
          }}
        />
      ))}

      {/* Center content */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) translateX(${glitchOffset}px)`,
          textAlign: "center",
          fontFamily: "monospace",
        }}
      >
        {/* CLASSIFIED tag */}
        {classifiedShow && classifiedBlink && (
          <div
            style={{
              fontSize: 21,
              color: C.hudRed,
              letterSpacing: 6,
              marginBottom: 30,
              textShadow: `2px 2px 4px rgba(0,0,0,0.3)`,
            }}
          >
            CLASSIFIED // DEFENSE COMMAND
          </div>
        )}

        {/* Main title */}
        <div
          style={{
            fontSize: 104,
            fontWeight: "bold",
            color: C.hudGreen,
            letterSpacing: 12,
            textShadow: `2px 2px 6px rgba(0,0,0,0.3)`,
            opacity: titleReveal,
            transform: `translateY(${(1 - titleReveal) * 20}px)`,
          }}
        >
          MISSILE DEFENSE
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 31,
            color: C.hudAmber,
            letterSpacing: 8,
            marginTop: 20,
            opacity: subtitleReveal,
            textShadow: `2px 2px 4px rgba(0,0,0,0.2)`,
          }}
        >
          MULTI-LAYER INTERCEPTION SYSTEM
        </div>

        {/* Horizontal divider */}
        <div
          style={{
            width: interpolate(frame, [36, 56], [0, 500], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.cubic),
            }),
            height: 1,
            backgroundColor: C.hudGreen,
            opacity: 0.4,
            margin: "25px auto",
          }}
        />

        {/* Date */}
        <div
          style={{
            fontSize: 36,
            color: C.white,
            letterSpacing: 4,
            opacity: dateReveal * 0.8,
            fontWeight: "bold",
          }}
        >
          28.02.2026
        </div>

        <div
          style={{
            fontSize: 18,
            color: C.hudGreen,
            letterSpacing: 3,
            marginTop: 8,
            opacity: dateReveal * 0.5,
          }}
        >
          IRANIAN BALLISTIC MISSILE ATTACK
        </div>
      </div>

      {/* Corner brackets - top left */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 40,
          width: 40,
          height: 40,
          borderTop: `2px solid ${C.hudGreen}`,
          borderLeft: `2px solid ${C.hudGreen}`,
          opacity: 0.4,
        }}
      />
      {/* Corner brackets - top right */}
      <div
        style={{
          position: "absolute",
          top: 40,
          right: 40,
          width: 40,
          height: 40,
          borderTop: `2px solid ${C.hudGreen}`,
          borderRight: `2px solid ${C.hudGreen}`,
          opacity: 0.4,
        }}
      />
      {/* Corner brackets - bottom left */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 40,
          width: 40,
          height: 40,
          borderBottom: `2px solid ${C.hudGreen}`,
          borderLeft: `2px solid ${C.hudGreen}`,
          opacity: 0.4,
        }}
      />
      {/* Corner brackets - bottom right */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          right: 40,
          width: 40,
          height: 40,
          borderBottom: `2px solid ${C.hudGreen}`,
          borderRight: `2px solid ${C.hudGreen}`,
          opacity: 0.4,
        }}
      />

      {/* Bottom left system info */}
      <div
        style={{
          position: "absolute",
          bottom: 50,
          left: 50,
          fontFamily: "monospace",
          fontSize: 16,
          color: C.hudGreen,
          opacity: dateReveal * 0.4,
          lineHeight: "24px",
        }}
      >
        <div>SYS: DEFENSE_CMD_v4.2</div>
        <div>STATUS: ACTIVE</div>
      </div>

      {/* Bottom right */}
      <div
        style={{
          position: "absolute",
          bottom: 50,
          right: 50,
          fontFamily: "monospace",
          fontSize: 16,
          color: C.hudGreen,
          opacity: dateReveal * 0.4,
          textAlign: "right",
          lineHeight: "24px",
        }}
      >
        <div>FEED: SATELLITE</div>
        <div>ENCRYPTION: AES-256</div>
      </div>

      {/* Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.15) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
