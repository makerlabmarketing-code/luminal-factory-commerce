
import { getLocale, getTranslator } from "@/lib/i18n/server";
import { getStudioCopy } from "@/features/studio/studio-copy";
import Image from "next/image";
import Link from "@/lib/i18n/link";
import { navigation } from "./navigation";

export async function Footer() {
  const tr = await getTranslator();
  const copy = getStudioCopy(await getLocale());
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <Link className="footer-mark" href="/" aria-label={tr("Luminal Factory")}>
            <Image
              src="/brand/luminal-factory-logo-primary.png?v=gold-20261007"
              alt=""
              width={1024}
              height={1024}
              sizes="72px"
            />
          </Link>
          <h2>{tr("Shaped by light.")}<br />{tr("Crafted to last.")}</h2>
        </div>
        <nav aria-label={tr("Điều hướng chân trang")}>
          {navigation.map((item) => <Link key={item.href} href={item.href}>{tr(item.label)}</Link>)}
          <Link href="/support">{copy.support}</Link>
          <Link href="/support#contact">{copy.contactTitle}</Link>
        </nav>
        <p>{tr("Artisan keycap, nhân vật 3D và những vật thể sưu tầm được tạo tác tại Luminal Factory.")}</p>
      </div>
      <div className="footer-base">
        <span>© {new Date().getFullYear()} {tr("Luminal Factory")}</span>
        <span>{tr("Privacy · Terms")}</span>
      </div>
    </footer>
  );
}
