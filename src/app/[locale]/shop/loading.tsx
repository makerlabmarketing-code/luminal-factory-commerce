import { shopPublicEnabled } from "@/features/shop/shop-public-gate";
import { ShopPaused } from "@/features/shop/shop-paused";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { DataRouteLoading } from "@/components/ui/data-route-loading";

export default function ShopLoading() {
  if (!shopPublicEnabled) return <ShopPaused />;
  return (
    <>
      <Header />
      <DataRouteLoading />
      <Footer />
    </>
  );
}
