import { Container } from "./container";
export function Section({ id, tone, children }: { id?: string; tone?: "surface"; children: React.ReactNode }) { return <section id={id} className={tone === "surface" ? "section section-surface" : "section"}><Container>{children}</Container></section>; }
