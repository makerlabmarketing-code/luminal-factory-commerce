import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Container } from "@/components/ui/container";
import { RaffleDiscovery } from "@/features/raffle/raffle-discovery";
import { getRafflePresentation } from "@/features/raffle/raffle-content";

export const metadata: Metadata = {
  title: "Raffle | Luminal Factory",
  description: "Khám phá raffle release hiện tại hoặc sắp tới của Luminal Factory trước khi entry flow được mở.",
};

export default function RafflePage() {
  const content = getRafflePresentation();

  return (
    <>
      <Header />
      <main id="main-content">
        <Container>
          <RaffleDiscovery content={content} />
        </Container>
      </main>
      <Footer />
    </>
  );
}
