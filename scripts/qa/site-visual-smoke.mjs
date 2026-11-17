import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const base = "https://luminalfactory.com/en";
const output = "artifacts/visual-smoke";
const sizes = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet-landscape", width: 1024, height: 768 },
  { name: "tablet-portrait", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
];
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const report = [];
let failed = false;

async function visit(context, route, size) {
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message.slice(0, 180)));
  await page.goto(base + route, { waitUntil: "domcontentloaded", timeout: 45_000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  const info = await page.evaluate(() => ({
    horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth,
    title: document.title,
    href: location.pathname,
  }));
  assert.ok(info.horizontalOverflow <= 5, `${route} ${size.name} overflowed horizontally by ${info.horizontalOverflow}px`);
  return { page, errors, info };
}

async function capture(page, name) {
  await page.screenshot({ path: `${output}/${name}.png`, animations: "disabled" });
}

try {
  for (const size of sizes) {
    const context = await browser.newContext({
      viewport: { width: size.width, height: size.height },
      deviceScaleFactor: 1,
      reducedMotion: size.name === "tablet-portrait" ? "reduce" : "no-preference",
    });

    // Homepage: first fold and the light crossing the actual sticky Making header.
    {
      const { page, info, errors } = await visit(context, "", size);
      await capture(page, `home-hero-${size.name}`);
      const making = page.locator("[data-made-at-luminal-header]");
      await making.scrollIntoViewIfNeeded({ timeout: 20_000 });
      await page.waitForTimeout(400);
      const bg = await making.evaluate((node) => getComputedStyle(node).backgroundColor);
      assert.match(bg, /^rgba?\(/);
      assert.ok(!["rgb(10, 10, 10)", "rgb(0, 0, 0)"].includes(bg),
        `Making header still has an opaque background: ${bg}`);
      await capture(page, `home-making-${size.name}`);
      report.push({ route: "/", viewport: size.name, headerBackground: bg, ...info, pageErrors: errors });
      await page.close();
    }

    // Archive: see both tent entrance and the three real photographed colorways.
    {
      const { page, info, errors } = await visit(context, "/archive", size);
      await capture(page, `archive-stage-${size.name}`);
      const stage = page.locator("#meowhe-stage");
      const colorwayLinks = stage.locator('a[href*="/archive/meowhe-"]');
      assert.equal(await colorwayLinks.count(), 3, "Expected exactly three Meowhe colorway links");
      await colorwayLinks.first().scrollIntoViewIfNeeded();
      const images = await colorwayLinks.locator("img").evaluateAll((nodes) =>
        nodes.map((image) => Math.round(image.getBoundingClientRect().width)));
      assert.ok(images.length === 3 && images.every((width) => width >= 90),
        `Colorway thumbnails too small at ${size.name}: ${JSON.stringify(images)}`);
      const lightBg = await stage.locator('[class*="stageLight"]').evaluate((node) => getComputedStyle(node).backgroundImage);
      assert.ok(!lightBg.includes("conic-gradient"), "Misaligned directional spotlight has returned");
      await capture(page, `archive-colorways-${size.name}`);
      report.push({ route: "/archive", viewport: size.name, colorwayWidths: images, ...info, pageErrors: errors });
      await page.close();
    }

    // Shop is guest-readable and must never advertise checkout as already working.
    {
      const { page, info, errors } = await visit(context, "/shop", size);
      assert.equal(await page.locator("main.shop-route").count(), 1, "Shop route missing");
      assert.equal(await page.locator('[data-shop-paused="true"]').count(), 1, "Shop must be paused while raffle-first");
      assert.equal(await page.locator(".shop-route-card").count(), 0, "A paused Shop must not render product cards");
      assert.equal(await page.locator('a[href$="/raffle"]').count() > 0, true, "Shop pause screen must link to Raffle");
      assert.equal(await page.locator('nav a[href$="/shop"]').count(), 0, "Shop must not appear in public navigation");
      const featured = page.locator(".shop-route-section--featured");
      if (await featured.count() === 1 && await featured.locator(".shop-route-image img").count() > 0) {
        // Real approved catalog image must decode without a manual scroll or a fixture fallback.
        await page.waitForFunction(() => {
          const image = document.querySelector(".shop-route-card--featured .shop-route-image img");
          return image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0;
        }, null, { timeout: 15_000 });
      }
      await capture(page, `shop-${size.name}`);
      let productFirst = false;
      let productImageWidth = null;
      if (await featured.count() === 1) {
        const filters = page.locator(".shop-route-filters");
        const positions = await page.evaluate(() => {
          const product = document.querySelector(".shop-route-section--featured");
          const filters = document.querySelector(".shop-route-filters");
          return {
            productTop: product.getBoundingClientRect().top + scrollY,
            filtersTop: filters.getBoundingClientRect().top + scrollY,
          };
        });
        assert.ok(positions.productTop < positions.filtersTop, "Single published object must appear before search filters");
        const details = filters.locator("details");
        assert.equal(await details.evaluate((el) => el.open), false, "Filters should start collapsed on a small unfiltered catalog");
        productImageWidth = Math.round(await featured.locator(".shop-route-image").first()
          .evaluate((element) => element.getBoundingClientRect().width));
        assert.ok(productImageWidth >= Math.min(250, size.width * .65),
          "A featured keycap photo must not shrink to a tiny thumbnail");
        await featured.scrollIntoViewIfNeeded();
        await capture(page, `shop-product-${size.name}`);
        await details.locator("summary").click();
        assert.equal(await details.evaluate((el) => el.open), true, "Filters must remain operable");
        assert.equal(await details.locator('input[name="q"]').count(), 1, "Search input missing");
        productFirst = true;
      }
      report.push({ route: "/shop", viewport: size.name, productFirst, productImageWidth, ...info, pageErrors: errors });
      await page.close();
    }

    // Guest Raffle is the active discovery surface, even if no release is currently published.
    {
      const { page, info, errors } = await visit(context, "/raffle", size);
      assert.equal(await page.locator("#raffle-title").count(), 1, "Raffle discovery heading missing");
      assert.equal(await page.locator('nav a[href$="/shop"]').count(), 0, "Shop still shown in navigation");
      await capture(page, `raffle-${size.name}`);
      report.push({ route: "/raffle", viewport: size.name, ...info, pageErrors: errors });
      await page.close();
    }
    // Direct public Shop bookmarks (including product details) remain safe and reversible.
    {
      const { page, info, errors } = await visit(context, "/shop/meowhe-lolipop", size);
      assert.equal(await page.locator('[data-shop-paused="true"]').count(), 1, "Deep-linked Shop object must respect public pause");
      await capture(page, `shop-paused-detail-${size.name}`);
      report.push({ route: "/shop/meowhe-lolipop", viewport: size.name, ...info, pageErrors: errors });
      await page.close();
    }

    await context.close();
  }
} catch (error) {
  failed = true;
  report.push({ status: "FAIL", error: error instanceof Error ? error.message : String(error) });
} finally {
  await browser.close();
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2) + "\n");
}
for (const entry of report) {
  process.stdout.write(JSON.stringify(entry) + "\n");
}
if (failed) process.exitCode = 1;
else process.stdout.write("LUMINAL_VISUAL_SMOKE_PASS: 5 routes, 4 viewports, 28+ screenshots; CSS and responsive geometry checked.\n");
