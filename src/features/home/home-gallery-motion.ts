const entryProgress = 0.18;
const cardInterval = 0.035;
const flightDuration = 0.44;
const centerOfFlight = 0.64;
const scrollDistanceRatio = 1.76;

export const galleryCoverCardIndex = 6;
export const galleryCoverProgress = entryProgress + galleryCoverCardIndex * cardInterval + flightDuration * centerOfFlight;
export const gallerySettleProgress = 0.97;
export const galleryEntryViewportRatio = 0.88;

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const mix = (from: number, to: number, progress: number) => from + (to - from) * progress;

function ease(start: number, end: number, progress: number) {
  const t = clamp((progress - start) / (end - start));
  return t * t * (3 - 2 * t);
}

// Screen-space waypoints relative to the center of section 3's viewport.
// The strip rises along the far side, rounds the right edge, then crosses the foreground.
const galleryArc = [
  { at: 0, x: -0.35, y: 0.60, yaw: -74, roll: -29 },
  { at: 0.10, x: -0.33, y: 0.39, yaw: -49, roll: -32 },
  { at: 0.24, x: -0.10, y: 0.24, yaw: -16, roll: -17 },
  { at: 0.38, x: 0.30, y: 0.20, yaw: 19, roll: -2 },
  { at: 0.48, x: 0.36, y: 0.16, yaw: 60, roll: 13 },
  { at: 0.55, x: 0.25, y: 0.09, yaw: 36, roll: 19 },
  { at: centerOfFlight, x: 0, y: 0, yaw: 0, roll: 12 },
  { at: 0.76, x: -0.29, y: -0.14, yaw: -25, roll: 11 },
  { at: 0.84, x: -0.33, y: -0.31, yaw: -55, roll: -4 },
  { at: 0.93, x: -0.09, y: -0.46, yaw: -22, roll: -17 },
  { at: 1, x: 0.24, y: -0.57, yaw: 14, roll: -12 },
] as const;

type ArcProperty = "x" | "y" | "yaw" | "roll";

// Hermite interpolation keeps the velocity continuous at each waypoint.
function sampleArc(segment: number, progress: number, property: ArcProperty) {
  const from = galleryArc[segment];
  const to = galleryArc[segment + 1];
  const before = galleryArc[Math.max(0, segment - 1)];
  const after = galleryArc[Math.min(galleryArc.length - 1, segment + 2)];
  const span = to.at - from.at;
  const t = (progress - from.at) / span;
  const m0 = (to[property] - before[property]) / (to.at - before.at) * span;
  const m1 = (after[property] - from[property]) / (after.at - from.at) * span;
  return (2 * t ** 3 - 3 * t ** 2 + 1) * from[property]
    + (t ** 3 - 2 * t ** 2 + t) * m0
    + (-2 * t ** 3 + 3 * t ** 2) * to[property]
    + (t ** 3 - t ** 2) * m1;
}

export function getGalleryProgress(sectionTop: number, viewport: number) {
  return clamp((viewport * galleryEntryViewportRatio - sectionTop) / (viewport * scrollDistanceRatio));
}

export function getGallerySettleOffset(progress: number, viewport: number) {
  // An early card lands at its final viewport position while the others catch up.
  return -Math.max(0, gallerySettleProgress - progress) * viewport * scrollDistanceRatio;
}

export function getGalleryHeroPose(progress: number, meetAngle: number) {
  const travel = ease(0, 0.32, progress);
  return { travel, yaw: mix(meetAngle, 0, travel), visible: progress < galleryCoverProgress };
}

export function getGalleryCoverWidth(width: number, height: number) {
  return Math.min(width * 0.76, height * 0.72);
}

export function getGalleryCardPose(progress: number, index: number, width: number, height: number, compact: boolean) {
  const delay = index * cardInterval;
  const start = entryProgress + delay;
  const flight = clamp((progress - start) / flightDuration);
  const next = galleryArc.findIndex(point => point.at > flight);
  const segment = next < 0 ? galleryArc.length - 2 : next - 1;
  const arcWidth = Math.min(width, height * (compact ? 1.35 : 1.85));
  const growth = ease(0.03, centerOfFlight, flight);
  const foreground = flight >= 0.48 && flight < 0.85;
  const coveringCard = index === galleryCoverCardIndex;
  const nearCenter = ease(0.50, 0.61, flight) * (1 - ease(0.68, 0.88, flight));
  const baseWidth = mix(Math.min(width * 0.092, height * 0.13), Math.min(width * (compact ? 0.42 : 0.26), height * 0.49), growth);
  const settle = ease(0.65 + delay * 0.60, 0.805 + delay * 0.54, progress);
  const lift = ease(0.82, 1, flight);

  return {
    x: sampleArc(segment, flight, "x") * arcWidth,
    y: sampleArc(segment, flight, "y") * height,
    width: mix(mix(baseWidth, getGalleryCoverWidth(width, height), coveringCard ? nearCenter : 0), baseWidth * 0.78, lift),
    yaw: sampleArc(segment, flight, "yaw") * (compact ? 0.83 : 1),
    roll: sampleArc(segment, flight, "roll"),
    opacity: ease(0, 0.095, flight),
    layer: coveringCard && nearCenter > 0.8 ? 39 : foreground ? 33 + Math.round(4 * (1 - Math.abs(flight - centerOfFlight))) : 27,
    settle,
  };
}
