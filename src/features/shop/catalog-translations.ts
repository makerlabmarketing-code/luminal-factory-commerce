import "server-only";
import { z } from "zod";
import { translationContentSchema, translationLocaleSchema } from "@/features/management/translation-contract";
import type { Locale } from "@/lib/i18n/locale";
import type { ShopPresentationEntry } from "./shop-content";

const publicRowSchema = z.object({ product_id: z.uuid(), variant_id: z.null(), locale: translationLocaleSchema, content: translationContentSchema }).strict();
type PublicTranslation = z.infer<typeof publicRowSchema>;
export function applyApprovedTranslation(entry: ShopPresentationEntry, locale: Locale, rows: readonly PublicTranslation[]): ShopPresentationEntry {
  const preferred = rows.find(row => row.product_id === entry.id && row.locale === locale && row.variant_id === null)?.content;
  const english = rows.find(row => row.product_id === entry.id && row.locale === "en" && row.variant_id === null)?.content;
  const text = (key: keyof NonNullable<typeof preferred>) => preferred?.[key]?.trim() || english?.[key]?.trim();
  return { ...entry, title: text("title") || entry.title, description: text("description") || entry.description,
    story: text("story") || entry.story, seoTitle: text("seoTitle") || undefined,
    seoDescription: text("seoDescription") || undefined,
    media: { ...entry.media, alt: text("primaryMediaAlt") || entry.media.alt } };
}
export async function localizeCatalogEntries(entries: readonly ShopPresentationEntry[], locale: Locale,
  config: { url: string; publishableKey: string } | null): Promise<readonly ShopPresentationEntry[]> {
  if (process.env.COMMERCE_CATALOG_TRANSLATIONS_ENABLED !== "true" || !config || !entries.length) return entries;
  const ids = entries.filter(entry => entry.dataSource === "commerce-catalog" && z.uuid().safeParse(entry.id).success).map(entry => entry.id);
  if (!ids.length) return entries;
  const endpoint = new URL(`${config.url}/rest/v1/catalog_translation_public`);
  endpoint.searchParams.set("select", "product_id,variant_id,locale,content");
  endpoint.searchParams.set("product_id", `in.(${ids.join(",")})`);
  endpoint.searchParams.set("variant_id", "is.null");
  endpoint.searchParams.set("locale", locale === "en" ? "eq.en" : "in.(en,vi)");
  endpoint.searchParams.set("limit", String(ids.length * 2));
  try {
    const response = await fetch(endpoint, { headers: { Accept: "application/json", apikey: config.publishableKey }, cache: "no-store" });
    if (!response.ok) return entries;
    const parsed = z.array(publicRowSchema).max(ids.length * 2).safeParse(await response.json());
    if (!parsed.success || parsed.data.some(row => !ids.includes(row.product_id))) return entries;
    const keys = parsed.data.map(row => `${row.product_id}:${row.locale}`);
    if (new Set(keys).size !== keys.length) return entries;
    return entries.map(entry => applyApprovedTranslation(entry, locale, parsed.data));
  } catch { return entries; }
}
