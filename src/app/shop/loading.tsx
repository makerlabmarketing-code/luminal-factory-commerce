import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { DataRouteLoading } from "@/components/ui/data-route-loading";

export default function ShopLoading() {
  return (
    <>
      <Header />
      <DataRouteLoading />
      <Footer />
    </>
  );
}
