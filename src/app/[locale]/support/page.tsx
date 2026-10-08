import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Container } from "@/components/ui/container";
import Link from "@/lib/i18n/link";
import { getLocale } from "@/lib/i18n/server";
import { languageAlternates } from "@/lib/i18n/locale";
import { getStudioCopy } from "@/features/studio/studio-copy";
import styles from "@/features/studio/studio-editorial.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const copy = getStudioCopy(locale);
  return { title:copy.support, description:copy.supportIntro, alternates:languageAlternates("/support",locale) };
}

export default async function SupportPage() {
  const copy = getStudioCopy(await getLocale());
  return <><Header /><main id="main-content"><Container>
    <section className={styles.section} aria-labelledby="support-title">
      <header className={styles.heading}><h1 id="support-title">{copy.support}</h1><p>{copy.supportIntro}</p></header>
      <aside className={styles.note}><p className="eyebrow">{copy.draftLabel}</p><p>{copy.draftNote}</p></aside>
    </section>
    {[{id:"care",title:copy.careTitle,items:copy.care},{id:"shipping",title:copy.shippingTitle,items:copy.shipping}].map(group =>
      <section className={`${styles.section} ${styles.faq}`} aria-labelledby={`${group.id}-title`} key={group.id}>
        <header className={styles.heading}><h2 id={`${group.id}-title`}>{group.title}</h2></header>
        {group.items.map(item => <details key={item.title}><summary>{item.title}</summary><p>{item.text}</p></details>)}
      </section>)}
    <section className={styles.section} aria-labelledby="contact-title" id="contact">
      <header className={styles.heading}><h2 id="contact-title">{copy.contactTitle}</h2><p>{copy.contactNote}</p></header>
      <div className={styles.links}><Link className="text-link" href="/raffle">{copy.raffle} ↗</Link><Link className="text-link" href="/commission">{copy.commission} ↗</Link></div>
    </section>
  </Container></main><Footer /></>;
}
