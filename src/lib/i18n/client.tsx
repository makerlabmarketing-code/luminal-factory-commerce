'use client';
import { createContext, useContext } from 'react';
import type { Locale } from './locale';
import { translator } from './translations';
const LocaleContext = createContext<Locale>('en');
export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}
export function useLocale() { return useContext(LocaleContext); }
export function useTranslator() { return translator(useLocale()); }
