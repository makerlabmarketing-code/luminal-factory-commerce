'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { localeCookie, localeHref, locales, type Locale } from '@/lib/i18n/locale';
import { useLocale } from '@/lib/i18n/client';
// Cookie changes happen only after an explicit language selection.
function rememberLocale(value: Locale) {
  document.cookie = `${localeCookie}=${value}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
}
function LanguageSwitcherContent({ onSelect }: { onSelect?: () => void }) {
  const locale = useLocale();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [suffix, setSuffix] = useState('');
  useEffect(() => {
    const update = () => setSuffix(window.location.hash);
    update(); window.addEventListener('hashchange', update); window.addEventListener('popstate', update);
    return () => { window.removeEventListener('hashchange', update); window.removeEventListener('popstate', update); };
  }, [pathname]);
  function remember(value: Locale) {
    rememberLocale(value);
    onSelect?.();
  }
  return <nav className="language-switcher" aria-label={locale === 'vi' ? 'Ngôn ngữ' : 'Language'}>
    {locales.map(value => <Link key={value} href={localeHref(pathname ?? '/', value) + (search ? `?${search}` : '') + suffix} hrefLang={value} lang={value} aria-current={locale === value ? 'page' : undefined} onClick={() => remember(value)}>{value.toUpperCase()}</Link>)}
  </nav>;
}

export function LanguageSwitcher(props: { onSelect?: () => void }) {
  return <Suspense fallback={null}><LanguageSwitcherContent {...props} /></Suspense>;
}
