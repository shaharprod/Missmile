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
  { ...TEHRAN, role: "capital", color: "#ff3344" },
  { ...TEL_AVIV, role: "capital", color: "#00ff88" },
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
  { ...BAGHDAD, role: "capital", color: "#1e3a55" },
  { ...DAMASCUS, role: "capital", color: "#1e3a55" },
  { ...AMMAN, role: "capital", color: "#1e3a55" },
  { ...ISFAHAN, role: "major", color: "#1e3a55" },
  { ...JERUSALEM, role: "major", color: "#1e3a55" },
  { ...HAIFA, role: "major", color: "#1e3a55" },
  { ...CAIRO, role: "capital", color: "#1e3a55" },
  { ...ANKARA, role: "capital", color: "#1e3a55" },
  { ...BEIRUT, role: "capital", color: "#1e3a55" },
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
export const FPS = 30;

// Scene durations (frames)
export const SCENE_TITLE = 105; // 3.5s - opening title card
export const SCENE_TEHRAN = 150; // 5s
export const SCENE_LAUNCH = 210; // 7s - more time for launcher close-up + launch
export const SCENE_TRAVEL = 210; // 7s
export const SCENE_INTERCEPT = 450; // 15s - full interception + debris fall
export const TRANSITION_FRAMES = 15;

export const TOTAL_FRAMES =
  SCENE_TITLE +
  SCENE_TEHRAN +
  SCENE_LAUNCH +
  SCENE_TRAVEL +
  SCENE_INTERCEPT -
  4 * TRANSITION_FRAMES;

// Colors
export const C = {
  bg: "#0a0e1a",
  land: "#141e30",
  landStroke: "#1e3050",
  iranFill: "#2a1520",
  israelFill: "#152a1a",
  water: "#060d18",
  waterStroke: "#0a1828",
  waterGlow: "#0a2040",
  river: "#0a1828",
  grid: "#0d1825",
  gridBright: "#152535",
  gridLabel: "#1e3050",
  missile: "#ff3333",
  missileGlow: "#ff6644",
  interceptor: "#33ff66",
  interceptorGlow: "#66ffaa",
  cityMarker: "#ffaa00",
  hudGreen: "#00ff88",
  hudRed: "#ff3344",
  hudAmber: "#ffaa00",
  explosion: "#ffcc00",
  white: "#ffffff",
};
