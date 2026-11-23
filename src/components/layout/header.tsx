import { HomeArrivalHeader } from "@/features/home/home-arrival-header";

export function Header({ rafflePreview = false }: Readonly<{ rafflePreview?: boolean }>) {
  return <><HomeArrivalHeader immersive={false} rafflePreview={rafflePreview} /><div className="route-header-spacer" aria-hidden="true" /></>;
}
