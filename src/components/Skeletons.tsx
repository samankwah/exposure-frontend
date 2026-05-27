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
      <span className="skeleton-map-land skeleton-map-land-a" />
      <span className="skeleton-map-land skeleton-map-land-b" />
      <span className="skeleton-map-land skeleton-map-land-c" />
      <span className="skeleton-map-legend" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <LoadingRegion label="Loading dashboard content" className="page-stack overview-page">
      <TargetKpiGridSkeleton />
      <section className="dashboard-grid overview-main-grid">
        <OverviewMapSkeleton />
        <PopulationTableSkeleton />
      </section>
      <section className="overview-bottom-grid">
        <ChartCardSkeleton />
        <ChartCardSkeleton variant="bars" />
        <FireCardSkeleton />
        <InsightsSkeleton />
      </section>
      <FooterSkeleton />
    </LoadingRegion>
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

export function FireSeasonalitySkeleton() {
  return (
    <LoadingRegion label="Loading fire and seasonality analysis" className="page-stack">
      <PageHeaderSkeleton action />
      <FilterBarSkeleton />
      <KpiGridSkeleton />
      <section className="chart-grid two">
        <ChartCardSkeleton variant="bars" />
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </section>
    </LoadingRegion>
  );
}

export function ReportsSkeleton() {
  return (
    <LoadingRegion label="Loading reports workspace" className="page-stack reports-page">
      <PageHeaderSkeleton action />
      <FilterBarSkeleton />
      <section className="report-layout">
        <article className="report-preview skeleton-report-preview">
          <SkeletonLine width="132px" className="skeleton-eyebrow-line" />
          <SkeletonLine width="58%" className="skeleton-title-line" />
          <SkeletonLine />
          <SkeletonLine width="92%" />
          <SkeletonLine width="76%" />
          <div className="skeleton-list">
            <SkeletonLine width="82%" />
            <SkeletonLine width="70%" />
            <SkeletonLine width="74%" />
          </div>
        </article>
        <aside className="report-actions">
          <ExportActionsSkeleton />
          <RankingTableSkeleton compact />
        </aside>
      </section>
    </LoadingRegion>
  );
}

export function AdminSkeleton() {
  return (
    <LoadingRegion label="Loading admin workspace" className="page-stack">
      <PageHeaderSkeleton />
      <section className="admin-grid">
        {Array.from({ length: 4 }, (_, index) => (
          <article className="admin-card skeleton-admin-card" key={index}>
            <SkeletonBlock className="skeleton-icon" />
            <SkeletonLine width="72%" />
            <SkeletonLine width="42%" />
            <SkeletonPill />
          </article>
        ))}
      </section>
      <article className="ops-log">
        <SkeletonLine width="112px" className="skeleton-eyebrow-line" />
        <SkeletonLine width="68%" />
        <SkeletonLine width="76%" />
        <SkeletonLine width="62%" />
      </article>
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

function TargetKpiGridSkeleton() {
  return (
    <section className="target-kpi-grid">
      {Array.from({ length: 5 }, (_, index) => (
        <article className="target-kpi-card skeleton-target-kpi" key={index}>
          <SkeletonLine width="72%" />
          <SkeletonBlock className="skeleton-kpi-icon" />
          <SkeletonLine width="54%" className="skeleton-metric-line" />
          <SkeletonLine width="68%" />
          <SkeletonLine width="48%" />
        </article>
      ))}
    </section>
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

function OverviewMapSkeleton() {
  return (
    <article className="tropomi-map-card skeleton-card">
      <header className="tropomi-map-header">
        <SkeletonLine width="290px" />
        <div className="map-selectors">
          <SkeletonPill width="134px" />
          <SkeletonPill width="134px" />
          <SkeletonPill width="34px" />
        </div>
      </header>
      <div className="tropomi-map-body">
        <MapPanelSkeleton compact />
      </div>
    </article>
  );
}

function PopulationTableSkeleton() {
  return (
    <article className="population-table-card skeleton-card">
      <header>
        <SkeletonLine width="70%" />
      </header>
      <div className="population-table skeleton-population-table">
        {Array.from({ length: 16 }, (_, index) => (
          <div className="population-row" key={index}>
            <SkeletonLine width={index === 0 ? "52px" : "78px"} />
            <span className="no2-bar-cell">
              <SkeletonBlock className="skeleton-table-bar" />
              <SkeletonLine width="28px" />
            </span>
            <SkeletonLine width={index === 0 ? "82px" : "42px"} />
          </div>
        ))}
      </div>
      <footer>
        <SkeletonLine width="78%" />
      </footer>
    </article>
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

function FireCardSkeleton() {
  return (
    <article className="chart-card fire-card target-fire-card skeleton-card">
      <header className="panel-header">
        <SkeletonLine width="140px" />
        <SkeletonLine width="94px" />
      </header>
      <div className="fire-mini-map target-fire-map">
        <MapPanelSkeleton compact />
      </div>
      <div className="target-fire-footer">
        <SkeletonPill width="92px" />
        <SkeletonLine width="26px" />
        <SkeletonBlock className="skeleton-table-bar" />
        <SkeletonLine width="28px" />
      </div>
    </article>
  );
}

function InsightsSkeleton() {
  return (
    <article className="chart-card insights-card target-insights skeleton-card">
      <header className="panel-header">
        <SkeletonLine width="88px" />
      </header>
      <div className="insight-list">
        {Array.from({ length: 4 }, (_, index) => (
          <p key={index}>
            <SkeletonBlock className="skeleton-insight-icon" />
            <SkeletonLine width={`${74 + (index % 2) * 14}%`} />
          </p>
        ))}
      </div>
    </article>
  );
}

function ExportActionsSkeleton() {
  return (
    <div className="export-actions skeleton-export-actions">
      <SkeletonPill width="96px" />
      <SkeletonPill width="96px" />
      <SkeletonPill width="96px" />
    </div>
  );
}

function FooterSkeleton() {
  return (
    <footer className="observatory-footer skeleton-footer">
      {Array.from({ length: 3 }, (_, index) => (
        <section key={index}>
          <SkeletonBlock className="skeleton-footer-icon" />
          <h2>
            <SkeletonLine width="112px" />
          </h2>
          <p>
            <SkeletonLine width="86%" />
          </p>
        </section>
      ))}
    </footer>
  );
}
