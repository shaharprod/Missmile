import {
  AbsoluteFill,
  interpolate,
  Easing,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { MilitaryMap } from "../components/MilitaryMap";
import { C, TEHRAN, TEL_AVIV, BG_CITIES, FPS, SCENE_TEHRAN } from "../lib/constants";
import { lerpGeo } from "../lib/geo";

export const MissileTravel = () => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  // Missile progress along trajectory
  const progress = interpolate(frame, [0, durationInFrames - 1], [0, 0.92], {
    easing: Easing.inOut(Easing.sin),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Camera slowly follows missile (map pan)
  const currentPos = lerpGeo(TEHRAN, TEL_AVIV, progress);
  const mapCenterLng = (TEHRAN.lng + currentPos.lng) / 2;
  const mapCenterLat = (TEHRAN.lat + currentPos.lat) / 2;

  // Zoom out to show full trajectory
  const scale = interpolate(frame, [0, durationInFrames - 1], [0.8, 0.75], {
    easing: Easing.inOut(Easing.sin),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const offsetX = interpolate(frame, [0, durationInFrames - 1], [-30, 60], {
    easing: Easing.inOut(Easing.sin),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const offsetY = interpolate(frame, [0, durationInFrames - 1], [0, 10], {
    easing: Easing.inOut(Easing.sin),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Distance calculation (approximate km)
  const totalDistKm = 1600;
  const remainingKm = Math.round(totalDistKm * (1 - progress));
  const speed = Math.round(2000 + progress * 4000); // m/s
  const altitude = Math.round(
    interpolate(progress, [0, 0.4, 0.92], [50, 400, 120], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );

  // Mission time (continues from Tehran scene)
  const totalSeconds = (SCENE_TEHRAN + frame) / FPS;
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const ss = String(Math.floor(totalSeconds % 60)).padStart(2, "0");
  const ms = String(Math.floor((totalSeconds % 1) * 100)).padStart(2, "0");

  const hudLines = [
    "BALLISTIC MISSILE TRACKING",
    `ORIGIN: TEHRAN, IRAN`,
    `TARGET: TEL AVIV, ISRAEL`,
    `DISTANCE: ${remainingKm} km`,
    `SPEED: ${speed} m/s`,
    `ALTITUDE: ${altitude} km`,
    `TRACK: ${(progress * 100).toFixed(0)}%`,
  ];

  // Warning when close
  const closeWarning = progress > 0.7;
  const warningBlink = Math.floor(frame / 6) % 2 === 0;

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <MilitaryMap
        width={width}
        height={height}
        scale={scale}
        offsetX={offsetX}
        offsetY={offsetY}
        cities={[
          { ...TEHRAN, color: C.hudRed, role: "capital" },
          { ...TEL_AVIV, color: C.hudGreen, role: "capital" },
          ...BG_CITIES,
        ]}
        trajectory={{
          progress,
          fromLng: TEHRAN.lng,
          fromLat: TEHRAN.lat,
          toLng: TEL_AVIV.lng,
          toLat: TEL_AVIV.lat,
        }}
        hudText={hudLines}
        missionTime={`${mm}:${ss}.${ms}`}
      />

      {/* Defense layers infographic - appears when progress > 0.3 */}
      {progress > 0.3 && (
        <div
          style={{
            position: "absolute",
            right: 30,
            top: 200,
            fontFamily: "monospace",
            opacity: interpolate(progress, [0.3, 0.4], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          <div
            style={{
              fontSize: 14,
              color: C.hudGreen,
              letterSpacing: 2,
              marginBottom: 10,
              opacity: 0.6,
            }}
          >
            DEFENSE LAYERS
          </div>

          {/* Altitude scale bar */}
          <div style={{ position: "relative", width: 180, height: 260 }}>
            {/* Vertical altitude line */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: 1,
                backgroundColor: C.hudGreen,
                opacity: 0.2,
              }}
            />

            {/* Defense layer zones */}
            {[
              { name: "ARROW-3", he: "חץ-3", top: 0, height: 55, altLabel: "100+ km", color: "#ff3344", minAlt: 100 },
              { name: "ARROW-2", he: "חץ-2", top: 65, height: 55, altLabel: "50-100 km", color: "#ff6644", minAlt: 50 },
              { name: "DAVID'S SLING", he: "קלע דוד", top: 130, height: 50, altLabel: "15-50 km", color: "#ffaa00", minAlt: 15 },
              { name: "IRON DOME", he: "כיפת ברזל", top: 195, height: 50, altLabel: "0-15 km", color: "#00ff88", minAlt: 0 },
            ].map((layer) => {
              const isActive =
                (layer.minAlt === 100 && altitude >= 100) ||
                (layer.minAlt === 50 && altitude >= 50 && altitude < 100) ||
                (layer.minAlt === 15 && altitude >= 15 && altitude < 50) ||
                (layer.minAlt === 0 && altitude < 15);

              return (
                <div
                  key={layer.name}
                  style={{
                    position: "absolute",
                    left: 8,
                    top: layer.top,
                    height: layer.height,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {/* Layer bar */}
                  <div
                    style={{
                      width: 4,
                      height: layer.height - 8,
                      backgroundColor: layer.color,
                      opacity: isActive ? 0.8 : 0.15,
                      boxShadow: isActive ? `0 0 8px ${layer.color}` : "none",
                      borderRadius: 2,
                    }}
                  />

                  {/* Layer info */}
                  <div>
                    <div
                      style={{
                        fontSize: 16,
                        color: isActive ? layer.color : "#b0b0b0",
                        fontWeight: isActive ? "bold" : "normal",
                        letterSpacing: 1,
                      }}
                    >
                      {layer.name}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: isActive ? layer.color : "#c8c8c8",
                        opacity: 0.7,
                      }}
                    >
                      {layer.altLabel}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Current altitude marker */}
            {(() => {
              const markerY = interpolate(altitude, [0, 400], [245, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              return (
                <div
                  style={{
                    position: "absolute",
                    left: -6,
                    top: markerY,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <div
                    style={{
                      width: 0,
                      height: 0,
                      borderTop: "5px solid transparent",
                      borderBottom: "5px solid transparent",
                      borderLeft: `6px solid ${C.hudRed}`,
                    }}
                  />
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Warning overlay */}
      {closeWarning && warningBlink && (
        <div
          style={{
            position: "absolute",
            bottom: 80,
            right: 40,
            fontFamily: "monospace",
            fontSize: 42,
            fontWeight: "bold",
            color: C.hudRed,
            textShadow: `2px 2px 4px rgba(0,0,0,0.4)`,
          }}
        >
          ⚠ INCOMING THREAT - ACTIVATING DEFENSE
        </div>
      )}

      {/* Progress bar at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: 40,
          right: 40,
          height: 4,
          backgroundColor: "#c0c8d0",
          borderRadius: 2,
        }}
      >
        <div
          style={{
            width: `${progress * 100}%`,
            height: "100%",
            backgroundColor: progress > 0.7 ? C.hudRed : C.hudAmber,
            borderRadius: 2,
            boxShadow: `0 0 4px ${progress > 0.7 ? C.hudRed : C.hudAmber}`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
