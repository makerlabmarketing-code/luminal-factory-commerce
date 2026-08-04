import type { Metadata } from "next";
import "./globals.css";

const baseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL;

export const metadata: Metadata = {
  metadataBase: baseUrl ? new URL(baseUrl) : undefined,
  title: { default: "Luminal Factory — Vật thể thủ công", template: "%s — Luminal Factory" },
  description: "Xưởng sáng tạo artisan keycap, nhân vật 3D và vật thể sưu tầm giới hạn.",
  openGraph: { type: "website", locale: "vi_VN", siteName: "Luminal Factory", title: "Luminal Factory — Vật thể thủ công", description: "Artisan keycap, nhân vật 3D và vật thể sưu tầm được tạo tác có chủ đích." },
  robots: { index: process.env.VERCEL_ENV === "production", follow: process.env.VERCEL_ENV === "production" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}
