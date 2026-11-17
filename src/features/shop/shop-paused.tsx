import Link from "@/lib/i18n/link";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Container } from "@/components/ui/container";
import { getLocale } from "@/lib/i18n/server";

export async function ShopPaused() {
  const vi = (await getLocale()) === "vi";
  return (
    <>
      <Header />
      <main id="main-content" className="shop-route min-h-[68svh]" data-shop-paused="true">
        <Container>
          <section className="shop-route-hero mx-auto max-w-4xl py-16 md:py-28" aria-labelledby="shop-paused-title">
            <p className="eyebrow">{vi ? "LUMINAL / RAFFLE TRƯỚC" : "LUMINAL / RAFFLE FIRST"}</p>
            <h1 id="shop-paused-title" className="mt-6">{vi ? "Shop tạm đóng." : "Shop is on pause."}</h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed">{vi
              ? "Hiện tại Luminal tập trung vào các đợt raffle. Hãy xem lịch phát hành và bộ sưu tập Meowhe."
              : "We're focusing on raffle releases for now. Explore announced raffles or revisit the Meowhe archive."}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="button-link" href="/raffle">{vi ? "Khám phá Raffle" : "Explore Raffles"}</Link>
              <Link className="button-link button-secondary" href="/archive">{vi ? "Xem Archive" : "View Archive"}</Link>
            </div>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}
