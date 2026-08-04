"use client";
import { ErrorState } from "@/components/ui/feedback-states";
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <main className="section"><div className="container"><ErrorState /><p className="actions"><button className="button-link" type="button" onClick={reset}>Thử lại <span aria-hidden="true">↗</span></button></p></div></main>; }
