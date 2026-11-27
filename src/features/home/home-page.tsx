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
import { HomeImmersiveExperience } from "./home-immersive-experience";
import { HomeArchiveBurst } from "./home-archive-burst";
import { HomeRaffleSpotlight } from "./home-raffle-spotlight";
import { HomeMotionGallery } from "./home-motion-gallery";
import photoStyles from "./home-resin-flow.module.css";
import { MadeAtLuminalRail } from "./made-at-luminal-rail";
import { getHomeFeaturedRaffle } from "@/features/raffle/raffle-home-service";
import { CollectorGuide } from "@/features/studio/studio-editorial";
import { StageInvitation } from "@/components/discovery/stage-invitation";

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
  const galleryPhotos = media.gallery.slice(0, 6);
  const processImageIds = ["lolipop-candy-stones", "mictlan-skull-study", "mictlan-keyboard", "mono-cookie-portrait"];
  const processSteps = content.process.map((step, index) => ({
    ...step,
    image: media.gallery.find((image) => image.id === processImageIds[index]),
  }));

  return (
    <>
      <HomeImmersiveExperience
        media={media.hero}
        presentation={heroPresentation}
        enabled={immersive}
      />

      <main id="main-content" className="wave-home" data-home-immersive={immersive ? "true" : "false"}>
        {featuredRaffle ? <HomeRaffleSpotlight raffle={featuredRaffle} /> : null}

        <section className="revival-hero" aria-labelledby="hero-title" data-home-3d-section="hero">
          <div className="hero-atmosphere" aria-hidden="true" />
          <Container className={`revival-hero-inner ${immersive ? "" : "lg:!grid-cols-[minmax(0,.72fr)_minmax(28rem,1.28fr)] lg:!gap-[clamp(2rem,5vw,6rem)]"}`}>
            <div className="revival-hero-copy">
              <div className="revival-hero-title">
                <p className="eyebrow" data-hero-entrance>{content.hero.eyebrow}</p>
                <h1 id="hero-title" data-hero-entrance>{content.hero.title}</h1>
              </div>
              <div className="revival-hero-details">
                <p className="lede" data-hero-entrance>{content.hero.description}</p>
                <div className="actions" data-hero-entrance>
                  <ButtonLink href={content.hero.primaryAction.href}>{content.hero.primaryAction.label}</ButtonLink>
                  <ButtonLink href={content.hero.secondaryAction.href} variant="secondary">{content.hero.secondaryAction.label}</ButtonLink>
                </div>
              </div>
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
                <div className="home-featured-links">
                  <StageInvitation locale={locale} />
                  <Link className="text-link" href="/archive/meowhe-mono">{tr("View object record")}<span aria-hidden="true">↗</span></Link>
                </div>
              </div>
            </Container>
          )}
        </section>

        {!immersive ? <section className="selected-archive section [content-visibility:auto] [contain-intrinsic-size:auto_1500px]" aria-labelledby="archive-title" data-home-3d-section="archive">
          <Container>
            <header className="editorial-heading" data-luminal-reveal="copy">
              <div><p className="eyebrow">{tr("Selected archive")}</p><h2 id="archive-title">{tr("Objects with a past.")}</h2></div>
              <p>{tr("A small index of forms, characters, and finishes that shaped the studio.")}</p>
            </header>
            <div className="archive-editorial-grid">
              {content.archive.map((object, index) => (
                <Link href={object.recordHref} className={`archive-object archive-object-${object.tone} group relative outline-none`} key={object.title} data-luminal-reveal="archive-card" data-luminal-delay={index}>
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
            <Link className="text-link archive-link" href="/raffle">{tr("Explore Raffles")}<span aria-hidden="true">↗</span></Link>
          </Container>
        </section> : null}

        {galleryPhotos.length ? (
          <section className={photoStyles.photoChapter} aria-labelledby="gallery-title" data-home-3d-section="gallery" data-home-photo-handoff>
            <span className={photoStyles.galleryViewport} data-home-gallery-viewport aria-hidden="true" />
            <div className={photoStyles.galleryCaption} data-home-gallery-caption aria-hidden="true">
              <span>{tr("Explore Lolipop, Mictlán and Mono.")}</span>
            </div>
            <Container className={photoStyles.galleryContainer}>
              <header className={`editorial-heading ${photoStyles.photoCopy}`} data-luminal-reveal="home-copy">
                <div><p className="eyebrow">{tr("Colorway studies")}</p><h2 id="gallery-title">{tr("Meowhe colorways")}</h2></div>
                <Link className="text-link" href="/archive/meowhe-mono">{tr("View object record")}<span aria-hidden="true">↗</span></Link>
              </header>
              <HomeMotionGallery items={galleryPhotos} />
            </Container>
          </section>
        ) : null}

        <section className="brand-revival [content-visibility:auto] [contain-intrinsic-size:auto_620px]" aria-labelledby="revival-title" data-home-3d-section="revival">
          <Container>
            <p className="eyebrow" data-luminal-reveal="home-copy">{tr("A studio in transition")}</p>
            <h2 id="revival-title" data-luminal-reveal="home-copy"><span>{tr("Lazy Factory")}</span><i aria-hidden="true">→</i>{tr("Luminal Factory")}</h2>
            <p data-luminal-reveal="home-copy">{tr("Same independent studio. A new chapter.")}</p>
          </Container>
        </section>

        <MadeAtLuminalRail
          eyebrow={tr("Made at Luminal")}
          title={tr("Made with intention.")}
          description={tr("Designed digitally. Finished by hand.")}
          closing={tr("From an idea to an object you can hold.")}
          steps={processSteps}
        >
          <Container><CollectorGuide /></Container>
        </MadeAtLuminalRail>

        <section className="commerce-split [content-visibility:auto] [contain-intrinsic-size:auto_700px]" aria-label={tr("Raffle and commission")}>
          <Link href="/raffle" className="commerce-door commerce-door-shop overflow-hidden transition-[filter] duration-500 hover:brightness-110 motion-reduce:transition-none" data-luminal-reveal="card" data-luminal-spotlight="true"><span className="eyebrow">{tr("Announced releases")}</span><h2>{tr("Raffle")}</h2><p>{tr("Explore the next raffle releases.")}</p><i aria-hidden="true">↗</i></Link>
          <Link href="/commission" className="commerce-door commerce-door-commission overflow-hidden transition-[filter] duration-500 hover:brightness-110 motion-reduce:transition-none" data-luminal-reveal="card" data-luminal-delay="1" data-luminal-spotlight="true"><span className="eyebrow">{tr("Made for you")}</span><h2>{tr("Commission")}</h2><p>{tr("Begin a conversation about a custom object.")}</p><i aria-hidden="true">↗</i></Link>
        </section>
      </main>
    </>
  );
}
