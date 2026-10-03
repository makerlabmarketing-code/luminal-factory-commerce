"use client";
import { useTranslator } from "@/lib/i18n/client";

import { ErrorState } from "@/components/ui/feedback-states";
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const tr = useTranslator(); return <main className="section"><div className="container"><ErrorState /><p className="actions"><button className="button-link" type="button" onClick={reset}>{tr("Thử lại")}<span aria-hidden="true">↗</span></button></p></div></main>; }
