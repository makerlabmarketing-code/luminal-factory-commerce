import { languageAlternates } from "@/lib/i18n/locale";
import { getLocale } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Container } from "@/components/ui/container";
import { CommissionDiscovery } from "@/features/commission/commission-discovery";
import { getCommissionPresentation } from "@/features/commission/commission-content";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: locale === "vi" ? "Commission" : "Commission", description: locale === "vi" ? "Kh\u00e1m ph\u00e1 commission v\u1eadt th\u1ec3 theo y\u00eau c\u1ea7u v\u00e0 chia s\u1ebb \u00fd t\u01b0\u1edfng v\u1edbi Luminal Factory." : "Explore custom object commissions and share your idea with Luminal Factory.", alternates: languageAlternates("/commission", locale) };
}

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
