import { languageAlternates } from "@/lib/i18n/locale";
import { getLocale } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Container } from "@/components/ui/container";
import { getAboutPresentation } from "@/features/about/about-content";
import { AboutPresentation } from "@/features/about/about-presentation";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: locale === "vi" ? "V\u1ec1 Luminal" : "About", description: locale === "vi" ? "T\u00ecm hi\u1ec3u Luminal Factory, studio \u0111\u1ed9c l\u1eadp t\u1ea1o t\u00e1c artisan keycap v\u00e0 v\u1eadt th\u1ec3 s\u01b0u t\u1ea7m." : "Meet Luminal Factory, an independent studio creating artisan keycaps and collectible objects.", alternates: languageAlternates("/about", locale) };
}

export default function AboutPage() {
  const content = getAboutPresentation();

  return (
    <>
      <Header />
      <main id="main-content">
        <Container>
          <AboutPresentation content={content} />
        </Container>
      </main>
      <Footer />
    </>
  );
}
