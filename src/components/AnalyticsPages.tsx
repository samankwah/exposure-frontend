"use client";

import { useMemo } from "react";
import { Database, Play, ShieldCheck, UploadCloud } from "lucide-react";
import { BarChart, LineChart } from "@/components/Charts";
import { ExportButtons } from "@/components/ExportButtons";
import { FilterBar } from "@/components/FilterBar";
import { KpiCards } from "@/components/KpiCards";
import { RankingTable } from "@/components/RankingTable";
import { useObservatoryFilters } from "@/components/ObservatoryContext";
import type { Filters } from "@/types/exposure";
import {
  getAnnualTrend,
  getCountryName,
  getCountryRanking,
  getMonthlyCycle,
  getSeasonComparison,
  getSummaryMetrics
} from "@/data/sampleData";

export function TrendsView() {
  const { filters, setFilters } = useObservatoryFilters();
  const updateFilters = (next: Filters) => setFilters((current) => ({ ...current, ...next }));
  const annualTrend = useMemo(() => getAnnualTrend(filters), [filters]);
  const monthlyCycle = useMemo(() => getMonthlyCycle(filters), [filters]);
  const ranking = useMemo(() => getCountryRanking(filters), [filters]);

  return (
    <div className="page-stack">
      <PageIntro
        eyebrow="Trends and analytics"
        title={`${getCountryName(filters.countryId)} trend diagnostics`}
        body="Annual trends, monthly cycle, fire counts, and population-weighted exposure are linked to the same filter state."
        filters={filters}
      />
      <FilterBar filters={filters} onChange={updateFilters} />
      <section className="chart-grid two">
        <LineChart
          data={annualTrend}
          eyebrow="Annual"
          primaryKey="no2"
          primaryLabel="NO₂"
          secondaryKey="fireCount"
          secondaryLabel="Fire count"
          title="Annual NO₂ and fire activity"
        />
        <LineChart
          data={annualTrend}
          eyebrow="Exposure"
          primaryKey="exposure"
          primaryLabel="Population exposure"
          title="Population-weighted exposure trend"
        />
        <BarChart data={monthlyCycle} eyebrow="Monthly" label="NO₂" metricKey="no2" title="Monthly NO₂ cycle" />
        <BarChart data={monthlyCycle} eyebrow="Monthly" label="Exposure" metricKey="exposure" title="Monthly exposure load" />
      </section>
      <RankingTable rows={ranking} selectedId={filters.countryId} onSelect={(countryId) => setFilters({ ...filters, countryId, cityId: "all" })} />
    </div>
  );
}

export function FireSeasonalityView() {
  const { filters, setFilters } = useObservatoryFilters();
  const fireFilters: Filters = filters.season === "all" ? { ...filters, season: "dry" } : filters;
  const updateFilters = (next: Filters) => setFilters((current) => ({ ...current, ...next }));
  const monthlyCycle = useMemo(() => getMonthlyCycle(fireFilters), [fireFilters]);
  const annualTrend = useMemo(() => getAnnualTrend(fireFilters), [fireFilters]);
  const comparison = useMemo(() => getSeasonComparison({ ...fireFilters, season: "all" }), [fireFilters]);

  return (
    <div className="page-stack">
      <PageIntro
        eyebrow="Fire and seasonality"
        title="Dry season NO₂ and fire coupling"
        body="Fire activity is modeled as a seasonal driver, with higher dry-season intensity across Sahel and Gulf of Guinea countries."
        filters={fireFilters}
      />
      <FilterBar filters={fireFilters} onChange={updateFilters} />
      <KpiCards metrics={getSummaryMetrics(fireFilters)} />
      <section className="chart-grid two">
        <BarChart data={monthlyCycle} eyebrow="Fire detections" label="Fire count" metricKey="fireCount" title="Monthly fire activity" />
        <LineChart
          data={annualTrend}
          eyebrow="Correlation proxy"
          primaryKey="no2"
          primaryLabel="NO₂"
          secondaryKey="fireCount"
          secondaryLabel="Fire count"
          title="NO₂ and fire trend"
        />
        <LineChart
          data={comparison}
          eyebrow="Season split"
          primaryKey="dry"
          primaryLabel="Dry NO₂"
          secondaryKey="wet"
          secondaryLabel="Wet NO₂"
          title="Dry vs wet season NO₂"
          unit=" ppb"
        />
      </section>
    </div>
  );
}

export function ReportsView() {
  const { filters, setFilters } = useObservatoryFilters();
  const updateFilters = (next: Filters) => setFilters((current) => ({ ...current, ...next }));
  const metrics = getSummaryMetrics(filters);
  const ranking = getCountryRanking(filters);
  const top = ranking[0];

  return (
    <div className="page-stack reports-page">
      <PageIntro
        eyebrow="Reports"
        title="Generate exposure briefing"
        body="Create a browser-ready report from the current sample selection, then export CSV, GeoJSON, or print to PDF."
        filters={filters}
      />
      <FilterBar filters={filters} onChange={updateFilters} />
      <section className="report-layout">
        <article className="report-preview">
          <span className="eyebrow">Auto-generated summary</span>
          <h2>{getCountryName(filters.countryId)} NO₂ exposure briefing, {filters.year}</h2>
          <p>
            Mean NO₂ is {metrics[0].value}, with {metrics[1].value} in population-weighted exposure and {metrics[2].value}
            active fire detections in the selected sample window.
          </p>
          <p>
            The highest-ranked country in the current selection is {top?.name ?? "not available"}, with {top?.no2.toFixed(1) ?? "0"}
            ppb average NO₂ and {top?.hotspotShare ?? 0}% of its sampled hotspots in the top quartile.
          </p>
          <ul>
            <li>Hotspot thresholding uses the selected sample top quartile.</li>
            <li>Dry season months are November through April.</li>
            <li>Population exposure is NO₂ multiplied by population in the sample grid.</li>
          </ul>
        </article>
        <aside className="report-actions">
          <ExportButtons filters={filters} />
          <RankingTable rows={ranking.slice(0, 5)} selectedId={filters.countryId} onSelect={(countryId) => setFilters({ ...filters, countryId, cityId: "all" })} />
        </aside>
      </section>
    </div>
  );
}

export function AdminView() {
  const jobs = [
    { label: "Sentinel-5P adapter", status: "Ready", icon: Database },
    { label: "FIRMS fire adapter", status: "Ready", icon: UploadCloud },
    { label: "WorldPop exposure join", status: "Queued", icon: Play },
    { label: "Scientific QA checks", status: "Passing", icon: ShieldCheck }
  ];

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">Admin</span>
          <h1>Pipeline operations</h1>
          <p>Monitor the sample-first ETL path and the live-data adapters reserved for production credentials.</p>
        </div>
      </header>
      <section className="admin-grid">
        {jobs.map((job) => {
          const Icon = job.icon;
          return (
            <article className="admin-card" key={job.label}>
              <Icon size={22} aria-hidden />
              <strong>{job.label}</strong>
              <span>{job.status}</span>
              <button type="button">Run job</button>
            </article>
          );
        })}
      </section>
      <article className="ops-log">
        <span className="eyebrow">Recent events</span>
        <p>2026-05-26 09:30 UTC - Sample NO₂ grid loaded for 12 countries.</p>
        <p>2026-05-26 09:33 UTC - Top quartile hotspot cache refreshed.</p>
        <p>2026-05-26 09:35 UTC - Report export endpoint ready for browser print workflow.</p>
      </article>
    </div>
  );
}

function PageIntro({
  eyebrow,
  title,
  body,
  filters
}: {
  eyebrow: string;
  title: string;
  body: string;
  filters: Filters;
}) {
  return (
    <header className="page-header">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{body}</p>
      </div>
      <ExportButtons filters={filters} />
    </header>
  );
}
