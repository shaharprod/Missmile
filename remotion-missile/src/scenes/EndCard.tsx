import {
  AbsoluteFill,
  interpolate,
  Easing,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C } from "../lib/constants";

const STATS = [
  { label: "DAYS OF ALERTS", value: "21", icon: ">" },
  { label: "TOTAL ALERTS", value: "67,890", icon: "#" },
  { label: "INTERCEPTION RESULT", value: "SUCCESS", icon: "+" },
  { label: "THREAT LEVEL", value: "NEUTRALIZED", icon: "=" },
];

// Red alert siren activations per day — Source: OREF (Pikud HaOref) via Tzofar
// 28.02.2026 - 20.03.2026
const DAILY_ALERTS = [
  { date: "28.02", alerts: 13185 },
  { date: "01.03", alerts: 9093 },
  { date: "02.03", alerts: 2687 },
  { date: "03.03", alerts: 3908 },
  { date: "04.03", alerts: 2439 },
  { date: "05.03", alerts: 2512 },
  { date: "06.03", alerts: 1368 },
  { date: "07.03", alerts: 2853 },
  { date: "08.03", alerts: 2675 },
  { date: "09.03", alerts: 2831 },
  { date: "10.03", alerts: 3309 },
  { date: "11.03", alerts: 2792 },
  { date: "12.03", alerts: 1646 },
  { date: "13.03", alerts: 1804 },
  { date: "14.03", alerts: 1260 },
  { date: "15.03", alerts: 1520 },
  { date: "16.03", alerts: 2193 },
  { date: "17.03", alerts: 1981 },
  { date: "18.03", alerts: 1835 },
  { date: "19.03", alerts: 2735 },
  { date: "20.03", alerts: 3264 },
];

const MAX_ALERTS = Math.max(...DAILY_ALERTS.map((d) => d.alerts));

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
  const fadeIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Title reveal
  const titleReveal = interpolate(frame, [8, 28], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Divider line
  const dividerWidth = interpolate(frame, [24, 44], [0, 600], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Fade to black at end
  const fadeOut = interpolate(frame, [durationInFrames - 24, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // End transmission blink
  const endTransmission = frame > 130;
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
            "repeating-linear-gradient(0deg, transparent, transparent 59px, rgba(20,60,40,0.03) 59px, rgba(20,60,40,0.03) 60px), repeating-linear-gradient(90deg, transparent, transparent 59px, rgba(20,60,40,0.03) 59px, rgba(20,60,40,0.03) 60px)",
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
          width: 900,
        }}
      >
        {/* THREAT NEUTRALIZED */}
        <div
          style={{
            fontSize: 73,
            fontWeight: "bold",
            color: C.hudGreen,
            letterSpacing: 8,
            textShadow: `2px 2px 6px rgba(0,0,0,0.3)`,
            opacity: titleReveal,
            transform: `translateY(${(1 - titleReveal) * 15}px)`,
          }}
        >
          THREAT NEUTRALIZED
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 23,
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
            const statReveal = interpolate(frame, [32 + i * 6, 44 + i * 6], [0, 1], {
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
                <div style={{ fontSize: 16, color: C.hudGreen, opacity: 0.5, marginBottom: 6 }}>
                  {stat.icon} {stat.label}
                </div>
                <div
                  style={{
                    fontSize: 36,
                    fontWeight: "bold",
                    color: stat.value === "SUCCESS" || stat.value === "NEUTRALIZED" ? C.hudGreen : C.white,
                    textShadow:
                      stat.value === "SUCCESS" || stat.value === "NEUTRALIZED"
                        ? `2px 2px 4px rgba(0,0,0,0.2)`
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
            margin: "0 auto 20px",
          }}
        />

        {/* Daily alerts bar chart */}
        {(() => {
          const chartReveal = interpolate(frame, [56, 76], [0, 1], {
            easing: Easing.out(Easing.cubic),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div style={{ opacity: chartReveal, marginBottom: 20 }}>
              <div style={{ fontSize: 14, color: C.hudGreen, opacity: 0.5, marginBottom: 10, letterSpacing: 3 }}>
                DAILY ALERTS — 28.02.2026 → 20.03.2026
              </div>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 4, height: 60 }}>
                {DAILY_ALERTS.map((day, i) => {
                  const barGrow = interpolate(frame, [60 + i * 1.5, 72 + i * 1.5], [0, 1], {
                    easing: Easing.out(Easing.cubic),
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  });
                  const barHeight = (day.alerts / MAX_ALERTS) * 50 * barGrow;
                  const isHigh = day.alerts > 200;
                  return (
                    <div key={day.date} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div
                        style={{
                          width: 30,
                          height: barHeight,
                          backgroundColor: isHigh ? C.hudRed : C.hudGreen,
                          opacity: isHigh ? 0.8 : 0.5,
                          borderRadius: "2px 2px 0 0",
                        }}
                      />
                      <div style={{ fontSize: 9, color: C.hudGreen, opacity: 0.4, marginTop: 3 }}>
                        {day.date.split(".")[0]}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Previous attack info */}
        {(() => {
          const prevReveal = interpolate(frame, [80, 96], [0, 1], {
            easing: Easing.out(Easing.cubic),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div style={{ opacity: prevReveal, marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: C.hudAmber, opacity: 0.6, letterSpacing: 2 }}>
                PREVIOUS IRANIAN ATTACK: 01.10.2024 — 516 DAYS BEFORE
              </div>
            </div>
          );
        })()}

        {/* Divider */}
        <div
          style={{
            width: dividerWidth * 0.5,
            height: 1,
            backgroundColor: C.hudGreen,
            opacity: 0.15,
            margin: "0 auto 20px",
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
            const layerReveal = interpolate(frame, [100 + i * 5, 112 + i * 5], [0, 1], {
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
                    boxShadow: `0 0 3px ${layer.color}`,
                    margin: "0 auto 8px",
                  }}
                />
                <div style={{ fontSize: 18, color: layer.color, fontWeight: "bold" }}>
                  {layer.en}
                </div>
                <div style={{ fontSize: 17, color: layer.color, opacity: 0.7, marginTop: 2 }}>
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
              fontSize: 18,
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
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.02) 3px, rgba(0,0,0,0.02) 4px)",
          pointerEvents: "none",
        }}
      />

      {/* Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.12) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
