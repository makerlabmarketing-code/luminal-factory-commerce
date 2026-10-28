import { publicSiteUrl } from '@/lib/site-url';
import type { MetadataRoute } from 'next';
import { publicLocales, localeHref } from '@/lib/i18n/locale';
// Private account/cart, test raffles and unapproved fixture slugs are excluded.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = publicSiteUrl;
  if (process.env.VERCEL_ENV !== 'production') return [];
  const paths = ['/', '/raffle', '/archive', '/shop', '/commission', '/about', '/support'];
  return paths.flatMap(path => publicLocales.map(locale => ({
    url: new URL(localeHref(path, locale), base).href,
    alternates: { languages: { en: new URL(localeHref(path, locale), base).href } },
  })));
}
