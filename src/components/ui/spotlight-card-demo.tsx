import { GlowCard } from "./spotlight-card";

export function Default() {
  return <div className="flex min-h-screen flex-wrap items-center justify-center gap-10 p-6">
    <GlowCard glowColor="blue"><p className="p-6">Blue spotlight</p></GlowCard>
    <GlowCard glowColor="purple"><p className="p-6">Purple spotlight</p></GlowCard>
    <GlowCard glowColor="orange"><p className="p-6">Orange spotlight</p></GlowCard>
  </div>;
}
