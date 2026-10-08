import Image from "next/image";
import styles from "./luminal-loading-mark.module.css";

/** Decorative, indeterminate loading mark. The surrounding status owns its label. */
export function LuminalLoadingMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`${styles.mark} ${compact ? styles.compact : ""}`} aria-hidden="true">
      <span className={styles.resin} />
      <Image
        className={styles.logo}
        src="/brand/luminal-factory-logo-primary.png?v=gold-20261007"
        alt=""
        width={96}
        height={96}
        sizes={compact ? "48px" : "96px"}
        loading="eager"
      />
      <span className={styles.rail}><span className={styles.light} /></span>
    </span>
  );
}
