import Link from "next/link";
import { EmptyState } from "@/components/ui/feedback-states";
export default function NotFound() { return <main className="section"><div className="container"><EmptyState title="Không tìm thấy trang" description="Không gian này chưa tồn tại hoặc đã được di chuyển." /><p className="actions"><Link className="button-link" href="/">Trở về xưởng <span aria-hidden="true">↗</span></Link></p></div></main>; }
