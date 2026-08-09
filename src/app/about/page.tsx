import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Container } from "@/components/ui/container";
import { getAboutPresentation } from "@/features/about/about-content";
import { AboutPresentation } from "@/features/about/about-presentation";

export const metadata: Metadata = {
  title: "About | Luminal Factory",
  description:
    "Tìm hiểu Luminal Factory, studio nhỏ tập trung vào artisan keycap, collectible object, 3D form development và commission được review theo từng scope.",
};

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
