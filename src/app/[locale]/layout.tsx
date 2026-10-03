import type { Metadata } from "next";
import { LuminalMotionLayer } from "@/components/motion/luminal-motion-layer";
import "../globals.css";
import "../hero-blend.css";
import { notFound } from 'next/navigation';
import { LocaleProvider } from '@/lib/i18n/client';
import { isLocale, locales, languageAlternates } from '@/lib/i18n/locale';

const baseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL;

const metadata: Metadata = {
  metadataBase: baseUrl ? new URL(baseUrl) : undefined,
  title: { default: "Luminal Factory — Vật thể thủ công", template: "%s — Luminal Factory" },
  description: "Xưởng sáng tạo artisan keycap, nhân vật 3D và vật thể sưu tầm giới hạn.",
  openGraph: { type: "website", locale: "vi_VN", siteName: "Luminal Factory", title: "Luminal Factory — Vật thể thủ công", description: "Artisan keycap, nhân vật 3D và vật thể sưu tầm được tạo tác có chủ đích." },
  robots: { index: process.env.VERCEL_ENV === "production", follow: process.env.VERCEL_ENV === "production" },
};

export function generateStaticParams() { return locales.map(locale => ({ locale })); }
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const title = locale === 'vi' ? 'Luminal Factory — Vật thể artisan' : 'Luminal Factory — Artisan objects';
  const description = locale === 'vi' ? 'Khám phá artisan keycap, nhân vật và vật thể sưu tầm của Luminal Factory.' : 'Explore artisan keycaps, sculpted characters and collectible objects by Luminal Factory.';
  return { ...metadata, title: { default: title, template: '%s — Luminal Factory' }, description, alternates: languageAlternates('/', locale), openGraph: { ...metadata.openGraph, title, description, locale: locale === 'vi' ? 'vi_VN' : 'en_US', alternateLocale: locale === 'vi' ? 'en_US' : 'vi_VN' } };
}
export default async function RootLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <html lang={locale}><body><LocaleProvider locale={locale}><LuminalMotionLayer />{children}</LocaleProvider></body></html>;
}
