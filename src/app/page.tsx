import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { homeHeroContent } from "@/content/homepage";
import { ArchivePreviewSection } from "@/features/archive/archive-preview-section";
import { getCuratedArchiveEntries } from "@/features/archive/archive-content";

export default function Home() {
  const hero = homeHeroContent;
  const archiveEntries = getCuratedArchiveEntries();

  return (
    <>
      <Header />
      <main id="main-content">
        <section id="raffle" className="home-hero" aria-labelledby="hero-title" data-hero-mode={hero.mode}>
          <Container className="home-hero-grid">
            <div className="home-hero-copy">
              <p className="eyebrow">{hero.eyebrow}</p>
              <p className="release-status" aria-live="polite">{hero.statusLabel}</p>
              <h1 id="hero-title">{hero.title}</h1>
              <p className="lede">{hero.description}</p>
              <div className="actions">
                <ButtonLink href={hero.primaryAction.href}>{hero.primaryAction.label}</ButtonLink>
              </div>
              <dl className="hero-metadata" aria-label="Thông tin phát hành ở mức trình bày">
                {hero.metadata.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}
              </dl>
            </div>
            <figure className="hero-object" aria-label={hero.media.alt}>
              <span className="object-plinth" aria-hidden="true" />
              <span className="orb" aria-hidden="true" />
              <span className="facet facet-one" aria-hidden="true" />
              <span className="facet facet-two" aria-hidden="true" />
              <figcaption><span>{hero.media.label}</span><strong>{hero.media.placeholderNotice}</strong></figcaption>
            </figure>
          </Container>
        </section>

        <section id="release-information" className="release-info" aria-labelledby="release-info-title">
          <Container className="release-info-grid">
            <div>
              <p className="eyebrow">Release information</p>
              <h2 id="release-info-title">Thông tin raffle sẽ được xác nhận trước khi mở entry.</h2>
            </div>
            <div className="release-info-panel">
              <p>{hero.statusLabel}</p>
              <p>{hero.timingLabel}</p>
              <p>{hero.timeZoneLabel}</p>
              <p>Hiện chưa có entry, đơn hàng, thanh toán hoặc khu vực khách hàng trong slice này.</p>
              <div className="secondary-entry-list" aria-label="Lối vào phụ">
                {hero.secondaryEntries.map((entry) => <span key={entry.label}>{entry.label} · {entry.status}</span>)}
              </div>
            </div>
          </Container>
        </section>

        <ArchivePreviewSection entries={archiveEntries} />

        <section id="about" className="about-minimal" aria-labelledby="about-title">
          <Container className="release-info-grid">
            <p className="eyebrow">About</p>
            <h2 id="about-title">Luminal Factory là không gian trình bày vật thể sưu tầm, được triển khai theo từng lát cắt đã phê duyệt.</h2>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
