"use client";

import { useTranslator } from "@/lib/i18n/client";
export function Skeleton() { return <div className="skeleton" aria-hidden="true" />; }
export function EmptyState({ title, description }: { title: string; description: string }) { return <div className="feedback-state"><h2>{title}</h2><p>{description}</p></div>; }
export function ErrorState({ title = "Không thể tải nội dung" }: { title?: string }) {
  const tr = useTranslator(); return <div className="feedback-state" role="alert"><h2>{title}</h2><p>{tr("Vui lòng thử lại sau.")}</p></div>; }
