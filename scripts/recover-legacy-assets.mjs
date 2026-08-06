#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";

const ROOT = "https://adelina-builder-wzacpt1wtxwbfh5y.hostingersite.com/";
const ROOT_HOST = new URL(ROOT).hostname;
const OUTPUT = "assets/source/lazyfactory/recovered";
const INVENTORY = "docs/assets/legacy-asset-inventory.json";
const MAX_PAGES = 40;
const MAX_ASSETS = 400;
const CONCURRENCY = 3;
const TIMEOUT_MS = 15_000;
const RETRIES = 2;

const pageQueue = [ROOT, new URL("robots.txt", ROOT).href, new URL("sitemap.xml", ROOT).href];
const visitedPages = new Set();
const discoveredAssets = new Map();

function canonicalize(rawUrl) {
  const url = new URL(rawUrl, ROOT);
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (/token|signature|credential|expires|auth|key/i.test(key)) url.searchParams.delete(key);
  }
  return url.href;
}

async function request(url) {
  let lastError;
  for (let attempt = 0; attempt <= RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        headers: { "user-agent": "LuminalFactoryAssetInventory/1.0" },
        redirect: "follow",
        signal: controller.signal,
      });
      clearTimeout(timer);
      return response;
    } catch (error) {
      clearTimeout(timer);
      lastError = error;
      if (attempt < RETRIES) await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
    }
  }
  throw lastError;
}

function extractUrls(body, pageUrl) {
  const found = new Set();
  const patterns = [
    /(?:src|href|poster|content)=["']([^"']+)["']/gi,
    /(?:srcset)=["']([^"']+)["']/gi,
    /url\(\s*["']?([^"')]+)["']?\s*\)/gi,
    /https?:\\?\/\\?\/[^\s"'<>)}]+/gi,
  ];
  for (const pattern of patterns) {
    for (const match of body.matchAll(pattern)) {
      const candidates = match[1] ? match[1].split(",").map((part) => part.trim().split(/\s+/)[0]) : [match[0].replaceAll("\\/", "/")];
      for (const candidate of candidates) {
        if (!candidate || /^(data:|mailto:|tel:|javascript:|#)/i.test(candidate)) continue;
        try { found.add(canonicalize(new URL(candidate, pageUrl).href)); } catch { /* malformed references are not followed */ }
      }
    }
  }
  return [...found];
}

function looksLikeAsset(url) {
  return /\.(?:avif|gif|jpe?g|png|svg|webp|mp4|m4v|mov|webm)(?:\?|$)/i.test(url);
}

function safeFileName(url, hash, mimeType) {
  const sourceName = basename(new URL(url).pathname).toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
  const mimeExtension = new Map([["image/jpeg", ".jpg"], ["image/png", ".png"], ["image/webp", ".webp"], ["image/avif", ".avif"], ["image/gif", ".gif"], ["image/svg+xml", ".svg"], ["video/mp4", ".mp4"], ["video/webm", ".webm"]]).get(mimeType);
  const extension = mimeExtension ?? extname(sourceName) ?? "";
  const stem = sourceName.replace(/\.[a-z0-9]+$/, "").replace(/^-+|-+$/g, "") || `unknown-${hash.slice(0, 12)}`;
  return `lazyfactory-${stem}${extension}`;
}

async function crawlPage(pageUrl) {
  const canonicalPage = canonicalize(pageUrl);
  if (visitedPages.has(canonicalPage) || visitedPages.size >= MAX_PAGES) return;
  visitedPages.add(canonicalPage);
  const response = await request(canonicalPage);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${canonicalPage}`);
  const body = await response.text();
  for (const url of extractUrls(body, canonicalPage)) {
    const parsed = new URL(url);
    if (looksLikeAsset(url)) {
      if (discoveredAssets.size < MAX_ASSETS && !discoveredAssets.has(url)) discoveredAssets.set(url, canonicalPage);
    } else if (parsed.hostname === ROOT_HOST && visitedPages.size + pageQueue.length < MAX_PAGES && !visitedPages.has(url)) {
      pageQueue.push(url);
    }
  }
}

async function downloadAsset([sourceUrl, sourcePage]) {
  try {
    const response = await request(sourceUrl);
    const mimeType = (response.headers.get("content-type") ?? "application/octet-stream").split(";")[0].toLowerCase();
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    if (!/^(image|video)\//.test(mimeType)) throw new Error(`unexpected content type ${mimeType}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const fileName = safeFileName(sourceUrl, sha256, mimeType);
    const type = mimeType.startsWith("video/") ? "video" : "image";
    const localPath = join(OUTPUT, type === "video" ? "video" : "images", fileName);
    await mkdir(join(OUTPUT, type === "video" ? "video" : "images"), { recursive: true });
    await writeFile(localPath, bytes);
    return {
      id: `legacy-${sha256.slice(0, 16)}`, fileName, originalFileName: basename(new URL(sourceUrl).pathname) || null,
      type, mimeType, extension: extname(fileName).slice(1), bytes: bytes.length, sourceUrl, sourcePage,
      source: new URL(sourceUrl).hostname === ROOT_HOST ? "legacy-hostinger-page" : "legacy-cdn",
      sourceBrand: "lazyfactory-historical", contentRole: type === "video" ? "video" : "unknown",
      approval: "production-review-required", recoveryQuality: "transformed-variant", localPath, sha256,
      duplicateOf: null, preferredVariant: false, historicalBrand: true, ownerApproved: false,
      productionApproved: false, destinationCandidate: "review-required", altTextDraft: null,
      notes: "Recovered from a public historical page; identity, dimensions, transformation status, rights, and alt text require review.",
      downloadStatus: "downloaded", httpStatus: response.status,
    };
  } catch (error) {
    return {
      id: `legacy-inaccessible-${createHash("sha256").update(sourceUrl).digest("hex").slice(0, 16)}`,
      type: "unknown", sourceUrl, sourcePage, source: "legacy-cdn", sourceBrand: "lazyfactory-historical",
      contentRole: "unknown", approval: "unknown", recoveryQuality: "inaccessible", localPath: null,
      sha256: null, duplicateOf: null, preferredVariant: false, historicalBrand: true, ownerApproved: false,
      productionApproved: false, destinationCandidate: "none", altTextDraft: null,
      notes: error instanceof Error ? error.message : "Download failed", downloadStatus: "failed",
    };
  }
}

async function main() {
  await mkdir(OUTPUT, { recursive: true });
  while (pageQueue.length && visitedPages.size < MAX_PAGES) await crawlPage(pageQueue.shift());
  const entries = [...discoveredAssets.entries()].sort(([a], [b]) => a.localeCompare(b));
  const records = [];
  for (let index = 0; index < entries.length; index += CONCURRENCY) {
    records.push(...await Promise.all(entries.slice(index, index + CONCURRENCY).map(downloadAsset)));
  }
  const byHash = new Map();
  for (const record of records) {
    if (!record.sha256) continue;
    if (byHash.has(record.sha256)) record.duplicateOf = byHash.get(record.sha256);
    else { byHash.set(record.sha256, record.id); record.preferredVariant = true; }
  }
  const inventory = {
    schemaVersion: 1, generatedAt: new Date().toISOString(), sourceSite: ROOT,
    policy: { historicalBrand: "lazyfactory-historical", defaultProductionApproved: false },
    summary: { pagesCrawled: visitedPages.size, assetUrlsDiscovered: entries.length, downloaded: records.filter((r) => r.downloadStatus === "downloaded").length, failed: records.filter((r) => r.downloadStatus === "failed").length },
    records: records.sort((a, b) => a.sourceUrl.localeCompare(b.sourceUrl)),
  };
  await mkdir("docs/assets", { recursive: true });
  await writeFile(INVENTORY, `${JSON.stringify(inventory, null, 2)}\n`);
  await writeFile(join(OUTPUT, "crawl-pages.json"), `${JSON.stringify([...visitedPages].sort(), null, 2)}\n`);
  await readFile(INVENTORY, "utf8");
}

await main();
