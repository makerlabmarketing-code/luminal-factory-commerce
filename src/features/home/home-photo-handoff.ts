export function getHomePhotoHandoffProgress(sectionTop: number, viewportHeight: number) {
  return clamp01((viewportHeight * 0.88 - sectionTop) / (viewportHeight * 0.60));
}

export function getHeroPhotoMotion(sectionTop: number, viewportHeight: number) {
  // The photo and resin keep their own timeline. Meowhe travels over a
  // longer scroll distance, with a readable front-facing beat before fading.
  const progress = clamp01((viewportHeight * 0.88 - sectionTop) / (viewportHeight * 0.82));
  return {
    travel: smoothstep(progress / 0.78),
    faceFront: smoothstep(progress / 0.56),
    opacity: 1 - smoothstep((progress - 0.76) / 0.24),
  };
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(value: number) {
  const progress = clamp01(value);
  return progress * progress * (3 - 2 * progress);
}
