"use client";

import { useMemo } from "react";
import { BarChart3, Building2, Flame, Lightbulb, Trophy, UsersRound, Wind } from "lucide-react";
import { BarChart, LineChart } from "@/components/Charts";
import { ExposureMap } from "@/components/ExposureMap";
import { OverviewRankingTable } from "@/components/OverviewRankingTable";
import { useObservatoryFilters } from "@/components/ObservatoryContext";
import {
  NO2_COLUMN_UNIT_LABEL,
  getHotspots,
  getOverviewAnnualTrend,
  getOverviewMonthlyCycle
} from "@/data/sampleData";

const OVERVIEW_LAYERS = {
  no2: true,
  fire: true,
  population: true
};

export function DashboardView() {
  const { filters, setFilters } = useObservatoryFilters();
  const annualTrend = useMemo(() => getOverviewAnnualTrend(filters), [filters]);
  const monthlyCycle = useMemo(() => getOverviewMonthlyCycle(filters), [filters]);
  const hotspots = useMemo(() => getHotspots(filters), [filters]);
  const topHotspot = hotspots[0];
  const selectCountry = (countryId: string) => {
    setFilters((current) => ({ ...current, countryId, cityId: "all" }));
  };

  return (
    <div className="page-stack overview-page">
      <OverviewKpis />

      <section className="dashboard-grid overview-main-grid">
        <ExposureMap
          activeLayers={OVERVIEW_LAYERS}
          compact
          filters={filters}
          selectedCountryId={filters.countryId}
          onSelectCountry={selectCountry}
        />
        <OverviewRankingTable />
      </section>

      <section className="overview-bottom-grid">
        <LineChart
          data={annualTrend}
          eyebrow="NO₂ column trend (West Africa average)"
          primaryKey="no2"
          primaryLabel="NO₂ column"
          title="2020-2024 trend"
          unit={` ${NO2_COLUMN_UNIT_LABEL}`}
        />
        <BarChart data={monthlyCycle} eyebrow="Monthly cycle (West Africa average)" label="NO₂ column" metricKey="no2" title="Monthly cycle" />
        <FireActivityCard />
        <InsightsCard
          topHotspot={topHotspot?.label ?? "Lagos"}
        />
      </section>

      <footer className="observatory-footer">
        <section>
          <h2>About the Data</h2>
          <p>Sentinel-5P TROPOMI Level-2 Tropospheric Column Density (OFFL) QA-filtered.</p>
        </section>
        <section>
          <h2>Important Note</h2>
          <p>Satellite NO₂ column represents total atmospheric NO₂ and is not a direct surface concentration.</p>
        </section>
        <section>
          <h2>Contact</h2>
          <p>westafrica.no2.observatory@gmail.com</p>
        </section>
      </footer>
    </div>
  );
}

function OverviewKpis() {
  return (
    <section className="target-kpi-grid" aria-label="Overview metrics">
      <article className="target-kpi-card">
        <BarChart3 className="kpi-icon purple" size={38} aria-hidden />
        <span>West Africa average NO{"\u2082"} column (2024)</span>
        <strong>2.45</strong>
        <small>×10{"\u00B9\u2075"} molecules cm{"\u207B\u00B2"}</small>
        <em>2020-2024 mean</em>
      </article>
      <article className="target-kpi-card">
        <Trophy className="kpi-icon orange" size={40} aria-hidden />
        <span>Highest NO{"\u2082"} column country</span>
        <strong>
          <b>Nigeria</b> 4.72
        </strong>
        <small>×10{"\u00B9\u2075"} molecules cm{"\u207B\u00B2"}</small>
        <em>2024 mean</em>
      </article>
      <article className="target-kpi-card">
        <Building2 className="kpi-icon green" size={40} aria-hidden />
        <span>Highest NO{"\u2082"} column urban hotspot</span>
        <strong>
          <b>Lagos, Nigeria</b> 8.61
        </strong>
        <small>×10{"\u00B9\u2075"} molecules cm{"\u207B\u00B2"}</small>
        <em>2024 mean</em>
      </article>
      <article className="target-kpi-card">
        <UsersRound className="kpi-icon blue" size={40} aria-hidden />
        <span>Population in high column hotspot zones*</span>
        <strong>196.8 Million</strong>
        <small>32% of West Africa population</small>
        <em>*Top 25% highest NO{"\u2082"} column areas</em>
      </article>
      <article className="target-kpi-card range-card">
        <span>NO{"\u2082"} column range (2024)</span>
        <strong>West Africa</strong>
        <i />
        <div>
          <small>0</small>
          <small>≥ 10</small>
        </div>
        <em>×10{"\u00B9\u2075"} molecules cm{"\u207B\u00B2"}</em>
      </article>
    </section>
  );
}

function FireActivityCard() {
  return (
    <article className="chart-card fire-card target-fire-card">
      <header className="panel-header">
        <span>Fire activity (VIIRS FRP)</span>
        <strong>Mean FRP (MW)</strong>
      </header>
      <div className="fire-mini-map target-fire-map" aria-label="Fire activity mini map">
        {[...Array(90)].map((_, index) => (
          <span
            className="target-fire-dot"
            key={index}
            style={{
              left: `${6 + ((index * 17) % 88)}%`,
              top: `${12 + ((index * 31) % 72)}%`,
              opacity: `${0.35 + (index % 7) * 0.08}`
            }}
          />
        ))}
      </div>
      <div className="target-fire-footer">
        <button type="button">Mar 2024</button>
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
          Elevated NO{"\u2082"} column occurs during the dry season due to biomass burning and unfavorable meteorology.
        </p>
        <p>
          <UsersRound className="insight green" size={18} aria-hidden />
          About 196.8 million people (32% of West Africa population) live in high-column NO{"\u2082"} hotspot zones.
        </p>
        <p>
          <Wind className="insight blue" size={18} aria-hidden />
          {topHotspot}, Kano, Abidjan and Accra are among the highest NO{"\u2082"} column urban hotspots.
        </p>
      </div>
    </article>
  );
}
