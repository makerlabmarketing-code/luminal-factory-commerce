const entryProgress = 0.14;
const cardSpacing = 0.72;
const cardAngle = 0.67;
const angleStart = -1.65;
const angleTravel = 8.8;
const flightDuration = 0.40;
const scrollDistanceRatio = 2.25;

export const galleryEntryViewportRatio = 0.88;
export const galleryCoverProgress = entryProgress + flightDuration * ((Math.PI - angleStart) / angleTravel);
export const gallerySettleProgress = 0.99;
export const galleryArrivalProgress = 0.84;

type Point = readonly [number, number];
type Quad = readonly [Point, Point, Point, Point];

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const mix = (from: number, to: number, progress: number) => from + (to - from) * progress;
function ease(start: number, end: number, progress: number) {
  const t = clamp((progress - start) / (end - start));
  return t * t * (3 - 2 * t);
}

// The centerline rises as the photos orbit the same cylinder.
const rise = [
  [-2, 1.30], [-1.65, 1.17], [-0.8, 0.88], [0, 0.74], [1.57, 0.67],
  [3.14, 0.50], [4.71, 0.27], [6.0, -0.22], [7.65, -0.6],
] as const;

function centerHeight(angle: number) {
  const next = rise.findIndex(([at]) => at > angle);
  if (next === 0) return rise[0][1];
  if (next === -1) return rise[rise.length - 1][1];
  const [x0, y0] = rise[next - 1];
  const [x1, y1] = rise[next];
  const [beforeX, beforeY] = rise[Math.max(0, next - 2)];
  const [afterX, afterY] = rise[Math.min(rise.length - 1, next + 1)];
  const span = x1 - x0;
  const u = (angle - x0) / span;
  const m0 = (y1 - beforeY) / (x1 - beforeX) * span;
  const m1 = (afterY - y0) / (afterX - x0) * span;
  return mix(y0, y1, u * u * (3 - 2 * u))
    + u * (1 - u) * ((1 - u) * m0 - u * m1);
}

const radiusFor = (width: number, height: number) => Math.min(width, height * 1.85) * 0.43;
const cameraScale = (angle: number) => 1.65 / (2.55 + Math.cos(angle));

export function getGalleryProgress(sectionTop: number, viewport: number) {
  return clamp((viewport * galleryEntryViewportRatio - sectionTop) / (viewport * scrollDistanceRatio));
}

export function getGallerySettleOffset(progress: number, viewport: number) {
  return -Math.max(0, gallerySettleProgress - progress) * viewport * scrollDistanceRatio;
}

export function getGalleryHeroPose(progress: number, meetAngle: number) {
  const travel = ease(0, 0.28, progress);
  return { travel, yaw: mix(meetAngle, 0, travel), visible: progress < galleryCoverProgress };
}

export function getGalleryCoverWidth(width: number, height: number) {
  return 2 * Math.sin(cardAngle / 2) * radiusFor(width, height) * cameraScale(Math.PI);
}

export function getGalleryStripPanel(progress: number, index: number, width: number, height: number, slices: number) {
  const center = angleStart + (progress - entryProgress) / flightDuration * angleTravel - index * cardSpacing;
  if (center < -2 || center > 7.15) return null;
  const radius = radiusFor(width, height);
  // Constant dimensions on the cylinder. Width and height share the camera scale.
  const halfHeight = radius * cardAngle / 3;
  const edges = Array.from({ length: slices + 1 }, (_, index) => {
    const angle = center + (index / slices - 0.5) * cardAngle;
    const zoom = cameraScale(angle);
    const x = width / 2 + Math.sin(angle) * radius * zoom;
    const y = height * centerHeight(angle);
    return { x, top: y - halfHeight * zoom, bottom: y + halfHeight * zoom };
  });
  return edges.slice(0, -1).map((first, index) => {
    const last = edges[index + 1];
    const angle = center + ((index + 0.5) / slices - 0.5) * cardAngle;
    const depth = -Math.cos(angle);
    const [left, right] = first.x <= last.x ? [first, last] : [last, first];
    const corners: Quad = [[left.x, left.top], [right.x, right.top], [right.x, right.bottom], [left.x, left.bottom]];
    return {
      corners,
      // Keep the artwork readable on each side of the turn.
      slice: first === left ? index : slices - 1 - index,
      layer: depth > 0 ? 31 + Math.round(depth * 15) : 5 + Math.round((1 + depth) * 20),
    };
  });
}

// Both vertical edges are straight. A projective CSS transform preserves their
// differing heights and meets the next panel at the exact same projected edge.
export function getGalleryPanelTransform(corners: Quad, slot: { x: number; y: number; width: number; height: number }) {
  const [[x0, y0], [x1, y1], [, y2], [, y3]] = corners;
  const leftHeight = y3 - y0;
  const rightHeight = y2 - y1;
  const perspective = leftHeight / rightHeight - 1;
  const x = x0 - slot.x;
  const y = y0 - slot.y;
  const a = ((x1 - slot.x) * (1 + perspective) - x) / slot.width;
  const b = ((y1 - slot.y) * (1 + perspective) - y) / slot.width;
  return `matrix3d(${a},${b},0,${perspective / slot.width},0,${leftHeight / slot.height},0,0,0,0,1,0,${x},${y},0,1)`;
}

export function getGalleryArrival(progress: number, index: number) {
  const start = galleryArrivalProgress + index * 0.008;
  return ease(start, start + 0.082, progress);
}
