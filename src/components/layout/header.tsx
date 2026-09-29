import { HomeArrivalHeader } from "@/features/home/home-arrival-header";

export function Header() {
  return <><HomeArrivalHeader immersive={false} /><div className="route-header-spacer" aria-hidden="true" /></>;
}
