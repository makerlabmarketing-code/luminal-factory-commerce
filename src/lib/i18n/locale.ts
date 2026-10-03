export const locales = ['en', 'vi'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';
export const localeCookie = 'luminal_locale';
export function isLocale(value: unknown): value is Locale { return value === 'en' || value === 'vi'; }
export function splitLocale(path: string): { locale: Locale | null; path: string } {
  const match = /^\/(en|vi)(?=\/|$)/.exec(path);
  return { locale: match ? match[1] as Locale : null, path: match ? path.slice(match[0].length) || '/' : path };
}
export function localeHref(href: string, locale: Locale): string {
  if (!href.startsWith('/') || href.startsWith('//') || /^\/(api|_next)(\/|$)/.test(href)) return href;
  const boundary = href.search(/[?#]/);
  const path = boundary < 0 ? href : href.slice(0, boundary);
  const suffix = boundary < 0 ? '' : href.slice(boundary);
  const bare = splitLocale(path).path;
  return `/${locale}${bare === '/' ? '' : bare}${suffix}`;
}
export function languageAlternates(path: string, locale: Locale) {
  return { canonical: localeHref(path, locale), languages: { en: localeHref(path, 'en'), vi: localeHref(path, 'vi'), 'x-default': localeHref(path, 'en') } };
}
