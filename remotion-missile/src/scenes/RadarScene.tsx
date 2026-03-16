import {
  AbsoluteFill,
  interpolate,
  Easing,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C } from "../lib/constants";

// Defense system definitions
const DEFENSE_SYSTEMS = [
  { name: "ARROW-3", nameHe: "חץ-3", range: "Exo-atmospheric", activateFrame: 48, color: "#ff3344" },
  { name: "ARROW-2", nameHe: "חץ-2", range: "Upper atmosphere", activateFrame: 60, color: "#ff6644" },
  { name: "DAVID'S SLING", nameHe: "קלע דוד", range: "Mid-range", activateFrame: 72, color: "#ffaa00" },
  { name: "IRON DOME", nameHe: "כיפת ברזל", range: "Short-range", activateFrame: 84, color: "#00ff88" },
];

export const RadarScene = () => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const cx = width * 0.38;
  const cy = height * 0.5;
  const radarR = 280;

  // Radar sweep angle (rotates continuously)
  const sweepAngle = (frame / 60) * Math.PI * 2 * 1.5; // 1.5 rotations over scene

  // Blip detection
  const blipDetected = frame > 28;
  const blipBlink = Math.floor(frame / 5) % 2 === 0;
  // Blip position (incoming from top-right quadrant)
  const blipAngle = -0.6;
  const blipDist = interpolate(frame, [28, durationInFrames], [radarR * 0.85, radarR * 0.25], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const blipX = cx + Math.cos(blipAngle) * blipDist;
  const blipY = cy + Math.sin(blipAngle) * blipDist;

  // Phase text
  let phaseText = "SCANNING...";
  let phaseColor = C.hudGreen;
  if (frame > 28 && frame < 44) {
    phaseText = "TARGET ACQUIRED";
    phaseColor = C.hudAmber;
  } else if (frame >= 44 && frame < 72) {
    phaseText = "TRACKING TARGET";
    phaseColor = C.hudRed;
  } else if (frame >= 72) {
    phaseText = "DEFENSE ACTIVATION";
    phaseColor = C.hudGreen;
  }

  // Fade in/out
  const fadeIn = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = fadeIn * fadeOut;

  // Radar green color (stays neon green even in daylight - it's a screen)
  const RG = "#00cc66";

  // Sweep trail gradient (fading trail behind sweep line)
  const trailAngle = sweepAngle - 0.8;

  // Radar screen dimensions and position
  const screenW = radarR * 2 + 80;
  const screenH = radarR * 2 + 80;
  const screenLeft = cx - screenW / 2;
  const screenTop = cy - screenH / 2;

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, opacity }}>
      {/* Dark radar screen container */}
      <div
        style={{
          position: "absolute",
          left: screenLeft,
          top: screenTop,
          width: screenW,
          height: screenH,
          backgroundColor: "#0a0e1a",
          borderRadius: 16,
          border: "2px solid #2a3a4a",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3), inset 0 0 30px rgba(0,0,0,0.5)",
          overflow: "hidden",
        }}
      />

      {/* Radar display */}
      <svg width={width} height={height} style={{ position: "absolute" }}>
        <defs>
          {/* Sweep trail gradient */}
          <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={RG} stopOpacity="0.1" />
            <stop offset="100%" stopColor={RG} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Radar circles */}
        {[0.25, 0.5, 0.75, 1].map((r) => (
          <circle
            key={r}
            cx={cx}
            cy={cy}
            r={radarR * r}
            fill="none"
            stroke={RG}
            strokeWidth={1}
            opacity={0.2}
          />
        ))}

        {/* Cross hairs */}
        <line x1={cx - radarR} y1={cy} x2={cx + radarR} y2={cy} stroke={RG} strokeWidth={1} opacity={0.15} />
        <line x1={cx} y1={cy - radarR} x2={cx} y2={cy + radarR} stroke={RG} strokeWidth={1} opacity={0.15} />
        {/* Diagonal cross */}
        <line
          x1={cx - radarR * 0.707}
          y1={cy - radarR * 0.707}
          x2={cx + radarR * 0.707}
          y2={cy + radarR * 0.707}
          stroke={RG}
          strokeWidth={0.5}
          opacity={0.1}
        />
        <line
          x1={cx + radarR * 0.707}
          y1={cy - radarR * 0.707}
          x2={cx - radarR * 0.707}
          y2={cy + radarR * 0.707}
          stroke={RG}
          strokeWidth={0.5}
          opacity={0.1}
        />

        {/* Sweep line */}
        <line
          x1={cx}
          y1={cy}
          x2={cx + Math.cos(sweepAngle) * radarR}
          y2={cy + Math.sin(sweepAngle) * radarR}
          stroke={RG}
          strokeWidth={2}
          opacity={0.8}
        />

        {/* Sweep trail (arc) */}
        {Array.from({ length: 20 }).map((_, i) => {
          const a = sweepAngle - (i * 0.04);
          const op = 0.15 * (1 - i / 20);
          return (
            <line
              key={`trail-${i}`}
              x1={cx}
              y1={cy}
              x2={cx + Math.cos(a) * radarR}
              y2={cy + Math.sin(a) * radarR}
              stroke={RG}
              strokeWidth={1}
              opacity={op}
            />
          );
        })}

        {/* Center dot */}
        <circle cx={cx} cy={cy} r={4} fill={RG} opacity={0.8} />

        {/* Radar outer ring */}
        <circle cx={cx} cy={cy} r={radarR + 2} fill="none" stroke={RG} strokeWidth={2} opacity={0.4} />

        {/* Range labels */}
        {[0.25, 0.5, 0.75].map((r) => (
          <text
            key={`range-${r}`}
            x={cx + 5}
            y={cy - radarR * r - 3}
            fill={RG}
            fontSize={13}
            fontFamily="monospace"
            opacity={0.3}
          >
            {Math.round(r * 1600)}km
          </text>
        ))}

        {/* Blip */}
        {blipDetected && (
          <>
            {/* Blip glow */}
            <circle cx={blipX} cy={blipY} r={12} fill="#ff3344" opacity={blipBlink ? 0.2 : 0.1} />
            <circle cx={blipX} cy={blipY} r={6} fill="#ff3344" opacity={blipBlink ? 0.6 : 0.3} />
            <circle cx={blipX} cy={blipY} r={3} fill="#ffffff" opacity={blipBlink ? 1 : 0.5} />

            {/* Blip label */}
            <text
              x={blipX + 15}
              y={blipY - 10}
              fill="#ff3344"
              fontSize={16}
              fontFamily="monospace"
              fontWeight="bold"
            >
              TGT-001
            </text>
            <text
              x={blipX + 15}
              y={blipY + 5}
              fill="#ff3344"
              fontSize={13}
              fontFamily="monospace"
              opacity={0.7}
            >
              BM / SHAHAB-3
            </text>
          </>
        )}

        {/* Compass labels */}
        <text x={cx} y={cy - radarR - 10} textAnchor="middle" fill={RG} fontSize={16} fontFamily="monospace" opacity={0.4}>N</text>
        <text x={cx} y={cy + radarR + 18} textAnchor="middle" fill={RG} fontSize={16} fontFamily="monospace" opacity={0.4}>S</text>
        <text x={cx + radarR + 10} y={cy + 4} textAnchor="start" fill={RG} fontSize={16} fontFamily="monospace" opacity={0.4}>E</text>
        <text x={cx - radarR - 10} y={cy + 4} textAnchor="end" fill={RG} fontSize={16} fontFamily="monospace" opacity={0.4}>W</text>
      </svg>

      {/* Phase text - top left */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 40,
          fontFamily: "monospace",
          fontSize: 36,
          color: phaseColor,
          textShadow: `2px 2px 4px rgba(0,0,0,0.3)`,
          fontWeight: "bold",
          letterSpacing: 4,
        }}
      >
        {phaseText}
      </div>

      <div
        style={{
          position: "absolute",
          top: 75,
          left: 40,
          fontFamily: "monospace",
          fontSize: 18,
          color: C.hudGreen,
          opacity: 0.6,
          lineHeight: "28px",
        }}
      >
        <div>EARLY WARNING RADAR SYSTEM</div>
        <div>ORIGIN: TEHRAN, IRAN → TEL AVIV, ISRAEL</div>
        <div>RANGE: 1,600 km</div>
      </div>

      {/* Defense systems panel - right side */}
      <div
        style={{
          position: "absolute",
          top: 160,
          right: 60,
          fontFamily: "monospace",
          width: 380,
        }}
      >
        <div
          style={{
            fontSize: 21,
            color: C.hudGreen,
            letterSpacing: 3,
            marginBottom: 20,
            opacity: frame > 40 ? 1 : 0,
            borderBottom: `1px solid ${C.hudGreen}`,
            paddingBottom: 8,
          }}
        >
          AIR DEFENSE SYSTEMS
        </div>

        {DEFENSE_SYSTEMS.map((sys) => {
          const active = frame >= sys.activateFrame;
          const animProgress = active
            ? interpolate(frame, [sys.activateFrame, sys.activateFrame + 12], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.out(Easing.cubic),
              })
            : 0;

          return (
            <div
              key={sys.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 16,
                opacity: frame > 40 ? (active ? 1 : 0.3) : 0,
                transform: `translateX(${(1 - Math.min(1, frame > 40 ? 1 : 0)) * 30}px)`,
              }}
            >
              {/* Status indicator */}
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: active ? sys.color : "#c0c0c0",
                  boxShadow: active ? `0 0 4px ${sys.color}` : "none",
                  transition: "all 0.3s",
                }}
              />

              {/* System info */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 23,
                    color: active ? sys.color : "#999",
                    fontWeight: "bold",
                    letterSpacing: 2,
                  }}
                >
                  {sys.name}
                  <span style={{ fontSize: 18, marginLeft: 8, opacity: 0.7 }}>
                    {sys.nameHe}
                  </span>
                </div>
                <div style={{ fontSize: 16, color: "#888", marginTop: 2 }}>
                  {sys.range}
                </div>
              </div>

              {/* Status text */}
              <div
                style={{
                  fontSize: 16,
                  color: active ? sys.color : "#aaa",
                  letterSpacing: 1,
                }}
              >
                {active ? "ACTIVE" : "STANDBY"}
              </div>

              {/* Progress bar */}
              {active && (
                <div
                  style={{
                    width: 60,
                    height: 3,
                    backgroundColor: "#c0c8d0",
                    borderRadius: 2,
                  }}
                >
                  <div
                    style={{
                      width: `${animProgress * 100}%`,
                      height: "100%",
                      backgroundColor: sys.color,
                      borderRadius: 2,
                      boxShadow: `0 0 6px ${sys.color}`,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* All systems active message */}
        {frame > 96 && (
          <div
            style={{
              marginTop: 20,
              fontSize: 21,
              color: C.hudGreen,
              letterSpacing: 3,
              textShadow: `2px 2px 4px rgba(0,0,0,0.3)`,
              opacity: Math.floor(frame / 8) % 2 === 0 ? 1 : 0.6,
            }}
          >
            ALL DEFENSE LAYERS ENGAGED
          </div>
        )}
      </div>

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
            "radial-gradient(ellipse at 38% 50%, transparent 30%, rgba(0,0,0,0.12) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
