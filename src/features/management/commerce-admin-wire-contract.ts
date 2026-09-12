import { z } from "zod";

const homepageHeroSettingsSchema = z
  .object({
    tint: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
    exposure: z.number().min(0.4).max(2.5).optional(),
    shadowIntensity: z.number().min(0).max(2).optional(),
    shadowSoftness: z.number().min(0).max(1).optional(),
    autoRotate: z.boolean().optional(),
    autoRotateDelayMs: z.number().int().min(0).max(30_000).optional(),
    rotationPerSecondDeg: z.number().min(0).max(30).optional(),
    cameraThetaDeg: z.number().min(-360).max(360).optional(),
    cameraPhiDeg: z.number().min(5).max(175).optional(),
    cameraRadiusPercent: z.number().min(50).max(250).optional(),
    cameraIntroRadiusPercent: z.number().min(50).max(250).optional(),
    cameraMinRadiusPercent: z.number().min(40).max(250).optional(),
    cameraMaxRadiusPercent: z.number().min(50).max(300).optional(),
    cameraFieldOfViewDeg: z.number().min(10).max(70).optional(),
    cameraMinFieldOfViewDeg: z.number().min(8).max(70).optional(),
    cameraMaxFieldOfViewDeg: z.number().min(10).max(90).optional(),
  })
  .strict();

export const homepageHeroDraftMutationSchema = z
  .object({
    operationId: z.uuid(),
    draft: z
      .object({
        name: z.string().trim().min(1).max(120),
        modelStoragePath: z.string().trim().min(1).max(512),
        posterStoragePath: z.string().trim().min(1).max(512).nullable().optional(),
        settings: homepageHeroSettingsSchema.optional(),
      })
      .strict(),
  })
  .strict();

export const homepageHeroPublishMutationSchema = z.object({ operationId: z.uuid() }).strict();

export type HomepageHeroDraftMutationWire = z.infer<typeof homepageHeroDraftMutationSchema>;
export type HomepageHeroPublishMutationWire = z.infer<typeof homepageHeroPublishMutationSchema>;
