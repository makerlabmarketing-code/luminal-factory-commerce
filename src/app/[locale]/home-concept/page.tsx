import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { HomeScrollConcept } from "@/features/home/home-scroll-concept";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Connected Home — concept preview",
  robots: { index: false, follow: false },
};

export default function HomeConcept() {
  return <><Header /><HomeScrollConcept /><Footer /></>;
}
