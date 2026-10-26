import Link from "@/lib/i18n/link";
import styles from "./stage-invitation.module.css";

export function StageInvitation({ locale }: Readonly<{ locale: "vi" | "en" }>) {
  return (
    <Link className={styles.invitation} href="/shop#meowhe-stage">
      <span className={styles.threshold} aria-hidden="true" />
      <span>
        <small>{locale === "vi" ? "MEOWHE / SAU TẤM MÀN" : "MEOWHE / BEHIND THE CURTAIN"}</small>
        <strong>{locale === "vi" ? "Bước vào câu chuyện" : "Enter the story"}<span aria-hidden="true"> ↗</span></strong>
      </span>
    </Link>
  );
}
