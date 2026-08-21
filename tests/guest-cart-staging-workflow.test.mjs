import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workflow = readFileSync(".github/workflows/phase6-guest-cart-staging.yml", "utf8");
const plan = readFileSync(
  "specs/commerce/phase6-guest-cart-staging-ci-runner-technical-plan.md",
  "utf8",
);

test("staging smoke workflow is manual-only, serialized and read-only", () => {
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /\n\s+(?:push|pull_request|schedule):/);
  assert.match(workflow, /permissions:\s*\n\s+contents: read/);
  assert.match(workflow, /group: commerce-phase6-guest-cart-staging/);
  assert.match(workflow, /cancel-in-progress: false/);
});

test("enabled smoke requires explicit confirmation and uses the reviewed verifier", () => {
  assert.match(workflow, /inputs\.mode == 'enabled' && inputs\.confirm_writes != true/);
  assert.match(workflow, /I_UNDERSTAND_THIS_CREATES_AND_DELETES_ONE_STAGING_CART/);
  assert.match(workflow, /npm run verify:guest-cart-staging -- --mode=\$\{\{ inputs\.mode \}\}/);
  assert.match(workflow, /COMMERCE_GUEST_CART_STAGING_URL: \$\{\{ inputs\.staging_url \}\}/);
});

test("operator credentials stay in GitHub Actions secrets and never become public variables", () => {
  assert.match(workflow, /secrets\.VERCEL_AUTOMATION_BYPASS_SECRET/);
  assert.match(workflow, /secrets\.COMMERCE_SUPABASE_SECRET_KEY/);
  assert.doesNotMatch(workflow, /NEXT_PUBLIC_[A-Z0-9_]*(?:SECRET|BYPASS|SERVICE_ROLE)/);
  assert.doesNotMatch(workflow, /(?:sb_secret_|eyJ[a-zA-Z0-9_-]{20,})/);
  assert.match(plan, /Do not put either value in workflow inputs/);
});
