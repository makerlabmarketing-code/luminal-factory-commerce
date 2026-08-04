import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { MediaCard } from "@/components/ui/media-card";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { homepageContent } from "@/content/homepage";

export default function Home() {
  return (
    <>
      <Header />
      <main id="main-content">
        <section className="hero" aria-labelledby="hero-title">
          <Container className="hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">Xưởng thủ công · Vật thể sưu tầm</p>
              <h1 id="hero-title">Những vật thể nhỏ.<br />Một thế giới riêng.</h1>
              <p className="lede">Luminal Factory tạo nên artisan keycap, nhân vật 3D và những phiên bản giới hạn—được làm chậm, chăm chút và mang dấu vết của bàn tay.</p>
              <div className="actions">
                <ButtonLink href="#creations">Khám phá tác phẩm</ButtonLink>
                <ButtonLink href="#commission" variant="secondary">Bắt đầu commission</ButtonLink>
              </div>
            </div>
            <div className="hero-object" aria-label="Không gian vật thể trừu tượng của Luminal Factory" role="img">
              <span className="orb" />
              <span className="facet facet-one" />
              <span className="facet facet-two" />
              <p>OBJECT STUDY / 001</p>
            </div>
          </Container>
        </section>

        <Section id="about">
          <div className="split-intro">
            <p className="eyebrow">Luminal Factory</p>
            <h2>Một xưởng sáng tạo dành cho những cá tính có thể chạm vào.</h2>
            <p>Mỗi tạo tác bắt đầu từ một câu chuyện, đi qua điêu khắc, thử nghiệm vật liệu và hoàn thiện thủ công. Không sản xuất đại trà; không vội vàng.</p>
          </div>
        </Section>

        <Section id="creations" tone="surface">
          <SectionHeading eyebrow="Selected studies" title="Tác phẩm tiêu biểu" description="Nội dung trình bày định hướng; chưa phải danh mục sản phẩm hoặc cam kết mở bán." />
          <div className="card-grid">
            {homepageContent.featuredCreations.map((creation) => <MediaCard key={creation.id} creation={creation} />)}
          </div>
        </Section>

        <Section id="raffle">
          <div className="drop-panel">
            <p className="eyebrow">Limited creations</p>
            <h2>Những đợt phát hành có chủ đích.</h2>
            <p>Nơi dành cho raffle và các phiên bản giới hạn trong tương lai. Chưa có lịch, tồn kho hay hành động mua hàng trong giai đoạn nền tảng này.</p>
            <span className="quiet-label">Đang xây dựng</span>
          </div>
        </Section>

        <Section id="commission" tone="surface">
          <SectionHeading eyebrow="Commission" title="Từ ý tưởng riêng đến vật thể thật" description="Quy trình định hướng; biểu mẫu gửi yêu cầu sẽ được thiết kế trong một lát cắt sau." />
          <ol className="steps-grid">
            {homepageContent.commissionSteps.map((step, index) => <li key={step.title}><span>0{index + 1}</span><h3>{step.title}</h3><p>{step.description}</p></li>)}
          </ol>
        </Section>

        <Section id="process">
          <SectionHeading eyebrow="Inside the factory" title="Một quy trình có nhịp điệu" />
          <ol className="process-list">
            {homepageContent.processSteps.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, "0")}</span><h3>{step}</h3></li>)}
          </ol>
        </Section>

        <Section id="gallery" tone="surface">
          <SectionHeading eyebrow="Archive preview" title="Nhật ký hình khối" description="Những nghiên cứu trình bày cho gallery tương lai, không đại diện sản phẩm đang bán." />
          <div className="gallery-grid">
            {homepageContent.galleryStudies.map((study) => <article key={study.id} className="gallery-study"><div aria-hidden="true" className={`study-visual ${study.tone}`} /><p>{study.label}</p></article>)}
          </div>
        </Section>

        <Section id="contact">
          <div className="contact-panel">
            <p className="eyebrow">Stay close</p>
            <h2>Nhận tín hiệu từ xưởng.</h2>
            <p>Kênh cập nhật và liên hệ chính thức sẽ xuất hiện khi được phê duyệt. Hiện tại, đây là điểm giữ chỗ có chủ đích.</p>
            <span className="quiet-label">Kết nối sắp mở</span>
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
