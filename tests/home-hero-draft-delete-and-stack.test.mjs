import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (file) => readFileSync(file, "utf8");

test("each collapsed folder label carries its own divider without duplicate overlay separators", () => {
  const stack = read("src/features/home/made-at-luminal-stack.tsx");
  assert.match(stack, /flex h-\[1\.1rem\] items-start border-b/);
  assert.match(stack, /border-white\/20 opacity-100/);
  assert.match(stack, /border-transparent opacity-0/);
  assert.doesNotMatch(stack, /key=\{`separator-\$\{step\.number\}\`\}/);
});

test("draft deletion is HMAC authorized and can never delete the published row or GLB assets", () => {
  const route = read("src/app/api/admin/v1/homepage-hero/[id]/delete/route.ts");
  assert.match(route, /authorizeCommerceAdminRoute\(request, \["commerce\.hero\.write"\]\)/);
  assert.match(route, /homepageHeroPublishMutationSchema\.safeParse\(body\)/);
  assert.match(route, /\.eq\("is_active", false\)/);
  assert.match(route, /\.is\("published_at", null\)/);
  assert.match(route, /\.select\("id"\)/);
  assert.doesNotMatch(route, /storage\.from\(|storage\.remove\(/);
});

test("drag is limited to cursor-primary button, does not capture pointer, and preserves no-auto-rotate choice", () => {
  const stage = read("src/features/home/hero-object-stage.tsx");
  assert.match(stage, /event\.button !== 0/);
  assert.match(stage, /HERO_DRAG_YAW_MAX_DEG = 40/);
  assert.match(stage, /HERO_DRAG_PHI_MIN_DEG = 48/);
  assert.match(stage, /HERO_DRAG_PHI_MAX_DEG = 90/);
  assert.match(stage, /draggingPointerId !== null/);
  assert.match(stage, /if \(presentation\.autoRotate\) viewerRef\.current\?\.removeAttribute\("auto-rotate"\)/);
  assert.match(stage, /if \(presentation\.autoRotate && !reducedMotion\) viewerRef\.current\?\.setAttribute\("auto-rotate", ""\)/);
  assert.doesNotMatch(stage, /setPointerCapture/);
});
