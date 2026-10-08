import Image from "next/image";
import Link from "@/lib/i18n/link";
import { getLocale, getTranslator } from "@/lib/i18n/server";
import { homePageMedia } from "@/content/homepage-media";
import { getStudioCopy } from "./studio-copy";
import styles from "./studio-editorial.module.css";

export async function StudioStory() {
  const copy = getStudioCopy(await getLocale());
  return <section className={`${styles.section} ${styles.story}`} aria-labelledby="studio-origin-title">
    <figure>
      <div className={styles.image}><Image src={homePageMedia.hero.src} alt={copy.imageAlt} fill sizes="(max-width:800px) 92vw, 45vw" /></div>
      <figcaption className={styles.caption}>{copy.imageNote}</figcaption>
    </figure>
    <div>
      <h2 id="studio-origin-title">{copy.originTitle}</h2><p>{copy.origin}</p>
      <div className={styles.note}><h3>{copy.studioTitle}</h3><p>{copy.studioDraft}</p></div>
      <div className={styles.links}><Link className="text-link" href="/archive">{copy.archive} ↗</Link></div>
    </div>
  </section>;
}

const briefMedia = [homePageMedia.archive.meowhe, homePageMedia.archive.mictlan, homePageMedia.archive.monoMeowhe];

export async function CommissionExamples() {
  const [locale, tr] = await Promise.all([getLocale(), getTranslator()]);
  const copy = getStudioCopy(locale);
  return <section className={styles.section} aria-labelledby="commission-examples-title">
    <header className={styles.heading}><h2 id="commission-examples-title">{copy.briefsTitle}</h2><p>{copy.briefsNote}</p></header>
    <div className={styles.cards}>{copy.briefs.map((brief, index) => <article key={brief.title}>
      <div className={styles.image}><Image src={briefMedia[index].src} alt={tr(briefMedia[index].alt)} fill sizes="(max-width:800px) 92vw, 30vw" /></div>
      <p className={styles.caption}>{copy.briefLabel}</p><h3>{brief.title}</h3><p>{brief.text}</p>
    </article>)}</div>
  </section>;
}

export async function CollectorGuide() {
  const copy = getStudioCopy(await getLocale());
  return <section className={styles.section} aria-labelledby="collector-guide-title">
    <header className={styles.heading}><h2 id="collector-guide-title">{copy.guideTitle}</h2><p>{copy.guideIntro}</p></header>
    <ol className={`${styles.cards} ${styles.steps}`}>{copy.guideSteps.map(step => <li key={step.title}><h3>{step.title}</h3><p>{step.text}</p></li>)}</ol>
    <nav className={styles.links} aria-label={copy.guideTitle}>
      <Link className="text-link" href="/raffle">{copy.raffle} ↗</Link>
      <Link className="text-link" href="/support">{copy.support} ↗</Link>
      <Link className="text-link" href="/about">{copy.about} ↗</Link>
    </nav>
  </section>;
}
