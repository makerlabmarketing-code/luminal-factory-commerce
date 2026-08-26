import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Container } from "@/components/ui/container";
import { CustomerAccountPanel } from "@/features/auth/customer-account-panel";
import { getCustomerAuthEnvironment } from "@/features/auth/customer-auth-request";
import { getServerCustomerAuthEmail } from "@/lib/supabase/customer-auth-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Account",
  description: "Đăng nhập tài khoản khách hàng Luminal Factory bằng mã dùng một lần qua email.",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const environment = getCustomerAuthEnvironment();
  const siteKey = environment.ready
    ? process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY?.trim() ?? ""
    : "";
  const authenticatedEmail = environment.ready ? await getServerCustomerAuthEmail() : null;

  return (
    <>
      <Header />
      <main id="main-content" className="account-route">
        <Container className="account-route-grid">
          <section className="account-intro" aria-labelledby="account-title">
            <p className="eyebrow">Luminal account</p>
            <h1 id="account-title">Một lối vào yên tĩnh cho những object bạn chọn giữ lại.</h1>
            <p>
              Account được xây theo từng lớp an toàn. Giai đoạn hiện tại chỉ mở xác thực email; dữ liệu đơn hàng,
              địa chỉ và thanh toán vẫn nằm ngoài phạm vi.
            </p>
          </section>

          {environment.ready && siteKey ? (
            <CustomerAccountPanel siteKey={siteKey} initialEmail={authenticatedEmail} />
          ) : (
            <section className="account-panel account-unavailable" aria-labelledby="account-unavailable-title">
              <p className="eyebrow">Private staging gate</p>
              <h2 id="account-unavailable-title">Account chưa được mở trên môi trường này.</h2>
              <p>Trang vẫn giữ trạng thái an toàn cho đến khi runtime Auth của đúng Preview được bật và kiểm tra.</p>
            </section>
          )}
        </Container>
      </main>
      <Footer />
    </>
  );
}
