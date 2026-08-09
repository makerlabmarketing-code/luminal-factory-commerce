import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Container } from "@/components/ui/container";
import { CommissionDiscovery } from "@/features/commission/commission-discovery";
import { getCommissionPresentation } from "@/features/commission/commission-content";

export const metadata: Metadata = {
  title: "Commission | Luminal Factory",
  description: "Khám phá hướng commission artisan và collectible object của Luminal Factory và gửi context để studio review khi inquiry transport khả dụng.",
};

function isCommissionInquiryEnabled() {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() &&
    process.env.COMMISSION_INQUIRY_FROM_EMAIL?.trim() &&
    process.env.COMMISSION_INQUIRY_TO_EMAIL?.trim(),
  );
}

export default function CommissionPage() {
  const content = getCommissionPresentation();
  const inquiryEnabled = isCommissionInquiryEnabled();

  return (
    <>
      <Header />
      <main id="main-content">
        <Container>
          <CommissionDiscovery content={content} inquiryEnabled={inquiryEnabled} />
        </Container>
      </main>
      <Footer />
    </>
  );
}
