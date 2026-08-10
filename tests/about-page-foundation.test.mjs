import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("About route uses typed presentation content and one page h1", () => {
  const page = read("src/app/about/page.tsx");
  const presentation = read("src/features/about/about-presentation.tsx");
  const content = read("src/features/about/about-content.ts");

  assert.match(page, /getAboutPresentation/);
  assert.match(page, /AboutPresentation/);
  assert.equal((presentation.match(/<h1/g) ?? []).length, 1);
  assert.match(content, /Shaped by light\. Crafted to last\./);
});

test("About navigation is a real route and Home keeps a teaser link", () => {
  const navigation = read("src/components/layout/navigation.ts");
  const home = read("src/app/page.tsx");

  assert.match(navigation, /href: "\/about"/);
  assert.doesNotMatch(navigation, /href: "#about"/);
  assert.match(home, /href="\/about"/);
  assert.match(home, /Tìm hiểu về Luminal/);
});

test("Footer uses the approved Luminal brand line and retires the legacy slogan", () => {
  const footer = read("src/components/layout/footer.tsx");

  assert.match(footer, /Shaped by light\./);
  assert.match(footer, /Crafted to last\./);
  assert.doesNotMatch(footer, /Made slowly\.|Made to stay\./);
});

test("About foundation remains static and non-operational", () => {
  const combined = [
    read("src/app/about/page.tsx"),
    read("src/features/about/about-content.ts"),
    read("src/features/about/about-presentation.tsx"),
  ].join("\n");

  assert.doesNotMatch(combined, /supabase|insert\(|update\(|delete\(|fetch\(|api\/commission-inquiry/i);
  assert.doesNotMatch(combined, /testimonial|award|client logo|employee count|founding year/i);
});
