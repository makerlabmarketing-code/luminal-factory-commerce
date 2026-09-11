export type HeroModelPresentation = Readonly<{
  modelSrc: string;
  tint: string | null;
  exposure: number;
  shadowIntensity: number;
  shadowSoftness: number;
  autoRotate: boolean;
  autoRotateDelayMs: number;
  rotationPerSecondDeg: number;
  camera: Readonly<{
    thetaDeg: number;
    phiDeg: number;
    radiusPercent: number;
    introRadiusPercent: number;
    minRadiusPercent: number;
    maxRadiusPercent: number;
    fieldOfViewDeg: number;
    minFieldOfViewDeg: number;
    maxFieldOfViewDeg: number;
  }>;
}>;

export const defaultHeroModelPresentation: HeroModelPresentation = {
  modelSrc: "/models/meowhe-hero.glb",
  tint: null,
  exposure: 1.08,
  shadowIntensity: 1,
  shadowSoftness: 0.72,
  autoRotate: true,
  autoRotateDelayMs: 3200,
  rotationPerSecondDeg: 5,
  camera: {
    thetaDeg: 0,
    phiDeg: 76,
    radiusPercent: 104,
    introRadiusPercent: 122,
    minRadiusPercent: 78,
    maxRadiusPercent: 155,
    fieldOfViewDeg: 29,
    minFieldOfViewDeg: 22,
    maxFieldOfViewDeg: 42,
  },
};
