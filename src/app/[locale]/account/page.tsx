import { languageAlternates } from "@/lib/i18n/locale";

import { getTranslator, getLocale } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Container } from "@/components/ui/container";
import { CustomerAccountPanel } from "@/features/auth/customer-account-panel";
import { CustomerAddressesPanel } from "@/features/account/customer-addresses-panel";
import { getCustomerAuthEnvironment } from "@/features/auth/customer-auth-request";
import { getServerCustomerAuthEmail } from "@/lib/supabase/customer-auth-server";
import { getCustomerRaffleHistory } from "@/features/account/customer-raffle-history-server";
import { CustomerRaffleHistoryLink } from "@/features/account/customer-raffle-history-link";
import Link from "@/lib/i18n/link";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: locale === "vi" ? "T\u00e0i kho\u1ea3n" : "Account", description: locale === "vi" ? "T\u00e0i kho\u1ea3n Luminal Factory c\u1ee7a b\u1ea1n." : "Your Luminal Factory account.", alternates: languageAlternates("/account", locale), robots: { index: false, follow: false } };
}

export default async function AccountPage({ searchParams }: Readonly<{ searchParams: Promise<{ auth_error?: string }> }>) {
  const tr = await getTranslator();
  const { auth_error: authError } = await searchParams;
  const environment = getCustomerAuthEnvironment();
  const siteKey = environment.ready ? process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY?.trim() ?? "" : "";
  const authenticatedEmail = environment.ready ? await getServerCustomerAuthEmail() : null;
  const addressesEnabled = environment.ready && process.env.COMMERCE_SAVED_ADDRESSES_ENABLED === "true";
  const history = environment.ready && authenticatedEmail ? await getCustomerRaffleHistory() : null;
  return <><Header /><main id="main-content" className="account-route"><Container className="account-route-grid">
    <section className="account-intro" aria-labelledby="account-title"><p className="eyebrow">{tr("Luminal account")}</p><h1 id="account-title">{tr("Một lối vào yên tĩnh cho những object bạn chọn giữ lại.")}</h1><p>{tr("Account được xây theo từng lớp an toàn. Đơn hàng, thanh toán và các tính năng chưa được phê duyệt vẫn nằm ngoài phạm vi.")}</p></section>
    {environment.ready && siteKey ? <CustomerAccountPanel siteKey={siteKey} initialEmail={authenticatedEmail} googleEnabled={process.env.COMMERCE_CUSTOMER_GOOGLE_AUTH_ENABLED === "true"} googleError={authError === "google"} /> : <section className="account-panel account-unavailable" aria-labelledby="account-unavailable-title"><p className="eyebrow">{tr("Private staging gate")}</p><h2 id="account-unavailable-title">{tr("Account chưa được mở trên môi trường này.")}</h2><p>{tr("Trang vẫn giữ trạng thái an toàn cho đến khi runtime Auth của đúng Preview được bật và kiểm tra.")}</p></section>}
    {addressesEnabled && authenticatedEmail && <CustomerAddressesPanel />}
    {history && history.state !== "disabled" && <section className="account-panel" aria-labelledby="customer-raffle-history-title">
      <div className="account-panel-heading">
        <p className="eyebrow">LUMINAL / MY RAFFLES</p>
        <h2 id="customer-raffle-history-title">My Raffle History</h2>
        <p>Your previous raffle entries and published results.</p>
        {history.state === "ready" && <CustomerRaffleHistoryLink />}
      </div>
      {history.state === "unavailable" ? <p role="status">Raffle history is temporarily unavailable.</p> :
        history.state === "signed_out" ? <p role="status">Sign in with a verified email to view your history.</p> :
        history.items.length === 0 ? <p role="status">You haven&apos;t entered a raffle yet.</p> :
        <ul className="account-raffle-history-list">
          {history.items.map(item => <li key={item.id} className="account-session">
            <h3>{item.title}</h3>
            <p>{item.outcome === "selected" ? "Selected" : item.outcome === "not_selected" ? "Not selected" : "Entry recorded"}</p>
            <p>Entered: <time dateTime={item.enteredAt}>{new Date(item.enteredAt).toLocaleDateString("en-GB", { timeZone: "UTC", dateStyle: "medium" })}</time></p>
            {item.fulfillmentStatus ? <p>Fulfillment: {item.fulfillmentStatus.replace(/_/g, " ")}</p> : null}
            <Link href={`/raffle/${item.slug}`} className="button-link button-secondary">View Raffle</Link>
          </li>)}
        </ul>}
    </section>}
  </Container></main><Footer /></>;
}
