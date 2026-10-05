
import { getTranslator } from "@/lib/i18n/server";
export async function DataRouteLoading() {
  const tr = await getTranslator();
  return (
    <main
      id="main-content"
      className="data-route-loading"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="data-route-loading-status" role="status">
        <span className="data-route-loading-mark" aria-hidden="true">
          <span className="data-route-loading-orbit" />
          <span className="data-route-loading-orbit data-route-loading-orbit-two" />
          <span className="data-route-loading-orbit data-route-loading-orbit-three" />
          <span className="data-route-loading-core" />
        </span>
        <span className="data-route-loading-label">{tr("Đang tải nội dung")}</span>
        <span className="data-route-loading-caption">{tr("Luminal Factory")}</span>
      </div>
    </main>
  );
}
