import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { homePageContent } from "@/content/homepage";
import { homePageMedia, type HomeMediaContract } from "@/content/homepage-media";
import { getHeroModelPresentation } from "./hero-model-data";
import { HeroObjectStage } from "./hero-object-stage";
import { HomeArrivalHeader } from "./home-arrival-header";
import { HomeImmersiveExperience } from "./home-immersive-experience";
import { HeroTextMotionController } from "./hero-copy-motion";
import { HomeDriftWall } from "./home-drift-wall";
import { HomeRaffleSpotlight } from "./home-raffle-spotlight";
import { getHomeFeaturedRaffle } from "@/features/raffle/raffle-home-service";

type HomeMediaFrameProps = Readonly<{
  media: HomeMediaContract;
  className: string;
  imageClassName: string;
  placeholderClassName: string;
  motionReveal?: "media";
  motionSpotlight?: boolean;
}>;

function HomeMediaFrame({ media, className, imageClassName, placeholderClassName, motionReveal, motionSpotlight = false }: HomeMediaFrameProps) {
  return (
    <div className={className} data-luminal-reveal={motionReveal} data-luminal-spotlight={motionSpotlight ? "true" : undefined}>
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
  const [heroPresentation, featuredRaffle] = await Promise.all([
    getHeroModelPresentation(),
    getHomeFeaturedRaffle(),
  ]);
  const immersive = !featuredRaffle;
  const heroTitleWords = content.hero.title.trim().split(/\s+/);

  return (
    <>
      <HomeArrivalHeader immersive={immersive} />
      <HomeImmersiveExperience
        media={homePageMedia.hero}
        presentation={heroPresentation}
        enabled={immersive}
      />

      <main id="main-content" className="wave-home" data-home-immersive={immersive ? "true" : "false"}>
        {featuredRaffle ? <HomeRaffleSpotlight raffle={featuredRaffle} /> : null}

        <section className="revival-hero" aria-labelledby="hero-title" data-home-3d-section="hero">
          <div className="hero-atmosphere" aria-hidden="true" />
          <Container className="revival-hero-inner lg:!grid-cols-[minmax(0,.72fr)_minmax(28rem,1.28fr)] lg:!gap-[clamp(2rem,5vw,6rem)]">
            <div className="revival-hero-copy lg:max-w-[34rem] lg:-translate-y-[4vh]" data-hero-text-motion="word-reveal">
              <p className="eyebrow" data-hero-copy-support>{content.hero.eyebrow}</p>
              <h1 id="hero-title">
                {heroTitleWords.map((word, index) => (
                  <span className="inline-block will-change-transform" data-hero-word key={`${word}-${index}`}>
                    {word}{index < heroTitleWords.length - 1 ? "\u00A0" : null}
                  </span>
                ))}
              </h1>
              <p className="lede" data-hero-copy-support>{content.hero.description}</p>
              <div className="actions" data-hero-copy-support>
                <ButtonLink href={content.hero.primaryAction.href}>{content.hero.primaryAction.label}</ButtonLink>
                <ButtonLink href={content.hero.secondaryAction.href} variant="secondary">{content.hero.secondaryAction.label}</ButtonLink>
              </div>
              <HeroTextMotionController />
            </div>

            <div className="home-hero-object-corridor relative min-w-0 lg:-mr-[min(7vw,7rem)] lg:pt-6">
              {featuredRaffle ? (
                <HeroObjectStage media={homePageMedia.hero} presentation={heroPresentation} />
              ) : null}
            </div>

            <p className="hero-scroll-note" aria-hidden="true">Scroll to follow the object <span>↓</span></p>
          </Container>
        </section>

        <section
          className={`featured-object ${immersive ? "featured-object-immersive" : ""}`}
          aria-labelledby="featured-title"
          data-home-3d-section="featured"
        >
          <Container className="featured-object-grid">
            {immersive ? (
              <div className="home-object-corridor">
                <span aria-hidden="true" />
                <i aria-hidden="true" />
                <div className="home-object-mobile-stage">
                  <HeroObjectStage
                    media={homePageMedia.hero}
                    presentation={heroPresentation}
                    allowTouch3d
                    mobileOnly
                  />
                </div>
              </div>
            ) : (
              <HomeMediaFrame
                media={homePageMedia.featured}
                className="featured-object-media border border-white/10 shadow-[0_3rem_9rem_rgba(0,0,0,0.28)]"
                imageClassName="home-product-image featured-product-image"
                placeholderClassName="featured-object-form"
                motionReveal="media"
                motionSpotlight
              />
            )}

            <div className="featured-object-copy self-start lg:sticky lg:top-28" data-luminal-reveal="copy">
              <p className="eyebrow">{immersive ? "01 / Object in motion" : content.featured.index}</p>
              <h2 id="featured-title">{immersive ? "Meet Meowhe." : content.featured.title}</h2>
              <p className="object-provenance">
                {immersive ? "Luminal Revival · Browser 3D study" : content.featured.collection}
              </p>
              <p className="featured-story">
                {immersive
                  ? "Meowhe becomes the visual guide for this opening sequence: a collectible character with enough weight and silhouette to move through the page as an object, not just an image."
                  : content.featured.story}
              </p>
              <Link className="text-link" href="/archive">
                {immersive ? "Explore the Meowhe archive" : "View object record"} <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </Container>
        </section>

        <section className="brand-revival [content-visibility:auto] [contain-intrinsic-size:auto_620px]" aria-labelledby="revival-title" data-home-3d-section="revival">
          <Container>
            <p className="eyebrow" data-luminal-reveal="copy">A studio in transition</p>
            <h2 id="revival-title" data-luminal-reveal="copy"><span>Lazy Factory</span><i aria-hidden="true">→</i>Luminal Factory</h2>
            <p data-luminal-reveal="copy">Formerly Lazy Factory. The same independent hands, now with a clearer focus on light, material, and collectible character.</p>
          </Container>
        </section>

        <section className="selected-archive section [content-visibility:auto] [contain-intrinsic-size:auto_1500px]" aria-labelledby="archive-title" data-home-3d-section="archive">
          <Container>
            <header className="editorial-heading" data-luminal-reveal="copy">
              <div><p className="eyebrow">Selected archive</p><h2 id="archive-title">Objects with a past.</h2></div>
              <p>A small index of forms, characters, and finishes that shaped the studio.</p>
            </header>
            <div className="archive-editorial-grid">
              {content.archive.map((object, index) => (
                <Link href="/archive" className={`archive-object archive-object-${object.tone} group relative outline-none`} key={object.title} data-luminal-reveal="card" data-luminal-delay={index}>
                  <div className="archive-object-visual" data-luminal-spotlight="true">
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

        <section className="home-gallery section border-t border-white/10 bg-[#070707] [content-visibility:auto] [contain-intrinsic-size:auto_980px]" aria-labelledby="gallery-title" data-home-3d-section="gallery">
          <Container>
            <header className="editorial-heading" data-luminal-reveal="copy">
              <div><p className="eyebrow">Colorway studies</p><h2 id="gallery-title">One character.<br />Three moods.</h2></div>
              <p>A closer look at the colorful Lolipop, death-inspired Mictlán, and monochrome finishes from the studio archive.</p>
            </header>
            <HomeDriftWall items={homePageMedia.gallery} />
          </Container>
        </section>

        <section className="made-at-luminal section overflow-visible" aria-labelledby="making-title">
          <Container>
            <header className="editorial-heading md:sticky md:top-20 md:z-0 md:pb-8" data-luminal-reveal="copy">
              <div><p className="eyebrow">Made at Luminal</p><h2 id="making-title">From thought<br />to artifact.</h2></div>
              <p>Four measured movements. Digital tools support the process; the final character still comes from the hand.</p>
            </header>
            <ol className="m-0 grid list-none gap-[18vh] p-0 pb-[14vh] md:gap-[26vh]">
              {content.process.map((step, index) => (
                <li className="relative min-h-[24rem] overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0d0d0e]/95 p-6 shadow-[0_2rem_7rem_rgba(0,0,0,0.38)] backdrop-blur-md md:sticky md:min-h-[60svh] md:p-10 motion-reduce:static" style={{ top: `calc(6.5rem + ${index * 1.1}rem)`, zIndex: index + 1 }} key={step.number}>
                  <div className="grid h-full min-h-[inherit] content-between gap-12 md:grid-cols-[0.7fr_1.3fr] md:items-end" data-luminal-reveal="card" data-luminal-delay={index}>
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

        <section className="commerce-split [content-visibility:auto] [contain-intrinsic-size:auto_700px]" aria-label="Shop and commission">
          <Link href="/shop" className="commerce-door commerce-door-shop overflow-hidden transition-[filter] duration-500 hover:brightness-110 motion-reduce:transition-none" data-luminal-reveal="card" data-luminal-spotlight="true"><span className="eyebrow">Available objects</span><h2>Shop</h2><p>Small-batch pieces and studio editions.</p><i aria-hidden="true">↗</i></Link>
          <Link href="/commission" className="commerce-door commerce-door-commission overflow-hidden transition-[filter] duration-500 hover:brightness-110 motion-reduce:transition-none" data-luminal-reveal="card" data-luminal-delay="1" data-luminal-spotlight="true"><span className="eyebrow">Made for you</span><h2>Commission</h2><p>Begin a conversation about a custom object.</p><i aria-hidden="true">↗</i></Link>
        </section>
      </main>
    </>
  );
}
