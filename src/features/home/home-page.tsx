import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { homePageContent } from "@/content/homepage";

export function HomePage() {
  const content = homePageContent;

  return (
    <main id="main-content" className="wave-home">
      <section className="revival-hero" aria-labelledby="hero-title">
        <div className="hero-atmosphere" aria-hidden="true" />
        <Image
          className="hero-crystal-mark"
          src="/brand/luminal-factory-logo-primary.png"
          alt=""
          width={4000}
          height={4000}
          priority
          sizes="(max-width: 800px) 72vw, 42vw"
        />
        <Container className="revival-hero-inner">
          <div className="revival-hero-copy">
            <p className="eyebrow">{content.hero.eyebrow}</p>
            <h1 id="hero-title">{content.hero.title}</h1>
            <p className="lede">{content.hero.description}</p>
            <div className="actions">
              <ButtonLink href={content.hero.primaryAction.href}>{content.hero.primaryAction.label}</ButtonLink>
              <ButtonLink href={content.hero.secondaryAction.href} variant="secondary">{content.hero.secondaryAction.label}</ButtonLink>
            </div>
          </div>
          <div className="hero-object-stage" aria-label="Featured Luminal object image awaiting approved Drive asset sync">
            <span className="hero-object-silhouette" aria-hidden="true" />
            <p>Featured object<br /><span>Approved product media pending sync</span></p>
          </div>
          <p className="hero-scroll-note" aria-hidden="true">Scroll to enter the archive <span>↓</span></p>
        </Container>
      </section>

      <section className="featured-object" aria-labelledby="featured-title">
        <Container className="featured-object-grid">
          <div className="featured-object-media" role="img" aria-label="Featured object media placeholder pending approved product photography">
            <span className="featured-object-form" aria-hidden="true" />
            <span className="asset-sync-note">Product photography pending Drive sync</span>
          </div>
          <div className="featured-object-copy">
            <p className="eyebrow">{content.featured.index}</p>
            <h2 id="featured-title">{content.featured.title}</h2>
            <p className="object-provenance">{content.featured.collection}</p>
            <p className="featured-story">{content.featured.story}</p>
            <Link className="text-link" href="/archive">View object record <span aria-hidden="true">↗</span></Link>
          </div>
        </Container>
      </section>

      <section className="brand-revival" aria-labelledby="revival-title">
        <Container>
          <p className="eyebrow">A studio in transition</p>
          <h2 id="revival-title"><span>Lazy Factory</span><i aria-hidden="true">→</i>Luminal Factory</h2>
          <p>Formerly Lazy Factory. The same independent hands, now with a clearer focus on light, material, and collectible character.</p>
        </Container>
      </section>

      <section className="selected-archive section" aria-labelledby="archive-title">
        <Container>
          <header className="editorial-heading">
            <div><p className="eyebrow">Selected archive</p><h2 id="archive-title">Objects with a past.</h2></div>
            <p>A small index of forms, characters, and finishes that shaped the studio.</p>
          </header>
          <div className="archive-editorial-grid">
            {content.archive.map((object, index) => (
              <Link href="/archive" className={`archive-object archive-object-${object.tone}`} key={object.title}>
                <div className="archive-object-visual"><span aria-hidden="true" /><em>{String(index + 1).padStart(2, "0")}</em></div>
                <div><h3>{object.title}</h3><p>{object.collection} · {object.year}</p></div>
              </Link>
            ))}
          </div>
          <Link className="text-link archive-link" href="/archive">Explore the full archive <span aria-hidden="true">↗</span></Link>
        </Container>
      </section>

      <section className="made-at-luminal section" aria-labelledby="making-title">
        <Container>
          <header className="editorial-heading">
            <div><p className="eyebrow">Made at Luminal</p><h2 id="making-title">From thought<br />to artifact.</h2></div>
            <p>Four measured movements. Digital tools support the process; the final character still comes from the hand.</p>
          </header>
          <ol className="making-steps">
            {content.process.map((step) => <li key={step.number}><span>{step.number}</span><h3>{step.title}</h3><p>{step.copy}</p></li>)}
          </ol>
        </Container>
      </section>

      <section className="commerce-split" aria-label="Shop and commission">
        <Link href="/shop" className="commerce-door commerce-door-shop"><span className="eyebrow">Available objects</span><h2>Shop</h2><p>Small-batch pieces and studio editions.</p><i aria-hidden="true">↗</i></Link>
        <Link href="/commission" className="commerce-door commerce-door-commission"><span className="eyebrow">Made for you</span><h2>Commission</h2><p>Begin a conversation about a custom object.</p><i aria-hidden="true">↗</i></Link>
      </section>
    </main>
  );
}
