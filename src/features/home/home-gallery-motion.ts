const entryProgress = 0.14;
const cardInterval = 0.033;
const flightDuration = 0.40;
const scrollDistanceRatio = 1.76;

export const galleryEntryViewportRatio = 0.88;
export const galleryCoverProgress = entryProgress + flightDuration * 0.54;
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

// Position along the strip, horizontal offset, vertical offset and panel height.
// Each panel takes the next section of these same two rails.
const arc = [
  [-0.10, -0.36, 0.76, 0.05],
  [0, -0.35, 0.58, 0.08],
  [0.15, -0.24, 0.37, 0.12],
  [0.30, 0.19, 0.24, 0.16],
  [0.40, 0.36, 0.18, 0.24],
  [0.47, 0.25, 0.07, 0.34],
  [0.54, 0, 0, 0.40],
  [0.63, -0.28, -0.08, 0.34],
  [0.73, -0.32, -0.26, 0.24],
  [0.85, -0.08, -0.54, 0.15],
  [1.05, 0.22, -0.80, 0.09],
] as const;

function sampleArc(t: number, axis: 1 | 2 | 3) {
  const p = Math.max(arc[0][0], Math.min(arc[arc.length - 1][0], t));
  const next = arc.findIndex(point => point[0] > p);
  const i = next === -1 ? arc.length - 2 : next - 1;
  const a = arc[i];
  const b = arc[i + 1];
  const before = arc[Math.max(0, i - 1)];
  const after = arc[Math.min(arc.length - 1, i + 2)];
  const span = b[0] - a[0];
  const u = (p - a[0]) / span;
  const m0 = (b[axis] - before[axis]) / (b[0] - before[0]) * span;
  const m1 = (after[axis] - a[axis]) / (after[0] - a[0]) * span;
  return (2 * u ** 3 - 3 * u ** 2 + 1) * a[axis] + (u ** 3 - 2 * u ** 2 + u) * m0
    + (-2 * u ** 3 + 3 * u ** 2) * b[axis] + (u ** 3 - u ** 2) * m1;
}

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
  return Math.min(width, height * 1.85) * 0.29;
}

export function getGalleryStripPanel(progress: number, index: number, width: number, height: number) {
  const center = (progress - entryProgress - index * cardInterval) / flightDuration;
  if (center < 0 || center > 1) return null;
  const span = cardInterval / flightDuration;
  const edge = (t: number): readonly [Point, Point] => {
    const x = width / 2 + sampleArc(t, 1) * Math.min(width, height * 1.85);
    const y = height / 2 + sampleArc(t, 2) * height;
    const half = sampleArc(t, 3) * Math.min(height, width * 0.82) / 2;
    return [[x, y - half], [x, y + half]];
  };
  const first = edge(center - span / 2);
  const last = edge(center + span / 2);
  const [left, right] = first[0][0] <= last[0][0] ? [first, last] : [last, first];
  const corners: Quad = [left[0], right[0], right[1], left[1]];
  const layer = center >= 0.42 && center < 0.72 ? 34 + Math.round(5 * (1 - Math.abs(center - 0.54) / 0.2)) : 27;
  return { corners, layer };
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
