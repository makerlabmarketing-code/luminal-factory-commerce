export const galleryCoverProgress = 0.61;

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const mix = (from: number, to: number, progress: number) => from + (to - from) * progress;
function ease(start: number, end: number, progress: number) {
  const t = clamp((progress - start) / (end - start));
  return t * t * (3 - 2 * t);
}

export function getGalleryProgress(sectionTop: number, viewport: number) {
  return clamp((viewport * 0.88 - sectionTop) / (viewport * 1.76));
}

export function getGalleryHeroPose(progress: number, frontAngle: number) {
  const travel = ease(0, 0.32, progress);
  // Finish on a front view after a full turn from the mirrored Meet Meowhe angle.
  const turn = ease(0, 0.25, progress);
  const face = ease(0.24, 0.34, progress);
  return { travel, yaw: mix(frontAngle, frontAngle - 360, turn) - frontAngle * face, visible: progress < galleryCoverProgress };
}

export function getGalleryCardPose(progress: number, index: number, width: number, height: number, compact: boolean) {
  const column = index % 3 - 1;
  const delay = index * 0.023;
  const start = 0.24 + delay;
  const climb = clamp((progress - start) / 0.32);
  const phase = -1.45 - climb * 5.1;
  const radius = Math.min(width * 0.36, height * 0.63);
  const orbitX = mix(-width * 0.38, Math.sin(phase) * radius, ease(0, 0.44, climb));
  const orbitY = mix(height * 0.44, -height * 0.08, ease(0, 0.95, climb)) - climb * Math.sin(phase) * height * 0.07;
  const depth = Math.cos(phase);
  const orbitWidth = Math.min(width * (compact ? 0.42 : 0.30), height * 0.47) * mix(0.65, 1.25, (depth + 1) / 2);

  const cover = ease(0.46 + delay * 0.22, 0.595 + delay * 0.10, progress);
  const lift = ease(0.612 + delay * 0.23, 0.821 + delay * 0.18, progress);
  const settle = ease(0.735 + delay * 0.40, 0.90 + delay * 0.56, progress);
  const lead = index === 1;
  const middle = index < 3;
  const coverX = column * Math.min(width * 0.32, height * 0.52);
  const coverWidth = lead ? Math.min(width * 0.88, height * 0.82) : Math.min(width * 0.36, height * 0.60);
  const liftX = coverX + lift * width * (0.15 + column * 0.064);
  const liftY = coverX * 0.19 - (middle ? 0 : height * 0.105) - lift * (height * 0.50 + coverX * 0.39);
  return {
    x: mix(orbitX, liftX, cover),
    y: mix(orbitY, liftY, cover),
    width: mix(orbitWidth, mix(coverWidth, orbitWidth * 0.80, lift), cover),
    yaw: mix(48 * Math.sin(phase), column * 4 - 36 * lift, cover),
    roll: mix(11 + 13 * Math.sin(phase), mix(11, -24, lift), cover),
    opacity: ease(start, start + 0.06, progress),
    layer: cover > 0.6 ? (lead ? 39 : middle ? 36 : 27) : (depth >= 0 ? 33 : 27),
    settle,
  };
}
