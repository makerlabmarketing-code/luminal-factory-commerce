import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Container } from "@/components/ui/container";
import { CommissionDiscovery } from "@/features/commission/commission-discovery";
import { getCommissionPresentation } from "@/features/commission/commission-content";

export const metadata: Metadata = {
  title: "Commission | Luminal Factory",
  description: "Khám phá hướng commission artisan và collectible object của Luminal Factory trước khi inquiry workflow được mở.",
};

export default function CommissionPage() {
  const content = getCommissionPresentation();

  return (
    <>
      <Header />
      <main id="main-content">
        <Container>
          <CommissionDiscovery content={content} />
        </Container>
      </main>
      <Footer />
    </>
  );
}
