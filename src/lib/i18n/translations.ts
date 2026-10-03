import type { Locale } from './locale';
import dictionary from './copy.json';
// Only reviewed presentation strings are translated; catalog identity and facts remain authoritative.
export const copy: Record<string, readonly string[]> = dictionary;
export function translator(locale: Locale) {
  return (source: string): string => copy[source]?.[locale === 'vi' ? 1 : 0] ?? source;
}
