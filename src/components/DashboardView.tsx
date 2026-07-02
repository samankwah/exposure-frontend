"use client";

import { useMemo } from "react";
import { BarChart3, Building2, Flame, HelpCircle, Lightbulb, Trophy, UsersRound, Wind } from "lucide-react";
import { LineChart, MonthlyCycleChart } from "@/components/Charts";
import { ObservatoryFooter } from "@/components/ObservatoryFooter";
import { OverviewRankingTable } from "@/components/OverviewRankingTable";
import { TargetNpweiMap } from "@/components/TargetNpweiMap";
import { useObservatoryFilters } from "@/components/ObservatoryContext";
import { useBackendWebData } from "@/data/useWebData";
import type { Filters } from "@/types/exposure";
import {
  NO2_COLUMN_UNIT_LABEL,
  getCityRows,
  getOverviewAnnualTrend,
  getOverviewHotspots,
  getOverviewMonthlyCycle,
  getOverviewSummaryMetrics,
  type CityNpweiRow
} from "@/data/webData";

export function DashboardView() {
  const { filters } = useObservatoryFilters();
  const { version: dataVersion } = useBackendWebData();
  const annualTrend = useMemo(() => {
    void dataVersion;
    return getOverviewAnnualTrend(filters);
  }, [dataVersion, filters]);
  const monthlyCycle = useMemo(() => {
    void dataVersion;
    return getOverviewMonthlyCycle(filters);
  }, [dataVersion, filters]);
  const hotspots = useMemo(() => {
    void dataVersion;
    return getOverviewHotspots(filters);
  }, [dataVersion, filters]);
  const cityRows = useMemo(() => {
    void dataVersion;
    return getCityRows("Annual");
  }, [dataVersion]);
  const topHotspot = hotspots[0];

  return (
    <div className="page-stack overview-page">
      <OverviewKpis dataVersion={dataVersion} filters={filters} />

      <section className="dashboard-grid overview-main-grid">
        <OverviewMapCard cityRows={cityRows} filters={filters} />
        <OverviewRankingTable />
      </section>

      <section className="overview-bottom-grid">
        <LineChart
          data={annualTrend}
          eyebrow="NO2 column trend (West Africa average)"
          primaryKey="no2"
          primaryLabel="NO2 column"
          title="Trend"
          unit={` ${NO2_COLUMN_UNIT_LABEL}`}
          variant="overview"
        />
        <MonthlyCycleChart
          data={monthlyCycle}
          eyebrow="Monthly cycle (West Africa average)"
          title="Monthly cycle"
          unit={` ${NO2_COLUMN_UNIT_LABEL}`}
        />
        <SeasonalExposureCard cityRows={cityRows} filters={filters} />
        <InsightsCard topHotspot={topHotspot?.label ?? "Lagos"} />
      </section>

      <ObservatoryFooter />
    </div>
  );
}

function OverviewMapCard({
  cityRows,
  filters
}: {
  cityRows: CityNpweiRow[];
  filters: Filters;
}) {
  return (
    <article className="tropomi-map-card">
      <header className="tropomi-map-header">
        <span>
          Tropospheric NO{"\u2082"} column (TROPOMI)
          <HelpCircle size={15} aria-hidden />
        </span>
        <div className="map-selectors" aria-label="Map view controls">
          <select aria-label="Map statistic" defaultValue="annual">
            <option value="annual">Annual Mean</option>
          </select>
          <select aria-label="Map year" defaultValue={filters.year}>
            <option value={filters.year}>{filters.year}</option>
          </select>
          <button type="button" aria-label="Map information">
            ?
          </button>
        </div>
      </header>
      <div className="tropomi-map-body">
        <TargetNpweiMap layerMode="no2" month={filters.month === "all" ? 12 : filters.month} rows={cityRows} season="Annual" year={filters.year} />
      </div>
    </article>
  );
}

function OverviewKpis({ dataVersion, filters }: { dataVersion: number; filters: Filters }) {
  const metrics = useMemo(() => {
    void dataVersion;
    return getOverviewSummaryMetrics(filters);
  }, [dataVersion, filters]);
  const icons = [BarChart3, Trophy, Building2, UsersRound, BarChart3];
  const tones = ["purple", "orange", "green", "blue", "purple"];

  return (
    <section className="target-kpi-grid" aria-label="Overview metrics">
      {metrics.map((metric, index) => {
        const Icon = icons[index] ?? BarChart3;
        const tone = tones[index] ?? "purple";

        if (index === metrics.length - 1) {
          return (
            <article className="target-kpi-card range-card" key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <i />
              <div>
                <small>Low</small>
                <small>High</small>
              </div>
              <em>{metric.detail}</em>
            </article>
          );
        }

        return (
          <article className="target-kpi-card" key={metric.label}>
            <Icon className={`kpi-icon ${tone}`} size={index === 0 ? 38 : 40} aria-hidden />
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.detail}</small>
            <em>
              {metric.delta > 0 ? "+" : ""}
              {metric.delta}
            </em>
          </article>
        );
      })}
    </section>
  );
}

function SeasonalExposureCard({ cityRows, filters }: { cityRows: CityNpweiRow[]; filters: Filters }) {
  return (
    <article className="chart-card fire-card target-fire-card">
      <header className="panel-header">
        <span>Seasonal exposure layer</span>
        <strong>DJF population-weighted grid</strong>
      </header>
      <div className="fire-mini-map target-fire-map" aria-label="Seasonal exposure mini map">
        <TargetNpweiMap
          layerMode="population"
          month={3}
          rows={cityRows}
          season="DJF"
          year={filters.year}
        />
      </div>
      <div className="target-fire-footer">
        <button type="button">Mar {filters.year}</button>
        <span>Low</span>
        <i />
        <span>High</span>
      </div>
    </article>
  );
}

function InsightsCard({ topHotspot }: { topHotspot: string }) {
  return (
    <article className="chart-card insights-card target-insights">
      <header className="panel-header">
        <span>Key insights</span>
        <strong> </strong>
      </header>
      <div className="insight-list">
        <p>
          <Lightbulb className="insight purple" size={18} aria-hidden />
          High NO{"\u2082"} column hotspots are concentrated in major urban and industrial areas.
        </p>
        <p>
          <Flame className="insight orange" size={18} aria-hidden />
          Dry-season conditions increase relative exposure in the generated DJF dataset.
        </p>
        <p>
          <UsersRound className="insight green" size={18} aria-hidden />
          High-risk population is calculated from generated NPWEI risk tiers.
        </p>
        <p>
          <Wind className="insight blue" size={18} aria-hidden />
          {topHotspot} is among the highest generated NO{"\u2082"} column urban hotspots.
        </p>
      </div>
    </article>
  );
}
