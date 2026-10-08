import { getTranslator } from "@/lib/i18n/server";
import { LuminalLoadingMark } from "./luminal-loading-mark";

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
        <LuminalLoadingMark />
        <span className="data-route-loading-label">{tr("Đang tải nội dung")}</span>
        <span className="data-route-loading-caption">{tr("Luminal Factory")}</span>
      </div>
    </main>
  );
}
