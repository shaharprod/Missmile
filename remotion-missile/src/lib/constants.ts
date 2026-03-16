// Cities
export const TEHRAN = { lng: 51.389, lat: 35.689, name: "טהרן" };
export const TEL_AVIV = { lng: 34.782, lat: 32.085, name: "תל אביב" };
export const BAGHDAD = { lng: 44.366, lat: 33.313, name: "בגדד" };
export const DAMASCUS = { lng: 36.292, lat: 33.513, name: "דמשק" };
export const AMMAN = { lng: 35.945, lat: 31.955, name: "עמאן" };
export const BEIRUT = { lng: 35.502, lat: 33.894, name: "ביירות" };
export const RIYADH = { lng: 46.675, lat: 24.714, name: "ריאד" };
export const CAIRO = { lng: 31.236, lat: 30.044, name: "קהיר" };
export const ANKARA = { lng: 32.860, lat: 39.926, name: "אנקרה" };
export const ISFAHAN = { lng: 51.678, lat: 32.655, name: "אספהאן" };
export const HAIFA = { lng: 34.989, lat: 32.794, name: "חיפה" };
export const JERUSALEM = { lng: 35.217, lat: 31.769, name: "ירושלים" };

export type CityRole = "capital" | "major" | "minor";
export type CityDef = { lng: number; lat: number; name: string; role: CityRole; color?: string };

export const ALL_CITIES: CityDef[] = [
  { ...TEHRAN, role: "capital", color: "#cc2233" },
  { ...TEL_AVIV, role: "capital", color: "#1a5c3a" },
  { ...BAGHDAD, role: "capital" },
  { ...DAMASCUS, role: "capital" },
  { ...AMMAN, role: "capital" },
  { ...BEIRUT, role: "capital" },
  { ...RIYADH, role: "capital" },
  { ...CAIRO, role: "capital" },
  { ...ANKARA, role: "capital" },
  { ...ISFAHAN, role: "major" },
  { ...HAIFA, role: "major" },
  { ...JERUSALEM, role: "major" },
];

// Background cities (dimmer, for context in map scenes)
export const BG_CITIES: CityDef[] = [
  { ...BAGHDAD, role: "capital", color: "#8898a8" },
  { ...DAMASCUS, role: "capital", color: "#8898a8" },
  { ...AMMAN, role: "capital", color: "#8898a8" },
  { ...ISFAHAN, role: "major", color: "#8898a8" },
  { ...JERUSALEM, role: "major", color: "#8898a8" },
  { ...HAIFA, role: "major", color: "#8898a8" },
  { ...CAIRO, role: "capital", color: "#8898a8" },
  { ...ANKARA, role: "capital", color: "#8898a8" },
  { ...BEIRUT, role: "capital", color: "#8898a8" },
];

// Map bounds (Middle East region)
export const MAP_BOUNDS = {
  west: 29,
  east: 56,
  north: 42,
  south: 24,
};

// Composition
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const FPS = 24;

// Scene durations (frames at 24fps)
export const SCENE_TITLE = 84; // 3.5s
export const SCENE_TEHRAN = 120; // 5s
export const SCENE_LAUNCH = 168; // 7s
export const SCENE_TRAVEL = 168; // 7s
export const SCENE_RADAR = 120; // 5s
export const SCENE_INTERCEPT = 360; // 15s
export const SCENE_ENDCARD = 312; // 13s (8s content + 5s hold before fade)
export const TRANSITION_FRAMES = 12;

export const TOTAL_FRAMES =
  SCENE_TITLE +
  SCENE_TEHRAN +
  SCENE_LAUNCH +
  SCENE_TRAVEL +
  SCENE_RADAR +
  SCENE_INTERCEPT +
  SCENE_ENDCARD -
  6 * TRANSITION_FRAMES;

// Colors - Daylight theme
export const C = {
  bg: "#d8e4ef",
  land: "#c4b9a0",
  landStroke: "#a89878",
  iranFill: "#e0c8b0",
  israelFill: "#b0d8b8",
  water: "#88b8d8",
  waterStroke: "#6898b8",
  waterGlow: "#78a8c8",
  river: "#6898b8",
  grid: "#b8c8d8",
  gridBright: "#a0b0c0",
  gridLabel: "#8898a8",
  missile: "#cc2222",
  missileGlow: "#ee4422",
  interceptor: "#228844",
  interceptorGlow: "#44aa66",
  cityMarker: "#cc8800",
  hudGreen: "#1a5c3a",
  hudRed: "#cc2233",
  hudAmber: "#b88400",
  explosion: "#ffcc00",
  white: "#ffffff",
};
