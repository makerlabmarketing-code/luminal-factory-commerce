import { locale } from 'next/root-params';
import { defaultLocale, isLocale } from './locale';
import { translator } from './translations';
export async function getLocale() {
  const current = await locale();
  return isLocale(current) ? current : defaultLocale;
}
export async function getTranslator() { return translator(await getLocale()); }
