
import { getTranslator } from "@/lib/i18n/server";
import Link from "@/lib/i18n/link";
import { EmptyState } from "@/components/ui/feedback-states";
export default async function NotFound() {
  const tr = await getTranslator(); return <main className="section"><div className="container"><EmptyState title={tr("Không tìm thấy trang")} description={tr("Không gian này chưa tồn tại hoặc đã được di chuyển.")} /><p className="actions"><Link className="button-link" href="/">{tr("Trở về xưởng")}<span aria-hidden="true">↗</span></Link></p></div></main>; }
