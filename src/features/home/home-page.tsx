import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { homePageContent } from "@/content/homepage";
import { homePageMedia, type HomeMediaContract } from "@/content/homepage-media";
import { getHeroModelPresentation } from "./hero-model-data";
import { HeroObjectStage } from "./hero-object-stage";

type HomeMediaFrameProps = Readonly<{
  media: HomeMediaContract;
  className: string;
  imageClassName: string;
  placeholderClassName: string;
}>;

function HomeMediaFrame({ media, className, imageClassName, placeholderClassName }: HomeMediaFrameProps) {
  return (
    <div className={className}>
      {media.availability === "available" ? (
        <Image className={imageClassName} src={media.src} alt={media.alt} fill sizes={media.sizes} style={{ objectPosition: media.objectPosition }} />
      ) : (
        <>
          <span className={placeholderClassName} aria-hidden="true" />
          <p className="home-media-pending">{media.alt}<br /><span>Approved product media pending sync</span></p>
        </>
      )}
    </div>
  );
}

export async function HomePage() {
  const content = homePageContent;
  const heroPresentation = await getHeroModelPresentation();

  return (
    <main id="main-content" className="wave-home">
      <section className="revival-hero" aria-labelledby="hero-title">
        <div className="hero-atmosphere" aria-hidden="true" />
        <Image className="hero-crystal-mark" src="/brand/luminal-factory-logo-primary.png" alt="" width={4000} height={4000} priority sizes="(max-width: 800px) 72vw, 42vw" />
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
          <HeroObjectStage media={homePageMedia.hero} presentation={heroPresentation} />
          <p className="hero-scroll-note" aria-hidden="true">Scroll to enter the archive <span>↓</span></p>
        </Container>
      </section>

      <section className="featured-object" aria-labelledby="featured-title">
        <Container className="featured-object-grid">
          <HomeMediaFrame media={homePageMedia.featured} className="featured-object-media border border-white/10 shadow-[0_3rem_9rem_rgba(0,0,0,0.28)]" imageClassName="home-product-image featured-product-image" placeholderClassName="featured-object-form" />
          <div className="featured-object-copy self-start lg:sticky lg:top-28">
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
              <Link href="/archive" className={`archive-object archive-object-${object.tone} group relative outline-none`} key={object.title}>
                <div className="archive-object-visual">
                  {homePageMedia.archive[object.mediaKey].availability === "available" ? (
                    <Image className="home-product-image archive-product-image" src={homePageMedia.archive[object.mediaKey].src} alt={homePageMedia.archive[object.mediaKey].alt} fill sizes={homePageMedia.archive[object.mediaKey].sizes} style={{ objectPosition: homePageMedia.archive[object.mediaKey].objectPosition }} />
                  ) : <span aria-hidden="true" />}
                  <em>{String(index + 1).padStart(2, "0")}</em>
                </div>
                <div className="grid grid-cols-[1fr_auto] items-end gap-x-4 gap-y-1 pt-4">
                  <h3 className="col-start-1">{object.title}</h3>
                  <p className="col-start-1">{object.collection} · {object.year}</p>
                  <span className="col-start-2 row-start-1 row-span-2 self-center text-sm text-[var(--muted-foreground)] transition duration-200 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-[var(--ice)] motion-reduce:transition-none" aria-hidden="true">↗</span>
                </div>
              </Link>
            ))}
          </div>
          <Link className="text-link archive-link" href="/archive">Explore the full archive <span aria-hidden="true">↗</span></Link>
        </Container>
      </section>

      <section className="made-at-luminal section overflow-visible" aria-labelledby="making-title">
        <Container>
          <header className="editorial-heading md:sticky md:top-20 md:z-0 md:pb-8">
            <div><p className="eyebrow">Made at Luminal</p><h2 id="making-title">From thought<br />to artifact.</h2></div>
            <p>Four measured movements. Digital tools support the process; the final character still comes from the hand.</p>
          </header>
          <ol className="m-0 grid list-none gap-[18vh] p-0 pb-[14vh] md:gap-[26vh]">
            {content.process.map((step, index) => (
              <li className="relative min-h-[24rem] overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0d0d0e]/95 p-6 shadow-[0_2rem_7rem_rgba(0,0,0,0.38)] backdrop-blur-md md:sticky md:min-h-[60svh] md:p-10 motion-reduce:static" style={{ top: `calc(6.5rem + ${index * 1.1}rem)`, zIndex: index + 1 }} key={step.number}>
                <div className="grid h-full min-h-[inherit] content-between gap-12 md:grid-cols-[0.7fr_1.3fr] md:items-end">
                  <div>
                    <span className="font-mono text-xs tracking-[0.2em] text-white/45">{step.number} / 04</span>
                    <h3 className="mt-5 max-w-[8ch] text-[clamp(2.6rem,7vw,7rem)] font-normal leading-[0.88] tracking-[-0.065em]">{step.title}</h3>
                  </div>
                  <div className="md:justify-self-end md:pb-4">
                    <p className="max-w-[30rem] text-base leading-7 text-white/55 md:text-lg">{step.copy}</p>
                    <div className="mt-8 h-px w-full bg-gradient-to-r from-[var(--ice)]/50 via-white/10 to-transparent" aria-hidden="true" />
                  </div>
                </div>
                <span className="pointer-events-none absolute -right-4 -top-10 select-none text-[clamp(8rem,22vw,18rem)] font-semibold leading-none tracking-[-0.1em] text-white/[0.025]" aria-hidden="true">{step.number}</span>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="commerce-split" aria-label="Shop and commission">
        <Link href="/shop" className="commerce-door commerce-door-shop overflow-hidden transition-[filter] duration-500 hover:brightness-110 motion-reduce:transition-none"><span className="eyebrow">Available objects</span><h2>Shop</h2><p>Small-batch pieces and studio editions.</p><i aria-hidden="true">↗</i></Link>
        <Link href="/commission" className="commerce-door commerce-door-commission overflow-hidden transition-[filter] duration-500 hover:brightness-110 motion-reduce:transition-none"><span className="eyebrow">Made for you</span><h2>Commission</h2><p>Begin a conversation about a custom object.</p><i aria-hidden="true">↗</i></Link>
      </section>
    </main>
  );
}
