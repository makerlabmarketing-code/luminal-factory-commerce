import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Container } from "@/components/ui/container";
import { CustomerAccountPanel } from "@/features/auth/customer-account-panel";
import { CustomerAddressesPanel } from "@/features/account/customer-addresses-panel";
import { getCustomerAuthEnvironment } from "@/features/auth/customer-auth-request";
import { getServerCustomerAuthEmail } from "@/lib/supabase/customer-auth-server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Account", description: "Tài khoản khách hàng Luminal Factory.", robots: { index: false, follow: false } };

export default async function AccountPage() {
  const environment = getCustomerAuthEnvironment();
  const siteKey = environment.ready ? process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY?.trim() ?? "" : "";
  const authenticatedEmail = environment.ready ? await getServerCustomerAuthEmail() : null;
  const addressesEnabled = environment.ready && process.env.COMMERCE_SAVED_ADDRESSES_ENABLED === "true";
  return <><Header /><main id="main-content" className="account-route"><Container className="account-route-grid">
    <section className="account-intro" aria-labelledby="account-title"><p className="eyebrow">Luminal account</p><h1 id="account-title">Một lối vào yên tĩnh cho những object bạn chọn giữ lại.</h1><p>Account được xây theo từng lớp an toàn. Đơn hàng, thanh toán và các tính năng chưa được phê duyệt vẫn nằm ngoài phạm vi.</p></section>
    {environment.ready && siteKey ? <CustomerAccountPanel siteKey={siteKey} initialEmail={authenticatedEmail} /> : <section className="account-panel account-unavailable" aria-labelledby="account-unavailable-title"><p className="eyebrow">Private staging gate</p><h2 id="account-unavailable-title">Account chưa được mở trên môi trường này.</h2><p>Trang vẫn giữ trạng thái an toàn cho đến khi runtime Auth của đúng Preview được bật và kiểm tra.</p></section>}
    {addressesEnabled && authenticatedEmail && <CustomerAddressesPanel />}
  </Container></main><Footer /></>;
}
