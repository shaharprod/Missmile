import { MAP_BOUNDS } from "./constants";

// Project longitude/latitude to SVG coordinates
export const project = (
  lng: number,
  lat: number,
  w: number,
  h: number,
): [number, number] => {
  const x =
    ((lng - MAP_BOUNDS.west) / (MAP_BOUNDS.east - MAP_BOUNDS.west)) * w;
  const y =
    ((MAP_BOUNDS.north - lat) / (MAP_BOUNDS.north - MAP_BOUNDS.south)) * h;
  return [x, y];
};

// Convert polygon points to SVG path string
export const polygonToPath = (
  points: [number, number][],
  w: number,
  h: number,
): string => {
  return points
    .map((p, i) => {
      const [x, y] = project(p[0], p[1], w, h);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ") + " Z";
};

// Convert polyline points to SVG path string (open path, no closing Z)
export const polylineToPath = (
  points: [number, number][],
  w: number,
  h: number,
): string => {
  return points
    .map((p, i) => {
      const [x, y] = project(p[0], p[1], w, h);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
};

// Linear interpolation between two geo points
export const lerpGeo = (
  from: { lng: number; lat: number },
  to: { lng: number; lat: number },
  t: number,
): { lng: number; lat: number } => ({
  lng: from.lng + (to.lng - from.lng) * t,
  lat: from.lat + (to.lat - from.lat) * t,
});
