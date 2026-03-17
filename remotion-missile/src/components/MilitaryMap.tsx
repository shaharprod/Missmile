import React from "react";
import { Img, staticFile } from "remotion";
import { COUNTRIES, BACKGROUND_WATER, WATER_BODIES, RIVERS } from "../lib/countries";
import { polygonToPath, polylineToPath, project } from "../lib/geo";
import { C, TEHRAN, TEL_AVIV, MAP_BOUNDS, type CityRole } from "../lib/constants";

type CityMarker = {
  lng: number;
  lat: number;
  name: string;
  color?: string;
  role?: CityRole;
};

type TrajectoryState = {
  progress: number; // 0-1
  fromLng: number;
  fromLat: number;
  toLng: number;
  toLat: number;
};

type MilitaryMapProps = {
  width: number;
  height: number;
  scale?: number;
  offsetX?: number;
  offsetY?: number;
  cities?: CityMarker[];
  trajectory?: TrajectoryState;
  hudText?: string[];
  showGrid?: boolean;
  opacity?: number;
  missionTime?: string;
};

export const MilitaryMap: React.FC<MilitaryMapProps> = ({
  width,
  height,
  scale = 1,
  offsetX = 0,
  offsetY = 0,
  cities = [
    { ...TEHRAN, color: C.hudRed, role: "capital" as CityRole },
    { ...TEL_AVIV, color: C.hudGreen, role: "capital" as CityRole },
  ],
  trajectory,
  hudText,
  showGrid = true,
  opacity = 1,
  missionTime,
}) => {
  const w = width;
  const h = height;

  // Grid lines every 2 degrees
  const gridLinesH: number[] = [];
  for (let lat = 24; lat <= 42; lat += 2) gridLinesH.push(lat);
  const gridLinesV: number[] = [];
  for (let lng = 30; lng <= 56; lng += 2) gridLinesV.push(lng);

  // Trajectory line
  let trajectoryPath = "";
  let missilePos: [number, number] | null = null;
  if (trajectory) {
    const from = project(trajectory.fromLng, trajectory.fromLat, w, h);
    const to = project(trajectory.toLng, trajectory.toLat, w, h);
    const cx = (from[0] + to[0]) / 2;
    const cy = Math.min(from[1], to[1]) - 120; // arc peak
    const t = trajectory.progress;

    // Quadratic bezier for arc
    const mx =
      (1 - t) * (1 - t) * from[0] +
      2 * (1 - t) * t * cx +
      t * t * to[0];
    const my =
      (1 - t) * (1 - t) * from[1] +
      2 * (1 - t) * t * cy +
      t * t * to[1];
    missilePos = [mx, my];

    // Draw arc up to current progress with multiple small segments
    const segments = Math.max(2, Math.floor(t * 50));
    const pathParts: string[] = [];
    for (let i = 0; i <= segments; i++) {
      const st = (i / segments) * t;
      const sx =
        (1 - st) * (1 - st) * from[0] +
        2 * (1 - st) * st * cx +
        st * st * to[0];
      const sy =
        (1 - st) * (1 - st) * from[1] +
        2 * (1 - st) * st * cy +
        st * st * to[1];
      pathParts.push(`${i === 0 ? "M" : "L"}${sx.toFixed(1)},${sy.toFixed(1)}`);
    }
    trajectoryPath = pathParts.join(" ");
  }

  // City marker sizing by role
  const getCityStyle = (role: CityRole = "major") => {
    switch (role) {
      case "capital":
        return { outerR: 16, innerR: 8, dotR: 5, fontSize: 23, opacity: 1 };
      case "major":
        return { outerR: 12, innerR: 6, dotR: 3, fontSize: 18, opacity: 0.8 };
      case "minor":
        return { outerR: 8, innerR: 4, dotR: 2, fontSize: 14, opacity: 0.6 };
    }
  };

  return (
    <div
      style={{
        width,
        height,
        position: "absolute",
        overflow: "hidden",
        backgroundColor: C.bg,
        opacity,
      }}
    >
      {/* High-resolution dark map background */}
      <Img
        src={staticFile("map-light.png")}
        style={{
          position: "absolute",
          width: w,
          height: h,
          transform: `scale(${scale}) translate(${offsetX}px, ${offsetY}px)`,
          transformOrigin: "center center",
          objectFit: "cover",
        }}
      />

      <svg
        width={w}
        height={h}
        style={{
          position: "absolute",
          transform: `scale(${scale}) translate(${offsetX}px, ${offsetY}px)`,
          transformOrigin: "center center",
        }}
      >
        {/* Grid */}
        {showGrid &&
          gridLinesH.map((lat) => {
            const [, y] = project(30, lat, w, h);
            return (
              <line
                key={`h-${lat}`}
                x1={0}
                y1={y}
                x2={w}
                y2={y}
                stroke={C.hudGreen}
                strokeWidth={0.5}
                opacity={0.12}
              />
            );
          })}
        {showGrid &&
          gridLinesV.map((lng) => {
            const [x] = project(lng, 35, w, h);
            return (
              <line
                key={`v-${lng}`}
                x1={x}
                y1={0}
                x2={x}
                y2={h}
                stroke={C.hudGreen}
                strokeWidth={0.5}
                opacity={0.12}
              />
            );
          })}

        {/* Grid coordinate labels */}
        {showGrid &&
          gridLinesV.map((lng) => {
            const [x] = project(lng, 35, w, h);
            return (
              <text
                key={`lbl-v-${lng}`}
                x={x}
                y={h - 8}
                textAnchor="middle"
                fill={C.hudGreen}
                fontSize={13}
                fontFamily="monospace"
                opacity={0.35}
              >
                {lng}°E
              </text>
            );
          })}
        {showGrid &&
          gridLinesH.map((lat) => {
            const [, y] = project(30, lat, w, h);
            return (
              <text
                key={`lbl-h-${lat}`}
                x={8}
                y={y + 3}
                textAnchor="start"
                fill={C.hudGreen}
                fontSize={13}
                fontFamily="monospace"
                opacity={0.35}
              >
                {lat}°N
              </text>
            );
          })}

        {/* Country border overlays (subtle glow on real map) */}
        {COUNTRIES.filter((c) =>
          ["Iran", "Israel"].includes(c.name),
        ).map((country) => (
          <path
            key={`border-${country.name}`}
            d={polygonToPath(country.points, w, h)}
            fill="none"
            stroke={country.name === "Iran" ? C.hudRed : C.hudGreen}
            strokeWidth={1.5}
            opacity={0.35}
          />
        ))}

        {/* Country name labels */}
        {[
          { name: "IRAN", nameHe: "איראן", lng: 53, lat: 33, color: C.hudRed },
          { name: "ISRAEL", nameHe: "ישראל", lng: 35, lat: 31.3, color: C.hudGreen },
          { name: "IRAQ", nameHe: "עיראק", lng: 43.5, lat: 33.5, color: "#8898a8" },
          { name: "SAUDI ARABIA", nameHe: "סעודיה", lng: 44, lat: 26.5, color: "#8898a8" },
          { name: "TURKEY", nameHe: "טורקיה", lng: 35, lat: 39.5, color: "#8898a8" },
          { name: "SYRIA", nameHe: "סוריה", lng: 38, lat: 35, color: "#8898a8" },
          { name: "JORDAN", nameHe: "ירדן", lng: 36.5, lat: 31, color: "#8898a8" },
          { name: "EGYPT", nameHe: "מצרים", lng: 31, lat: 27, color: "#8898a8" },
        ].map((country) => {
          const [cx, cy] = project(country.lng, country.lat, w, h);
          const isMain = country.name === "IRAN" || country.name === "ISRAEL";
          return (
            <g key={country.name}>
              <text
                x={cx}
                y={cy}
                textAnchor="middle"
                fill={country.color}
                fontSize={isMain ? 32 : 18}
                fontFamily="monospace"
                fontWeight="bold"
                opacity={isMain ? 0.85 : 0.4}
                letterSpacing={isMain ? 4 : 2}
              >
                {country.name}
              </text>
              <text
                x={cx}
                y={cy + (isMain ? 28 : 18)}
                textAnchor="middle"
                fill={country.color}
                fontSize={isMain ? 22 : 14}
                fontFamily="monospace"
                fontWeight="bold"
                opacity={isMain ? 0.6 : 0.3}
              >
                {country.nameHe}
              </text>
            </g>
          );
        })}

        {/* Trajectory */}
        {trajectory && trajectoryPath && (
          <>
            {/* Trail glow */}
            <path
              d={trajectoryPath}
              fill="none"
              stroke={C.missileGlow}
              strokeWidth={4}
              opacity={0.3}
              strokeLinecap="round"
            />
            {/* Trail core */}
            <path
              d={trajectoryPath}
              fill="none"
              stroke={C.missile}
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray="8,4"
            />
          </>
        )}

        {/* Missile position */}
        {missilePos && (
          <>
            <circle
              cx={missilePos[0]}
              cy={missilePos[1]}
              r={12}
              fill={C.missile}
              opacity={0.2}
            />
            <circle
              cx={missilePos[0]}
              cy={missilePos[1]}
              r={6}
              fill={C.missileGlow}
              opacity={0.5}
            />
            <circle
              cx={missilePos[0]}
              cy={missilePos[1]}
              r={3}
              fill={C.white}
            />
          </>
        )}

        {/* City markers */}
        {cities.map((city) => {
          const [cx, cy] = project(city.lng, city.lat, w, h);
          const color = city.color || C.cityMarker;
          const style = getCityStyle(city.role);
          return (
            <g key={city.name} opacity={style.opacity}>
              <circle cx={cx} cy={cy} r={style.outerR} fill={color} opacity={0.15} />
              <circle cx={cx} cy={cy} r={style.innerR} fill={color} opacity={0.3} />
              <circle cx={cx} cy={cy} r={style.dotR} fill={color} />
              {city.role === "capital" && (
                <circle cx={cx} cy={cy} r={style.outerR + 4} fill="none" stroke={color} strokeWidth={1} opacity={0.1} />
              )}
              <text
                x={cx}
                y={cy - style.outerR - 6}
                textAnchor="middle"
                fill={color}
                fontSize={style.fontSize}
                fontFamily="monospace"
                fontWeight="bold"
              >
                {city.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Scanline overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,60,30,0.008) 3px, rgba(0,60,30,0.008) 4px)",
          pointerEvents: "none",
        }}
      />

      {/* Vignette overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.15) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* HUD overlay text */}
      {hudText && (
        <div
          style={{
            position: "absolute",
            top: 30,
            left: 30,
            fontFamily: "monospace",
            fontSize: 23,
            color: C.hudGreen,
            lineHeight: "34px",
          }}
        >
          {hudText.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      )}

      {/* Mission time (top right) */}
      {missionTime && (
        <div
          style={{
            position: "absolute",
            top: 30,
            right: 30,
            fontFamily: "monospace",
            fontSize: 26,
            color: C.hudGreen,
            opacity: 0.8,
            textAlign: "right",
          }}
        >
          <div style={{ fontSize: 16, opacity: 0.6 }}>MISSION TIME</div>
          <div style={{ fontSize: 26 }}>{missionTime}</div>
        </div>
      )}

      {/* Bottom HUD bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 2,
          backgroundColor: C.hudGreen,
          opacity: 0.3,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          backgroundColor: C.hudGreen,
          opacity: 0.3,
        }}
      />
      {/* Side HUD bars */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: 2,
          backgroundColor: C.hudGreen,
          opacity: 0.15,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: 2,
          backgroundColor: C.hudGreen,
          opacity: 0.15,
        }}
      />
    </div>
  );
};
