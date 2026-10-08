import { localizePresentation } from "@/lib/i18n/presentation";

import { getTranslator, getLocale } from "@/lib/i18n/server";
import Image from "next/image";
import Link from "@/lib/i18n/link";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { homePageContent } from "@/content/homepage";
import { homePageMedia, type HomeMediaContract } from "@/content/homepage-media";
import { getHeroModelPresentation } from "./hero-model-data";
import { HeroObjectStage } from "./hero-object-stage";
import { HomeArrivalHeader } from "./home-arrival-header";
import { HomeImmersiveExperience } from "./home-immersive-experience";
import { HeroTextMotionController } from "./hero-copy-motion";
import { HomeFlexGallery } from "./home-flex-gallery";
import { HomeArchiveBurst } from "./home-archive-burst";
import { HomeRaffleSpotlight } from "./home-raffle-spotlight";
import { MadeAtLuminalStack } from "./made-at-luminal-stack";
import { getHomeFeaturedRaffle } from "@/features/raffle/raffle-home-service";
import { CollectorGuide } from "@/features/studio/studio-editorial";

type HomeMediaFrameProps = Readonly<{
  media: HomeMediaContract;
  className: string;
  imageClassName: string;
  placeholderClassName: string;
  motionReveal?: "media";
  motionSpotlight?: boolean;
}>;

async function HomeMediaFrame({ media, className, imageClassName, placeholderClassName, motionReveal, motionSpotlight = false }: HomeMediaFrameProps) {
  const tr = await getTranslator();
  return (
    <div className={className} data-luminal-reveal={motionReveal} data-luminal-spotlight={motionSpotlight ? "true" : undefined}>
      {media.availability === "available" ? (
        <Image className={imageClassName} src={media.src} alt={tr(media.alt)} fill sizes={media.sizes} style={{ objectPosition: media.objectPosition }} />
      ) : (
        <>
          <span className={placeholderClassName} aria-hidden="true" />
          <p className="home-media-pending">{tr(media.alt)}<br /><span>{tr("Approved product media pending sync")}</span></p>
        </>
      )}
    </div>
  );
}

export async function HomePage() {
  const tr = await getTranslator();
  const locale = await getLocale();
  const content = localizePresentation(homePageContent, locale);
  const media = localizePresentation(homePageMedia, locale);
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
        media={media.hero}
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
                <HeroObjectStage media={media.hero} presentation={heroPresentation} />
              ) : null}
            </div>

            <p className="hero-scroll-note" aria-hidden="true">{tr("Scroll to follow the object")}<span>↓</span></p>
          </Container>
        </section>

        <section
          className={`featured-object ${immersive ? "featured-object-immersive" : ""}`}
          aria-labelledby="featured-title"
          data-home-3d-section="featured"
        >
          {immersive ? <HomeArchiveBurst colorways={media.gallery.slice(0, 3)} /> : (
            <Container className="featured-object-grid">
              <HomeMediaFrame
                media={media.featured}
                className="featured-object-media border border-white/10 shadow-[0_3rem_9rem_rgba(0,0,0,0.28)]"
                imageClassName="home-product-image featured-product-image"
                placeholderClassName="featured-object-form"
                motionReveal="media"
                motionSpotlight
              />
              <div className="featured-object-copy self-start lg:sticky lg:top-28" data-luminal-reveal="copy">
                <p className="eyebrow">{content.featured.index}</p>
                <h2 id="featured-title">{content.featured.title}</h2>
                <p className="object-provenance">{content.featured.collection}</p>
                <p className="featured-story">{content.featured.story}</p>
                <Link className="text-link" href="/archive">{tr("View object record")}<span aria-hidden="true">↗</span></Link>
              </div>
            </Container>
          )}
        </section>

        <section className="brand-revival [content-visibility:auto] [contain-intrinsic-size:auto_620px]" aria-labelledby="revival-title" data-home-3d-section="revival">
          <Container>
            <p className="eyebrow" data-luminal-reveal="copy">{tr("A studio in transition")}</p>
            <h2 id="revival-title" data-luminal-reveal="copy"><span>{tr("Lazy Factory")}</span><i aria-hidden="true">→</i>{tr("Luminal Factory")}</h2>
            <p data-luminal-reveal="copy">{tr("Formerly Lazy Factory. The same independent hands, now with a clearer focus on light, material, and collectible character.")}</p>
          </Container>
        </section>

        {!immersive ? <section className="selected-archive section [content-visibility:auto] [contain-intrinsic-size:auto_1500px]" aria-labelledby="archive-title" data-home-3d-section="archive">
          <Container>
            <header className="editorial-heading" data-luminal-reveal="copy">
              <div><p className="eyebrow">{tr("Selected archive")}</p><h2 id="archive-title">{tr("Objects with a past.")}</h2></div>
              <p>{tr("A small index of forms, characters, and finishes that shaped the studio.")}</p>
            </header>
            <div className="archive-editorial-grid">
              {content.archive.map((object, index) => (
                <Link href="/archive" className={`archive-object archive-object-${object.tone} group relative outline-none`} key={object.title} data-luminal-reveal="archive-card" data-luminal-delay={index}>
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
            <Link className="text-link archive-link" href="/archive">{tr("Explore the full archive")}<span aria-hidden="true">↗</span></Link>
          </Container>
        </section> : null}

        <section className="home-gallery section border-t border-white/10 bg-[#070707] [content-visibility:auto] [contain-intrinsic-size:auto_980px]" aria-labelledby="gallery-title" data-home-3d-section="gallery">
          <Container>
            <header className="editorial-heading" data-luminal-reveal="copy">
              <div><p className="eyebrow">{tr("Colorway studies")}</p><h2 id="gallery-title">{tr("One character.")}<br />{tr("Three moods.")}</h2></div>
              <p>{tr("A closer look at the colorful Lolipop, death-inspired Mictlán, and monochrome finishes from the studio archive.")}</p>
            </header>
            <HomeFlexGallery items={media.gallery} />
          </Container>
        </section>

        <section className="made-at-luminal section overflow-visible md:pb-0" aria-labelledby="making-title">
          <Container>
            <header className="editorial-heading md:sticky md:top-20 md:z-30 md:bg-[#0a0a0a] md:pb-8" data-luminal-reveal="copy" data-made-at-luminal-header="true">
              <div><p className="eyebrow">{tr("Made at Luminal")}</p><h2 id="making-title">{tr("From thought")}<br />{tr("to artifact.")}</h2></div>
              <p>{tr("Four measured movements. Digital tools support the process; the final character still comes from the hand.")}</p>
            </header>
            <MadeAtLuminalStack steps={content.process} />
          </Container>
        </section>

        <Container><CollectorGuide /></Container>
        <section className="commerce-split [content-visibility:auto] [contain-intrinsic-size:auto_700px]" aria-label={tr("Shop and commission")}>
          <Link href="/shop" className="commerce-door commerce-door-shop overflow-hidden transition-[filter] duration-500 hover:brightness-110 motion-reduce:transition-none" data-luminal-reveal="card" data-luminal-spotlight="true"><span className="eyebrow">{tr("Available objects")}</span><h2>{tr("Shop")}</h2><p>{tr("Small-batch pieces and studio editions.")}</p><i aria-hidden="true">↗</i></Link>
          <Link href="/commission" className="commerce-door commerce-door-commission overflow-hidden transition-[filter] duration-500 hover:brightness-110 motion-reduce:transition-none" data-luminal-reveal="card" data-luminal-delay="1" data-luminal-spotlight="true"><span className="eyebrow">{tr("Made for you")}</span><h2>{tr("Commission")}</h2><p>{tr("Begin a conversation about a custom object.")}</p><i aria-hidden="true">↗</i></Link>
        </section>
      </main>
    </>
  );
}
