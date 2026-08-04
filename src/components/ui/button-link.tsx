import Link from "next/link";
import { cn } from "@/lib/utils";
export function ButtonLink({ href, children, variant = "primary" }: { href: string; children: React.ReactNode; variant?: "primary" | "secondary" }) { return <Link href={href} className={cn("button-link", variant === "secondary" && "button-secondary")}>{children}<span aria-hidden="true">↗</span></Link>; }
