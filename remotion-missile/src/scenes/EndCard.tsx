import {
  AbsoluteFill,
  interpolate,
  Easing,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C } from "../lib/constants";

const STATS = [
  { label: "INTERCEPTORS LAUNCHED", value: "4", icon: ">" },
  { label: "INTERCEPTION RESULT", value: "SUCCESS", icon: "+" },
  { label: "DEBRIS FRAGMENTS", value: "14", icon: "#" },
  { label: "THREAT LEVEL", value: "NEUTRALIZED", icon: "=" },
];

const DEFENSE_LAYERS = [
  { en: "ARROW-3", he: "חץ-3", color: "#ff3344" },
  { en: "ARROW-2", he: "חץ-2", color: "#ff6644" },
  { en: "DAVID'S SLING", he: "קלע דוד", color: "#ffaa00" },
  { en: "IRON DOME", he: "כיפת ברזל", color: "#00ff88" },
];

export const EndCard = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Fade in from black (continuing from InterceptionScene fade)
  const fadeIn = interpolate(frame, [0, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Title reveal
  const titleReveal = interpolate(frame, [10, 35], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Divider line
  const dividerWidth = interpolate(frame, [30, 55], [0, 600], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Fade to black at end
  const fadeOut = interpolate(frame, [durationInFrames - 30, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // End transmission blink
  const endTransmission = frame > 100;
  const endBlink = Math.floor(frame / 12) % 2 === 0;

  const masterOpacity = fadeIn * fadeOut;

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, opacity: masterOpacity }}>
      {/* Grid background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 59px, rgba(0,255,136,0.02) 59px, rgba(0,255,136,0.02) 60px), repeating-linear-gradient(90deg, transparent, transparent 59px, rgba(0,255,136,0.02) 59px, rgba(0,255,136,0.02) 60px)",
        }}
      />

      {/* Main content */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          fontFamily: "monospace",
          width: 800,
        }}
      >
        {/* THREAT NEUTRALIZED */}
        <div
          style={{
            fontSize: 56,
            fontWeight: "bold",
            color: C.hudGreen,
            letterSpacing: 8,
            textShadow: `0 0 25px ${C.hudGreen}, 0 0 50px rgba(0,255,136,0.3)`,
            opacity: titleReveal,
            transform: `translateY(${(1 - titleReveal) * 15}px)`,
          }}
        >
          THREAT NEUTRALIZED
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 18,
            color: C.hudAmber,
            letterSpacing: 5,
            marginTop: 10,
            opacity: titleReveal * 0.7,
          }}
        >
          MISSION DEBRIEF
        </div>

        {/* Divider */}
        <div
          style={{
            width: dividerWidth,
            height: 1,
            backgroundColor: C.hudGreen,
            opacity: 0.4,
            margin: "30px auto",
          }}
        />

        {/* Stats grid */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 40,
            flexWrap: "wrap",
            marginBottom: 35,
          }}
        >
          {STATS.map((stat, i) => {
            const statReveal = interpolate(frame, [40 + i * 8, 55 + i * 8], [0, 1], {
              easing: Easing.out(Easing.cubic),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });

            return (
              <div
                key={stat.label}
                style={{
                  opacity: statReveal,
                  transform: `translateY(${(1 - statReveal) * 10}px)`,
                  textAlign: "center",
                  minWidth: 150,
                }}
              >
                <div style={{ fontSize: 12, color: C.hudGreen, opacity: 0.5, marginBottom: 6 }}>
                  {stat.icon} {stat.label}
                </div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: "bold",
                    color: stat.value === "SUCCESS" || stat.value === "NEUTRALIZED" ? C.hudGreen : C.white,
                    textShadow:
                      stat.value === "SUCCESS" || stat.value === "NEUTRALIZED"
                        ? `0 0 10px ${C.hudGreen}`
                        : "none",
                  }}
                >
                  {stat.value}
                </div>
              </div>
            );
          })}
        </div>

        {/* Divider */}
        <div
          style={{
            width: dividerWidth * 0.6,
            height: 1,
            backgroundColor: C.hudGreen,
            opacity: 0.2,
            margin: "0 auto 25px",
          }}
        />

        {/* Defense layers */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 30,
            marginBottom: 30,
          }}
        >
          {DEFENSE_LAYERS.map((layer, i) => {
            const layerReveal = interpolate(frame, [65 + i * 6, 80 + i * 6], [0, 1], {
              easing: Easing.out(Easing.cubic),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });

            return (
              <div
                key={layer.en}
                style={{
                  opacity: layerReveal,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: layer.color,
                    boxShadow: `0 0 8px ${layer.color}`,
                    margin: "0 auto 8px",
                  }}
                />
                <div style={{ fontSize: 14, color: layer.color, fontWeight: "bold" }}>
                  {layer.en}
                </div>
                <div style={{ fontSize: 13, color: layer.color, opacity: 0.7, marginTop: 2 }}>
                  {layer.he}
                </div>
              </div>
            );
          })}
        </div>

        {/* END TRANSMISSION */}
        {endTransmission && (
          <div
            style={{
              fontSize: 14,
              color: C.hudGreen,
              letterSpacing: 6,
              opacity: endBlink ? 0.6 : 0.3,
              marginTop: 20,
            }}
          >
            DEFENSE COMMAND // END TRANSMISSION
          </div>
        )}
      </div>

      {/* Corner brackets */}
      {[
        { top: 40, left: 40, borderTop: true, borderLeft: true },
        { top: 40, right: 40, borderTop: true, borderRight: true },
        { bottom: 40, left: 40, borderBottom: true, borderLeft: true },
        { bottom: 40, right: 40, borderBottom: true, borderRight: true },
      ].map((pos, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            ...Object.fromEntries(
              Object.entries(pos).filter(([k]) => ["top", "bottom", "left", "right"].includes(k)),
            ),
            width: 30,
            height: 30,
            borderTop: pos.borderTop ? `2px solid ${C.hudGreen}` : "none",
            borderBottom: pos.borderBottom ? `2px solid ${C.hudGreen}` : "none",
            borderLeft: pos.borderLeft ? `2px solid ${C.hudGreen}` : "none",
            borderRight: pos.borderRight ? `2px solid ${C.hudGreen}` : "none",
            opacity: 0.3,
          }}
        />
      ))}

      {/* Scanline overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.1) 3px, rgba(0,0,0,0.1) 4px)",
          pointerEvents: "none",
        }}
      />

      {/* Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
