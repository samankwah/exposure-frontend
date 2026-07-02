import type { CSSProperties, ReactNode } from "react";

type SkeletonLineProps = {
  width?: CSSProperties["width"];
  className?: string;
};

function LoadingRegion({
  label,
  className,
  children
}: {
  label: string;
  className: string;
  children: ReactNode;
}) {
  return (
    <div className={`${className} skeleton-route`} role="status" aria-live="polite" aria-atomic="true" aria-busy="true">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

function SkeletonLine({ width = "100%", className = "" }: SkeletonLineProps) {
  return <span className={`skeleton-line ${className}`} style={{ width }} aria-hidden="true" />;
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <span className={`skeleton-block ${className}`} aria-hidden="true" />;
}

function SkeletonPill({ width = "100%" }: { width?: CSSProperties["width"] }) {
  return <span className="skeleton-pill" style={{ width }} aria-hidden="true" />;
}

export function MapPanelSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "map-panel compact skeleton-map-panel" : "map-panel skeleton-map-panel"} aria-hidden="true">
      <span className="skeleton-map-zoom" />
      <span className="skeleton-map-layers" />
      <span className="skeleton-map-legend" />
    </div>
  );
}

export function MapPageSkeleton() {
  return (
    <LoadingRegion label="Loading map explorer" className="page-stack map-page">
      <PageHeaderSkeleton action />
      <section className="map-controls">
        <FilterBarSkeleton compact />
        <div className="range-controls skeleton-range-controls">
          <SkeletonPill />
          <SkeletonPill />
        </div>
        <LayerToggleSkeleton />
      </section>
      <KpiGridSkeleton />
      <section className="split-map-grid single">
        <div>
          <div className="map-caption">
            <SkeletonLine width="150px" />
            <SkeletonLine width="120px" />
          </div>
          <MapPanelSkeleton />
        </div>
      </section>
    </LoadingRegion>
  );
}

export function TrendsSkeleton() {
  return (
    <LoadingRegion label="Loading trends and analytics" className="page-stack">
      <PageHeaderSkeleton action />
      <FilterBarSkeleton />
      <section className="chart-grid two">
        {Array.from({ length: 4 }, (_, index) => (
          <ChartCardSkeleton key={index} variant={index > 1 ? "bars" : "line"} />
        ))}
      </section>
      <RankingTableSkeleton />
    </LoadingRegion>
  );
}

function PageHeaderSkeleton({ action = false }: { action?: boolean }) {
  return (
    <header className="page-header skeleton-page-header">
      <div>
        <SkeletonLine width="118px" className="skeleton-eyebrow-line" />
        <SkeletonLine width="min(420px, 72vw)" className="skeleton-title-line" />
        <SkeletonLine width="min(720px, 82vw)" />
      </div>
      {action ? (
        <div className="skeleton-actions">
          <SkeletonPill width="92px" />
          <SkeletonPill width="92px" />
        </div>
      ) : null}
    </header>
  );
}

function KpiGridSkeleton() {
  return (
    <section className="kpi-grid">
      {Array.from({ length: 5 }, (_, index) => (
        <article className="kpi-card skeleton-kpi-card" key={index}>
          <SkeletonLine width="58%" />
          <SkeletonLine width="42%" className="skeleton-metric-line" />
          <SkeletonLine width="78%" />
          <SkeletonPill width="84px" />
        </article>
      ))}
    </section>
  );
}

function FilterBarSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "filter-bar compact skeleton-filter-bar" : "filter-bar skeleton-filter-bar"}>
      {Array.from({ length: 5 }, (_, index) => (
        <label key={index}>
          <SkeletonLine width="72px" />
          <SkeletonPill />
        </label>
      ))}
    </div>
  );
}

function LayerToggleSkeleton() {
  return (
    <div className="layer-toggles skeleton-layer-toggles">
      <SkeletonLine width="82px" />
      <SkeletonPill width="82px" />
      <SkeletonPill width="74px" />
      <SkeletonPill width="104px" />
    </div>
  );
}

function RankingTableSkeleton({ compact = false }: { compact?: boolean }) {
  const rows = compact ? 5 : 8;

  return (
    <div className="table-panel skeleton-ranking-table">
      <header className="panel-header">
        <SkeletonLine width="148px" />
        <SkeletonLine width="86px" />
      </header>
      <div className="ranking-table">
        {Array.from({ length: rows }, (_, index) => (
          <div className="table-row" key={index}>
            <span className="country-cell">
              <SkeletonBlock className="skeleton-dot" />
              <SkeletonLine width={`${64 + (index % 3) * 16}px`} />
            </span>
            <SkeletonLine width="54px" />
            <SkeletonLine width="68px" />
            <SkeletonLine width="48px" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartCardSkeleton({ variant = "line" }: { variant?: "line" | "bars" }) {
  return (
    <article className="chart-card skeleton-chart-card">
      <header className="panel-header">
        <SkeletonLine width="160px" />
        <SkeletonLine width="90px" />
      </header>
      <div className="chart-wrap skeleton-chart-wrap">
        <span className="skeleton-chart-axis skeleton-chart-axis-y" />
        <span className="skeleton-chart-axis skeleton-chart-axis-x" />
        {variant === "bars" ? (
          <div className="skeleton-bars">
            {Array.from({ length: 12 }, (_, index) => (
              <span key={index} style={{ height: `${34 + ((index * 13) % 54)}%` }} />
            ))}
          </div>
        ) : (
          <span className="skeleton-chart-line" />
        )}
      </div>
    </article>
  );
}
