import { z } from "zod";

export const COMMERCE_ADMIN_API_VERSION = "v1" as const;
export const HOMEPAGE_HERO_ASSET_MAX_BYTES = 10 * 1024 * 1024;
export const COMMERCE_ADMIN_SCOPES = [
  "commerce.hero.read",
  "commerce.hero.write",
  "commerce.hero.publish",
] as const;

export type CommerceAdminScope = (typeof COMMERCE_ADMIN_SCOPES)[number];

export type CommerceAdminIdentity = Readonly<{
  subject: string;
  scopes: ReadonlySet<CommerceAdminScope>;
}>;

export interface CommerceAdminAuthorizer {
  authorize(
    request: Request,
    requiredScopes: readonly CommerceAdminScope[],
  ): Promise<CommerceAdminIdentity | null>;
}

const storagePath = z
  .string()
  .trim()
  .min(1)
  .max(512)
  .refine((value) => !value.startsWith("/"), "Storage paths must be relative.")
  .refine((value) => !value.includes("//"), "Storage paths must not contain empty segments.")
  .refine((value) => !/(^|\/)\.\.(\/|$)/.test(value), "Storage paths must not traverse parents.");

export const homepageHeroModelStoragePathSchema = storagePath.refine(
  (value) => /\.glb$/i.test(value),
  "Homepage Hero models must use GLB.",
);

export const homepageHeroPosterStoragePathSchema = storagePath.refine(
  (value) => /\.(webp|avif|png)$/i.test(value),
  "Homepage Hero posters must use WebP, AVIF or PNG.",
);

export const homepageHeroManagementInputSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    model_storage_path: homepageHeroModelStoragePathSchema,
    poster_storage_path: homepageHeroPosterStoragePathSchema.nullable().default(null),
    tint: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().default(null),
    exposure: z.number().min(0.4).max(2.5).default(1.08),
    shadow_intensity: z.number().min(0).max(2).default(1),
    shadow_softness: z.number().min(0).max(1).default(0.72),
    auto_rotate: z.boolean().default(true),
    auto_rotate_delay_ms: z.number().int().min(0).max(30_000).default(3_200),
    rotation_per_second_deg: z.number().min(0).max(30).default(5),
    camera_theta_deg: z.number().min(-360).max(360).default(0),
    camera_phi_deg: z.number().min(5).max(175).default(76),
    camera_radius_percent: z.number().min(50).max(250).default(104),
    camera_intro_radius_percent: z.number().min(50).max(250).default(122),
    camera_min_radius_percent: z.number().min(40).max(250).default(78),
    camera_max_radius_percent: z.number().min(50).max(300).default(155),
    camera_field_of_view_deg: z.number().min(10).max(70).default(29),
    camera_min_field_of_view_deg: z.number().min(8).max(70).default(22),
    camera_max_field_of_view_deg: z.number().min(10).max(90).default(42),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.camera_min_radius_percent > value.camera_radius_percent ||
      value.camera_radius_percent > value.camera_max_radius_percent
    ) {
      context.addIssue({ code: "custom", message: "Camera radius must stay inside its configured bounds." });
    }
    if (
      value.camera_min_field_of_view_deg > value.camera_field_of_view_deg ||
      value.camera_field_of_view_deg > value.camera_max_field_of_view_deg
    ) {
      context.addIssue({ code: "custom", message: "Camera field of view must stay inside its configured bounds." });
    }
  });

export const homepageHeroManagementMutationSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create_draft"), hero: homepageHeroManagementInputSchema }).strict(),
  z.object({ action: z.literal("update_draft"), id: z.uuid(), hero: homepageHeroManagementInputSchema }).strict(),
  z.object({ action: z.literal("publish"), id: z.uuid() }).strict(),
  z.object({ action: z.literal("unpublish"), id: z.uuid() }).strict(),
]);

export type HomepageHeroManagementInput = z.input<typeof homepageHeroManagementInputSchema>;
export type HomepageHeroManagementMutation = z.infer<typeof homepageHeroManagementMutationSchema>;
