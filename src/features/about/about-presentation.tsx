import { localizePresentation } from "@/lib/i18n/presentation";

import { getTranslator, getLocale } from "@/lib/i18n/server";
import Link from "@/lib/i18n/link";
import type { AboutPresentation as AboutContent } from "./about-content";
import { StudioStory } from "@/features/studio/studio-editorial";
import { getStudioCopy } from "@/features/studio/studio-copy";

type AboutPresentationProps = Readonly<{ content: AboutContent }>;

export async function AboutPresentation({ content: originalContent }: AboutPresentationProps) {
  const tr = await getTranslator();
  const content = localizePresentation(originalContent, await getLocale());
  const copy = getStudioCopy(await getLocale());
  return (
    <>
      <section className="section" aria-labelledby="about-page-title">
        <div className="section-heading">
          <p className="eyebrow">{content.eyebrow}</p>
          <div>
            <p className="release-status">{content.brandLine}</p>
            <h1 id="about-page-title">{content.title}</h1>
            <p className="lede">{content.summary}</p>
          </div>
        </div>
      </section>

      <StudioStory />
      <section className="section section-surface" aria-labelledby="about-objects-title">
        <div className="section-heading">
          <p className="eyebrow">{tr("What we make")}</p>
          <h2 id="about-objects-title">{copy.objectsTitle}</h2>
          <p>{copy.objectsIntro}</p>
        </div>
        <div className="card-grid">
          {content.objectCategories.map((category) => (
            <article className="feedback-state" key={category.title}>
              <h3>{category.title}</h3>
              <p>{category.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="about-process-title">
        <div className="section-heading">
          <p className="eyebrow">{tr("Studio process")}</p>
          <h2 id="about-process-title">{tr("Từ hình dung đến một vật thể có thật.")}</h2>
          <p>{copy.processIntro}</p>
        </div>
        <ol className="steps-grid">
          {content.processSteps.map((step) => (
            <li key={step.number}>
              <span>{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="section section-surface" aria-labelledby="about-principles-title">
        <div className="section-heading">
          <p className="eyebrow">{tr("Studio principles")}</p>
          <h2 id="about-principles-title">{copy.principlesTitle}</h2>
        </div>
        <ul className="process-list">
          {content.principles.map((principle, index) => (
            <li key={principle.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{principle.title}</h3>
                <p>{principle.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="section" aria-labelledby="about-explore-title">
        <div className="section-heading">
          <p className="eyebrow">{tr("Explore Luminal")}</p>
          <h2 id="about-explore-title">{copy.exploreTitle}</h2>
        </div>
        <div className="card-grid">
          {content.routeBridges.map((bridge) => (
            <article className="feedback-state" key={bridge.href}>
              <h3>{bridge.label}</h3>
              <p>{bridge.description}</p>
              <Link className="button-link button-secondary" href={bridge.href}>{tr("Mở")}{" "}{bridge.label}</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="about-commission-title">
        <div className="contact-panel">
          <p className="eyebrow">{tr("Custom object")}</p>
          <h2 id="about-commission-title">{tr("Có một ý tưởng cần studio review?")}</h2>
          <p>{copy.contactIntro}</p>
          <div className="actions">
            <Link className="button-link" href="/commission">{tr("Đi tới Commission")}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
