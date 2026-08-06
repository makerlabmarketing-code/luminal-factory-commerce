import Link from "next/link";
import { MobileNavigation } from "./mobile-navigation";
import { navigation } from "./navigation";

export function Header() {
  return (
    <header className="site-header">
      <a className="skip-link" href="#main-content">Bỏ qua đến nội dung chính</a>
      <div className="header-inner">
        <Link href="/" className="brand" aria-label="Luminal Factory — trang chủ">
          <span aria-hidden="true">LF</span>
          <strong>Luminal<br />Factory</strong>
        </Link>
        <nav className="desktop-nav" aria-label="Điều hướng chính">
          {navigation.map((item) => <Link key={`${item.label}-${item.href}`} href={item.href}>{item.label}{!item.isAvailable ? <span>Sắp mở</span> : null}</Link>)}
        </nav>
        <MobileNavigation />
      </div>
    </header>
  );
}
