import type { Locale } from './locale';
import { translator } from './translations';
// For repository-owned presentation fixtures only; never run on persisted catalog rows.
const textKeys = new Set(['eyebrow','title','description','label','copy','story','collection','summary','statusLabel','statusDescription','releaseTitle','releaseStory','materialNote','availabilityLabel','availabilityDescription','trustNotes','preparationItems','expectationItems']);
export function localizePresentation<T extends object>(value: T, locale: Locale): T {
  const tr = translator(locale);
  function visit(item: unknown, key = ''): unknown {
    if (typeof item === 'string') return textKeys.has(key) ? tr(item) : item;
    if (Array.isArray(item)) return item.map(child => visit(child, key));
    if (item && typeof item === 'object') return Object.fromEntries(Object.entries(item).map(([name, child]) => [name, visit(child, name)]));
    return item;
  }
  // Text keys change strings only; identifiers, URLs, enum fields and structure are retained.
  return visit(value) as T;
}
