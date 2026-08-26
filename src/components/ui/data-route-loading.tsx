export function DataRouteLoading() {
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
        <span className="data-route-loading-label">Đang tải nội dung</span>
        <span className="data-route-loading-caption">Luminal Factory</span>
      </div>
    </main>
  );
}
