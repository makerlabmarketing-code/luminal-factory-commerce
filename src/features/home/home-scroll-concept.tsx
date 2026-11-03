import Image from "next/image";
import Link from "@/lib/i18n/link";
import { homePageMedia } from "@/content/homepage-media";
import { homePageContent } from "@/content/homepage";
import { getHeroModelPresentation } from "./hero-model-data";
import { HomeScrollMotion } from "./home-scroll-motion";
import { HomeScrollModel } from "./home-scroll-model";
import styles from "./home-scroll-concept.module.css";

const colorwayLinks = ["/archive/meowhe-lolipop", "/archive/meowhe-mictlan", "/archive/meowhe-mono"] as const;
const colorways = homePageMedia.gallery.slice(0, 3);
const processSteps = homePageContent.process.map(step => step.title === "Sculpt"
  ? { ...step, copy: "Proportion, expression, and sculpted detail give the character its form." } : step);

export async function HomeScrollConcept() {
  const presentation = await getHeroModelPresentation();
  return <main id="main-content" className={styles.page} data-home-scroll-concept>
    {/* Reveal this completed streamed document without hydration. Tailwind's
        base layer marks [hidden] important, so the override belongs there too. */}
    <noscript><style>{`
      @layer base {
        div[hidden]:has([data-home-scroll-concept]) { display: block !important; }
      }
      body:has([data-home-scroll-concept]) > .data-route-loading,
      body:has([data-home-scroll-concept]) > header,
      body:has([data-home-scroll-concept]) > .route-header-spacer { display: none !important; }
    `}</style></noscript>
    <HomeScrollMotion />
    <div className={styles.preview}><span>Connected Home · Concept preview</span><Link href="/">Back to current Home ↗</Link></div>
    <nav className={styles.chapters} aria-label="Story chapters"><a href="#arrival">01 Arrival</a><a href="#character">02 Meowhe</a><a href="#details">03 Details</a><a href="#craft">04 Studio</a><a href="#collect">05 Collect</a></nav>
    <div className={styles.runway} data-story-runway>
      <div className={styles.visual} aria-hidden="true">
        <div className={styles.model} data-story-model><HomeScrollModel media={homePageMedia.hero} presentation={presentation} /></div>
        {colorways.map((photo, index) => <div className={`${styles.floatingPhoto} ${styles[`photo${index + 1}`]}`} data-story-photo key={photo.id}><Image src={photo.src} alt="" fill sizes="22vw" style={{ objectPosition: photo.objectPosition ?? "center" }} /></div>)}
        <figure className={styles.study} data-story-study><div><Image src={homePageMedia.featured.src} alt="" fill sizes="45vw" style={{ objectPosition: "50% 64%" }} /></div><figcaption>Surface study · finished Mono Meowhe</figcaption></figure>
      </div>
      <div className={styles.story}>
        <section id="arrival" className={`${styles.scene} ${styles.arrival}`} data-home-3d-section="hero" aria-labelledby="arrival-title">
          <div className={styles.copy}><p className={styles.eyebrow}>01 / Arrival · Luminal Factory</p><h1 id="arrival-title">Small objects.<br />Unmistakable<br />character.</h1><p className={styles.lede}>Sculpted with intent. Cast by hand.<br />Independent characters, shaped by light.</p><a className="text-link" href="#character">Follow Meowhe <span aria-hidden="true">↓</span></a></div>
          <div className={styles.staticMedia}><Image src={homePageMedia.hero.src} alt={homePageMedia.hero.alt} fill preload sizes="(max-width: 700px) 92vw, 50vw" /></div>
        </section>
        <section id="character" className={`${styles.scene} ${styles.character}`} data-home-3d-section="featured" aria-labelledby="character-title">
          <div className={styles.copy}><p className={styles.eyebrow}>02 / Character</p><h2 id="character-title">Meet<br />Meowhe.</h2><p className={styles.lede}>A familiar face. Three different souls.</p><p>A mischievous character from our Lazy Factory chapter. Explore the colorful Lolipop, death-inspired Mictlán, and monochrome Mono.</p><div className={styles.links}>{colorways.map((photo, index) => <Link href={colorwayLinks[index]} key={photo.id}>{photo.colorway} ↗</Link>)}</div></div>
          <div className={styles.staticMedia}><Image src={homePageMedia.featured.src} alt={homePageMedia.featured.alt} fill sizes="(max-width: 700px) 92vw, 50vw" /></div>
        </section>
        <section id="details" className={`${styles.scene} ${styles.details}`} aria-labelledby="details-title">
          <div className={styles.copy}><p className={styles.eyebrow}>03 / Colorway studies</p><h2 id="details-title">One character.<br />Three moods.</h2><p className={styles.lede}>Look a little closer.</p><p>Color, texture, and the details that give each edition its own presence.</p><div className={styles.links}>{colorways.map((photo, index) => <Link href={colorwayLinks[index]} key={photo.id}>Explore {photo.colorway} ↗</Link>)}</div></div>
          <div className={styles.nativeGallery}>{colorways.map((photo, index) => <Link href={colorwayLinks[index]} key={photo.id}><div><Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 700px) 92vw, 30vw" style={{ objectPosition: photo.objectPosition ?? "center" }} /></div><span>{photo.colorway} ↗</span></Link>)}</div>
        </section>
        <section id="craft" className={`${styles.scene} ${styles.craft}`} aria-labelledby="craft-title">
          <div className={styles.copy}><p className={styles.eyebrow}>04 / Made at Luminal</p><h2 id="craft-title">From thought<br />to artifact.</h2><p>Formerly Lazy Factory. The same independent hands, with a clearer focus on light, material, and collectible character.</p><ol className={styles.process}>{processSteps.map(step => <li key={step.number}><span>{step.number}</span><div><h3>{step.title}</h3><p>{step.copy}</p></div></li>)}</ol></div>
          <figure className={styles.staticMedia}><Image src={homePageMedia.featured.src} alt="Finished Mono Meowhe showing its sculpted surface and monochrome finish" fill sizes="(max-width: 700px) 92vw, 45vw" /><figcaption>Surface study · finished object</figcaption></figure>
        </section>
      </div>
    </div>
    <section id="collect" className={styles.collect} aria-labelledby="collect-title">
      <div><p className={styles.eyebrow}>05 / Collect</p><h2 id="collect-title">Find your<br />character.</h2><p>Explore the studio archive, discover available objects, or begin a conversation about something personal.</p><div className={styles.actions}><Link className="button-link" href="/shop">Browse Shop ↗</Link><Link className="text-link" href="/raffle">Explore releases ↗</Link><Link className="text-link" href="/archive">Explore Archive ↗</Link><Link className="text-link" href="/commission">Begin a commission ↗</Link></div></div>
      <Link href="/archive/meowhe-lolipop" className={styles.collectImage}><Image src={homePageMedia.gallery[3].src} alt={homePageMedia.gallery[3].alt} fill sizes="(max-width: 700px) 92vw, 45vw" /><span>Lolipop Meowhe · Studio archive ↗</span></Link>
    </section>
  </main>;
}
