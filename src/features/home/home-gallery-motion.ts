const entryProgress = 0.14;
const cardSpacing = 0.72;
const cardAngle = 0.67;
const angleStart = -1.65;
const angleTravel = 8.8;
const exitAngle = 7.72;
const flightDuration = 0.40;
const scrollDistanceRatio = 2.25;
const extraArrivalScroll = 0.45;
const extraSpiralScroll = 0.42;

export const galleryEntryViewportRatio = 0.88;
export const galleryCoverProgress = entryProgress + flightDuration * ((Math.PI - angleStart) / angleTravel);
export const galleryArrivalProgress = 0.662;
export const galleryStripEndProgress = 0.742;
export const galleryHeadingProgress = 0.89;
export const gallerySettleProgress = 0.99;

const spiralScrollStart = galleryCoverProgress * scrollDistanceRatio;
const spiralScrollSpan = (galleryStripEndProgress - galleryCoverProgress) * scrollDistanceRatio + extraSpiralScroll;
const arrivalScrollStart = spiralScrollStart + spiralScrollSpan;
const arrivalScrollSpan = (gallerySettleProgress - galleryStripEndProgress) * scrollDistanceRatio + extraArrivalScroll;
const settleScroll = arrivalScrollStart + arrivalScrollSpan;

export function getGalleryArrivalPadding(viewport: number, contentHeight: number) {
  const inset = Math.max(Math.min(88, viewport * 0.14), (viewport - contentHeight) / 2);
  return (settleScroll - galleryEntryViewportRatio) * viewport + inset;
}

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
  [3.14, 0.50], [4.71, 0.30], [5.45, 0.25], [6.1, 0.20],
  [6.65, 0.12], [7.02, 0.01], [7.48, -0.31], [8.1, -0.62],
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

function radiusFor(width: number, height: number) {
  const spread = mix(0.46, 0.50, ease(440, 1050, width));
  return Math.min(width, height * 2) * spread;
}
function cameraScale(angle: number) {
  const rearDepth = (1 + Math.cos(angle)) / 2;
  // Keep the foreground size at Meowhe and give the rear pass more distance.
  return (1.65 / 1.55) / (1 + 2.18 * rearDepth);
}

export function getGalleryProgress(sectionTop: number, viewport: number) {
  const distance = galleryEntryViewportRatio - sectionTop / viewport;
  if (distance <= spiralScrollStart) return clamp(distance / scrollDistanceRatio);
  if (distance <= arrivalScrollStart) {
    return mix(galleryCoverProgress, galleryStripEndProgress, (distance - spiralScrollStart) / spiralScrollSpan);
  }
  return clamp(galleryStripEndProgress + (distance - arrivalScrollStart) / arrivalScrollSpan
    * (gallerySettleProgress - galleryStripEndProgress));
}

export function getGallerySettleOffset(progress: number, viewport: number) {
  const distance = progress <= galleryStripEndProgress
    ? spiralScrollStart + (progress - galleryCoverProgress) / (galleryStripEndProgress - galleryCoverProgress) * spiralScrollSpan
    : arrivalScrollStart + (progress - galleryStripEndProgress) / (gallerySettleProgress - galleryStripEndProgress) * arrivalScrollSpan;
  return -Math.max(0, settleScroll - distance) * viewport;
}

export function getGalleryHeroPose(progress: number, meetAngle: number) {
  const travel = ease(0, 0.28, progress);
  return { travel, yaw: mix(meetAngle, 0, travel), visible: progress < galleryCoverProgress };
}

export function getGalleryCaptionOpacity(progress: number) {
  return ease(0.40, 0.54, progress) * (1 - ease(0.645, 0.704, progress));
}

export function getGalleryCoverWidth(width: number, height: number) {
  return 2 * Math.sin(cardAngle / 2) * radiusFor(width, height) * cameraScale(Math.PI);
}

export function getGalleryStripPanel(progress: number, index: number, width: number, height: number, slices: number) {
  const center = angleStart + (progress - entryProgress) / flightDuration * angleTravel - index * cardSpacing;
  if (center < -2 || center > exitAngle) return null;
  const radius = radiusFor(width, height);
  // Constant dimensions on the cylinder. Width and height share the camera scale.
  const halfHeight = radius * cardAngle / 3;
  const edges = Array.from({ length: slices + 1 }, (_, index) => {
    const angle = center + (index / slices - 0.5) * cardAngle;
    const zoom = cameraScale(angle);
    const exitSweep = ease(5.8, 7.6, angle) * width * 0.11;
    const lateral = Math.sin(angle);
    const shoulders = 1 + 0.20 * lateral ** 2;
    const x = width / 2 + lateral * radius * shoulders * zoom + exitSweep;
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
  const order = [0, 4, 2, 1, 5, 3];
  const start = galleryArrivalProgress + (order[index] ?? index) * 0.026;
  const travel = clamp((progress - start) / 0.18);
  // Let the edge appear promptly, then ease into the slot over the longer scroll.
  return 1 - (1 - travel) ** 2;
}

export function getGalleryCornerOffset(
  arrival: number,
  index: number,
  columns: number,
  rows: number,
  viewport: { width: number; height: number },
  slot: { x: number; y: number; width: number; height: number },
  settleOffset: number,
) {
  const column = index % columns;
  const row = Math.floor(index / columns);
  const side = Math.sign(column * 2 - (columns - 1)) || (row % 2 ? 1 : -1);
  const vertical = Math.sign(row * 2 - (rows - 1)) || (column % 2 ? 1 : -1);
  const margin = Math.ceil(Math.max(slot.width, slot.height) * 0.1);
  const edgeX = side < 0 ? -slot.width - margin : viewport.width + margin;
  const edgeY = vertical < 0 ? -slot.height - margin : viewport.height + margin;
  return {
    x: mix(edgeX - slot.x, 0, arrival),
    y: mix(edgeY - slot.y, settleOffset, arrival),
    tilt: (1 - arrival) * 6 * side * vertical || 0,
  };
}
