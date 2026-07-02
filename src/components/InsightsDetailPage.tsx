import Link from "next/link";
import type { ReactNode } from "react";
import { BrandedNavbar } from "@/components/BrandedNavbar";
import {
  AnnualNpweiTrendChart,
  CityHotspotsChart,
  CountryRankingChart,
  RiskTierChart,
  SeasonalCycleChart
} from "@/components/Charts";
import {
  getAverageCityNpwei,
  getCityRows,
  getCountryRows,
  getHealthSeasonSummary,
  getWebDataYearRange
} from "@/data/webData";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  CalendarDays,
  Factory,
  Satellite,
  Sprout,
  Trophy,
  UsersRound,
  Wind
} from "lucide-react";

export function InsightsDetailPage() {
  const annualHealth = getHealthSeasonSummary("Annual");
  const topCity = getCityRows("Annual")[0];
  const dryWetGap = Math.round(getAverageCityNpwei("DJF") - getAverageCityNpwei("JJA"));
  const yearRange = getWebDataYearRange();
  const cityCount = getCityRows("Annual").length;
  const countryCount = getCountryRows("Annual").length;

  return (
    <main className="insights-detail-page">
      <BrandedNavbar className="insights-shared-nav" />

      <section className="insights-detail-shell" aria-labelledby="insights-detail-title">
        <div className="insights-detail-inner">
          <header className="insights-detail-heading">
            <div>
              <span className="insights-detail-kicker">
                <i aria-hidden />
                Platform insights
              </span>
              <h1 id="insights-detail-title">West Africa NO{"\u2082"} Exposure at a Glance</h1>
              <p>
                Key metrics and trends - Sentinel-5P TROPOMI - {yearRange} - {cityCount} cities across {countryCount} countries
              </p>
            </div>
            <Link className="insights-dashboard-link" href="/map">
              <span>Explore Map</span>
              <ArrowRight size={15} aria-hidden />
            </Link>
          </header>

          <section className="insights-kpi-grid" aria-label="Exposure summary">
            <InsightKpi
              accent="red"
              icon={Wind}
              label="West Africa Avg NPWEI"
              meta="/100 - Annual Mean"
              value={String(annualHealth.wa_npwei)}
            />
            <InsightKpi
              accent="orange"
              icon={Trophy}
              label="Highest Exposure City"
              meta={`${topCity.npwei}/100 NPWEI`}
              value={topCity.name}
            />
            <InsightKpi
              accent="blue"
              icon={UsersRound}
              label="Pop at High Risk"
              meta="NPWEI >= 60"
              value={`${annualHealth.high_risk_population_millions.toFixed(1)}M`}
            />
            <InsightKpi
              accent="green"
              icon={CalendarDays}
              label="Dry-Wet Season Gap"
              meta="DJF vs JJA average"
              value={`${dryWetGap >= 0 ? "+" : ""}${dryWetGap} pts`}
            />
          </section>

          <section className="insights-chart-grid" aria-label="Exposure charts">
            <InsightPanel
              label={yearRange}
              subtitle="Annual - DJF - JJA - West Africa average"
              title="Yearly NPWEI Trend"
            >
              <AnnualNpweiTrendChart />
            </InsightPanel>
            <InsightPanel
              label="Annual NPWEI"
              subtitle="Top countries by exposure score"
              title="Country Rankings"
            >
              <CountryRankingChart />
            </InsightPanel>
            <InsightPanel
              label="Dry vs Wet"
              subtitle="Monthly NPWEI pattern - West Africa"
              title="Seasonal Cycle"
            >
              <SeasonalCycleChart />
            </InsightPanel>
          </section>

          <section className="insights-main-grid" aria-label="Detailed exposure charts">
            <InsightPanel
              className="city-hotspots-panel"
              label="Annual Mean NPWEI"
              subtitle="Cities ranked by population-weighted NO2 exposure score"
              title="Top 10 City Hotspots"
            >
              <CityHotspotsChart />
            </InsightPanel>
            <InsightPanel
              label="Urban Pop (M)"
              subtitle="People in each NPWEI exposure tier"
              title="Population by Risk Tier"
            >
              <RiskTierChart />
            </InsightPanel>
          </section>

          <section className="insights-note-grid" aria-label="Key findings">
            <InsightNote
              body="Harmattan winds (DJF) suppress vertical mixing and concentrate NO2 near the surface, driving NPWEI significantly higher than the wet season across all cities."
              icon={Sprout}
              title="Dry Season Dominance"
            />
            <InsightNote
              body="Major port and industrial cities consistently record Very High NPWEI tiers, driven by dense traffic, port emissions, and industrial activity."
              icon={Factory}
              title="Urban Industrial Hotspots"
            />
            <InsightNote
              body="TROPOMI L3 NO2 columns at 0.01 degree resolution, population-weighted using NASA Gridded 2020 data restricted to urban pixels >=50 ppl/km2."
              icon={Satellite}
              title="Satellite-Powered Evidence"
            />
          </section>
        </div>
      </section>
    </main>
  );
}

function InsightKpi({
  accent,
  icon: Icon,
  label,
  meta,
  value
}: {
  accent: string;
  icon: LucideIcon;
  label: string;
  meta: string;
  value: string;
}) {
  return (
    <article className={`insights-kpi-card ${accent}`}>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{meta}</small>
      </div>
      <Icon size={24} aria-hidden />
    </article>
  );
}

function InsightPanel({
  children,
  className = "",
  label,
  subtitle,
  title
}: {
  children: ReactNode;
  className?: string;
  label: string;
  subtitle: string;
  title: string;
}) {
  return (
    <article className={`insights-panel ${className}`}>
      <header>
        <h2>{title}</h2>
        <span>{label}</span>
      </header>
      <p>{subtitle}</p>
      <div className="insights-panel-visual">{children}</div>
    </article>
  );
}

function InsightNote({ body, icon: Icon, title }: { body: string; icon: LucideIcon; title: string }) {
  return (
    <article className="insights-note">
      <Icon size={27} aria-hidden />
      <div>
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
    </article>
  );
}
