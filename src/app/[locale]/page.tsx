import { Footer } from "@/components/layout/footer";

// Keep the Homepage request-bound: do not freeze the currently published Hero at build time.
export const dynamic = "force-dynamic";
import { HomePage } from "@/features/home/home-page";

export default function Home() {
  return <><HomePage /><Footer /></>;
}
