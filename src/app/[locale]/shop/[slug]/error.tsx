'use client';
import { useTranslator } from '@/lib/i18n/client';
export default function ProductError({ reset }: { reset: () => void }) {
  const tr = useTranslator();
  return <section className="feedback-state" role="alert"><h1>{tr('We could not load this object.')}</h1><button type="button" onClick={reset}>{tr('Try again')}</button></section>;
}
