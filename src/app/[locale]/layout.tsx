import { publicSiteUrl } from "@/lib/site-url";
import type { Metadata } from "next";
import { LuminalMotionLayer } from "@/components/motion/luminal-motion-layer";
import "../globals.css";
import "../hero-blend.css";
import { notFound } from 'next/navigation';
import { LocaleProvider } from '@/lib/i18n/client';
import { isLocale, publicLocales, languageAlternates } from '@/lib/i18n/locale';



const metadata: Metadata = {
  metadataBase: new URL(publicSiteUrl),
  title: { default: "Luminal Factory — Artisan objects", template: "%s — Luminal Factory" },
  description: "Explore artisan keycaps, sculpted characters and collectible objects by Luminal Factory.",
  openGraph: { type: "website", locale: "en_US", siteName: "Luminal Factory", title: "Luminal Factory — Artisan objects", description: "Artisan keycaps and collectible objects crafted with intention." },
  robots: { index: process.env.VERCEL_ENV === "production", follow: process.env.VERCEL_ENV === "production" },
};

export function generateStaticParams() { return publicLocales.map(locale => ({ locale })); }
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const title = locale === 'vi' ? 'Luminal Factory — Vật thể artisan' : 'Luminal Factory — Artisan objects';
  const description = locale === 'vi' ? 'Khám phá artisan keycap, nhân vật và vật thể sưu tầm của Luminal Factory.' : 'Explore artisan keycaps, sculpted characters and collectible objects by Luminal Factory.';
  return { ...metadata, title: { default: title, template: '%s — Luminal Factory' }, description, alternates: languageAlternates('/', locale), openGraph: { ...metadata.openGraph, title, description, locale: locale === 'vi' ? 'vi_VN' : 'en_US' } };
}
export default async function RootLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <html lang={locale}><body><LocaleProvider locale={locale}><LuminalMotionLayer />{children}</LocaleProvider></body></html>;
}
