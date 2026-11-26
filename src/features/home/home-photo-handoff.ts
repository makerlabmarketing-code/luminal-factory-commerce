export function getHomePhotoHandoffProgress(sectionTop: number, viewportHeight: number) {
  return Math.max(0, Math.min(1, (viewportHeight * 0.88 - sectionTop) / (viewportHeight * 0.60)));
}
