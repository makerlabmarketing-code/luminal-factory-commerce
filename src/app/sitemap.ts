import type { MetadataRoute } from 'next';
import { locales, localeHref } from '@/lib/i18n/locale';
// Private account/cart, test raffles and unapproved fixture slugs are excluded.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_BASE_URL;
  if (!base || process.env.VERCEL_ENV !== 'production') return [];
  const paths = ['/', '/raffle', '/archive', '/shop', '/commission', '/about'];
  return paths.flatMap(path => locales.map(locale => ({
    url: new URL(localeHref(path, locale), base).href,
    alternates: { languages: Object.fromEntries(locales.map(language => [language, new URL(localeHref(path, language), base).href])) },
  })));
}
