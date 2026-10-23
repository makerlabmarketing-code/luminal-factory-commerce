import Link from "@/lib/i18n/link";
import { ShopMedia } from "@/features/shop/shop-media";
import type { ShopPresentationEntry } from "@/features/shop/shop-content";
import styles from "./circus-product-bubble.module.css";

export function CircusProductBubble({ entry, locale }: Readonly<{ entry: ShopPresentationEntry; locale: "vi" | "en" }>) {
  return (
    <Link className={styles.bubble} href={entry.href} aria-label={`${locale === "vi" ? "Xem sản phẩm" : "View product"}: ${entry.title}`}>
      <span className={styles.image}><ShopMedia media={entry.media} sizes="(max-width: 700px) 70vw, 340px" /></span>
      <span className={styles.caption}>
        <span>{locale === "vi" ? "VẬT THỂ ĐÃ CÔNG BỐ" : "PUBLISHED OBJECT"}</span>
        <strong>{entry.title}</strong>
        <span>{locale === "vi" ? "Khám phá sản phẩm ↗" : "Explore object ↗"}</span>
      </span>
    </Link>
  );
}
