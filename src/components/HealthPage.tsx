"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Chart from "chart.js/auto";
import type { ChartConfiguration } from "chart.js";
import {
  AlertTriangle,
  ArrowRight,
  Baby,
  Building2,
  CloudRain,
  Database,
  Download,
  HeartPulse,
  Lightbulb,
  MapPin,
  Printer,
  ShieldAlert,
  Sun,
  UsersRound
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  RISK_TIER_ORDER,
  SEASON_LABELS,
  WEB_DATA_SEASONS,
  buildHealthCsv,
  getCityRows,
  getCountryRows,
  getHealthHighRiskCities,
  getHealthHighRiskCountries,
  getHealthSeasonSummary,
  getHighRiskCityCount,
  getHighRiskCountryCount,
  getRiskTier,
  getWebDataYearRange,
  type CityNpweiRow,
  type HealthRiskTierRow,
  type RiskTierLabel,
  type WebDataSeason
} from "@/data/webData";
import { useBackendWebData } from "@/data/useWebData";
import { BrandedNavbar } from "@/components/BrandedNavbar";
import { useTheme } from "@/components/ThemeProvider";

const ALL_CITIES = "all";
const CITY_EXPOSURE_PAGE_SIZE = 16;

export function HealthPage() {
  const { version: dataVersion } = useBackendWebData();
  const [season, setSeason] = useState<WebDataSeason>("Annual");
  const [cityFocus, setCityFocus] = useState(ALL_CITIES);
  const yearRange = useMemo(() => {
    void dataVersion;
    return getWebDataYearRange();
  }, [dataVersion]);

  const summary = getHealthSeasonSummary(season);
  const cityRows = useMemo(() => {
    void dataVersion;
    return getCityRows(season);
  }, [dataVersion, season]);
  const cityTierRows = useMemo(() => getCityRiskTierRows(cityRows), [cityRows]);
  const displayedCityRows = useMemo(
    () => (cityFocus === ALL_CITIES ? cityRows : cityRows.filter((row) => row.name === cityFocus)),
    [cityFocus, cityRows]
  );
  const seasonalRows = useMemo(() => {
    void dataVersion;
    return getSeasonalHighRiskRows();
  }, [dataVersion]);
  const highRiskCityCount = getHighRiskCityCount(season);
  const highRiskCountryCount = getHighRiskCountryCount(season);
  const countryCount = getCountryRows(season).length;

  const exportCsv = () => {
    const blob = new Blob([buildHealthCsv(season)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `wa_no2_health_${season}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="branded-data-page health-page">
      <BrandedNavbar />

      <section className="data-page-shell health-dashboard-shell" aria-labelledby="health-title">
        <div className="data-page-inner health-dashboard-inner">
          <HealthHeader
            season={season}
            yearRange={yearRange}
            onExportCsv={exportCsv}
            onPrint={() => window.print()}
          />

          <section className="health-warning-banner" aria-label="Health interpretation disclaimer">
            <AlertTriangle size={18} aria-hidden />
            <p>
              <strong>Important:</strong> Population figures are estimated from NASA Gridded Population 2020 urban pixels.
              These are exposure estimates based on satellite-derived NO{"\u2082"} columns, not clinical health outcomes.
              No mortality or hospitalisation rates are implied.
            </p>
          </section>

          <section className="health-filter-panel" aria-label="Health filters">
            <label>
              <span>Season</span>
              <select value={season} onChange={(event) => setSeason(event.target.value as WebDataSeason)}>
                {WEB_DATA_SEASONS.map((item) => (
                  <option key={item} value={item}>
                    {SEASON_LABELS[item]}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>City Focus</span>
              <select value={cityFocus} onChange={(event) => setCityFocus(event.target.value)}>
                <option value={ALL_CITIES}>All Cities</option>
                {cityRows.map((row) => (
                  <option key={row.name} value={row.name}>
                    {row.name}, {row.country}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="health-kpi-grid" aria-label="Health impact summary">
            <HealthKpiCard
              accent="red"
              icon={ShieldAlert}
              label="High + Very High Risk Pop"
              meta={`NPWEI >= 60 - ${SEASON_LABELS[season]}`}
              value={`${summary.high_risk_population_millions.toFixed(1)}M`}
            />
            <HealthKpiCard
              accent="orange"
              icon={UsersRound}
              label="% Urban Pop High Risk"
              meta={`of urban West Africa - ${SEASON_LABELS[season]}`}
              value={`${summary.high_risk_pct_urban.toFixed(1)}%`}
            />
            <HealthKpiCard
              accent="blue"
              icon={MapPin}
              label="High-Risk Cities"
              meta={`of ${cityRows.length} cities - NPWEI >= 60`}
              value={String(highRiskCityCount)}
            />
            <HealthKpiCard
              accent="purple"
              icon={HeartPulse}
              label="High-Risk Countries"
              meta={`of ${countryCount} countries - NPWEI >= 60`}
              value={String(highRiskCountryCount)}
            />
          </section>

          <RiskTierDistribution season={season} tierRows={cityTierRows} />

          <section className="health-chart-grid" aria-label="Health charts">
            <RiskTierBarChart season={season} tierRows={cityTierRows} />
            <SeasonalHighRiskChart rows={seasonalRows} />
          </section>

          <CityExposureGrid cityFocus={cityFocus} rows={displayedCityRows} season={season} totalCities={cityRows.length} />

          <HealthInsightGrid season={season} />
        </div>
      </section>
    </main>
  );
}

function HealthHeader({
  onExportCsv,
  onPrint,
  season,
  yearRange
}: {
  onExportCsv: () => void;
  onPrint: () => void;
  season: WebDataSeason;
  yearRange: string;
}) {
  return (
    <header className="health-hero">
      <div>
        <span className="health-hero-kicker">
          <HeartPulse size={12} aria-hidden />
          Health Impact
        </span>
        <h1 id="health-title">Population Exposure &amp; Health Risk</h1>
        <p>
          Urban NO{"\u2082"} health burden across West African cities - NPWEI tiers - {yearRange} - {SEASON_LABELS[season]}
        </p>
      </div>

      <div className="health-hero-actions" aria-label="Health export actions">
        <button type="button" onClick={onExportCsv}>
          <Download size={16} aria-hidden />
          <span>CSV</span>
        </button>
        <button type="button" onClick={onPrint}>
          <Printer size={16} aria-hidden />
          <span>PDF</span>
        </button>
      </div>
    </header>
  );
}

function HealthKpiCard({
  accent,
  icon: Icon,
  label,
  meta,
  value
}: {
  accent: "blue" | "orange" | "purple" | "red";
  icon: LucideIcon;
  label: string;
  meta: string;
  value: string;
}) {
  return (
    <article className={`health-kpi-card ${accent}`}>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{meta}</small>
      </div>
      <Icon size={24} aria-hidden />
    </article>
  );
}

function RiskTierDistribution({ season, tierRows }: { season: WebDataSeason; tierRows: HealthRiskTierRow[] }) {
  return (
    <section className="health-panel health-tier-distribution" aria-labelledby="risk-tier-distribution-title">
      <header className="health-panel-header">
        <div>
          <h2 id="risk-tier-distribution-title">Population by Risk Tier</h2>
        </div>
        <strong>{SEASON_LABELS[season]}</strong>
      </header>

      <div className="health-tier-row-list">
        {tierRows.map((tier) => (
          <article className="health-tier-meter-row" key={tier.label}>
            <i aria-hidden style={{ backgroundColor: tier.color }} />
            <span>{tier.label}</span>
            <div className="health-tier-meter" aria-hidden>
              <b style={{ backgroundColor: tier.color, width: `${Math.max(tier.share, tier.populationMillions > 0 ? 2 : 0)}%` }} />
            </div>
            <strong>{tier.populationMillions.toFixed(1)}M</strong>
            <small>{tier.share.toFixed(0)}%</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function RiskTierBarChart({ season, tierRows }: { season: WebDataSeason; tierRows: HealthRiskTierRow[] }) {
  const axisMax = Math.max(100, Math.ceil(Math.max(...tierRows.map((row) => row.populationMillions), 1) / 50) * 50);

  return (
    <article className="health-panel health-chart-card">
      <header className="health-panel-header">
        <div>
          <h2>Risk Tier Population</h2>
          <p>Urban pop (millions) per NPWEI tier</p>
        </div>
        <strong>{SEASON_LABELS[season]}</strong>
      </header>

      <HealthBarChart
        ariaLabel="Risk tier population bar chart"
        colors={tierRows.map((tier) => tier.color)}
        labels={tierRows.map((tier) => tier.label)}
        max={axisMax}
        values={tierRows.map((tier) => tier.populationMillions)}
      />
    </article>
  );
}

function SeasonalHighRiskChart({ rows }: { rows: Array<{ label: string; season: WebDataSeason; value: number }> }) {
  const axisMax = Math.max(300, Math.ceil(Math.max(...rows.map((row) => row.value), 1) / 50) * 50);

  return (
    <article className="health-panel health-chart-card">
      <header className="health-panel-header">
        <div>
          <h2>Annual vs DJF vs JJA High-Risk Population</h2>
          <p>Population at NPWEI &gt;= 60 (millions)</p>
        </div>
        <strong>Seasonal</strong>
      </header>

      <HealthBarChart
        ariaLabel="Seasonal high-risk population bar chart"
        colors={["#3b82f6", "#f97316", "#22c55e"]}
        labels={rows.map((row) => row.label)}
        max={axisMax}
        values={rows.map((row) => row.value)}
      />
    </article>
  );
}

function HealthBarChart({
  ariaLabel,
  colors,
  labels,
  max,
  values
}: {
  ariaLabel: string;
  colors: string[];
  labels: string[];
  max: number;
  values: number[];
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { resolvedTheme } = useTheme();
  const chartAxisColor = resolvedTheme === "night" ? "#7f94a8" : "#cbd5e1";
  const chartGridColor = resolvedTheme === "night" ? "#243a50" : "#e7eef7";
  const chartTickColor = resolvedTheme === "night" ? "#a7b8c7" : "#526b91";

  useEffect(() => {
    if (!canvasRef.current) return;

    const config: ChartConfiguration<"bar", number[], string> = {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: colors,
            borderColor: colors,
            borderRadius: 6,
            borderSkipped: false,
            borderWidth: 1,
            hoverBackgroundColor: colors,
            maxBarThickness: labels.length <= 3 ? 180 : 112
          }
        ]
      },
      options: {
        animation: false,
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => `${Number(context.parsed.y).toFixed(1)}M`
            }
          }
        },
        scales: {
          x: {
            border: {
              color: chartAxisColor
            },
            grid: {
              display: false
            },
            ticks: {
              color: chartTickColor,
              font: {
                size: 11,
                weight: "700"
              },
              maxRotation: 0,
              minRotation: 0
            }
          },
          y: {
            beginAtZero: true,
            max,
            border: {
              color: chartAxisColor
            },
            grid: {
              color: chartGridColor
            },
            ticks: {
              color: chartTickColor,
              count: 6,
              font: {
                size: 11
              },
              callback: (value) => `${value}M`
            }
          }
        }
      }
    };

    const chart = new Chart(canvasRef.current, config);
    return () => chart.destroy();
  }, [chartAxisColor, chartGridColor, chartTickColor, colors, labels, max, values]);

  return (
    <div className="health-chart-canvas-wrap">
      <canvas aria-label={ariaLabel} ref={canvasRef} role="img" />
    </div>
  );
}

function CityExposureGrid({
  cityFocus,
  rows,
  season,
  totalCities
}: {
  cityFocus: string;
  rows: CityNpweiRow[];
  season: WebDataSeason;
  totalCities: number;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / CITY_EXPOSURE_PAGE_SIZE));
  const pageStart = (currentPage - 1) * CITY_EXPOSURE_PAGE_SIZE;
  const pageEnd = Math.min(pageStart + CITY_EXPOSURE_PAGE_SIZE, rows.length);
  const pageRows = useMemo(() => rows.slice(pageStart, pageEnd), [pageEnd, pageStart, rows]);
  const pageItems = useMemo(() => getCityExposurePageItems(currentPage, totalPages), [currentPage, totalPages]);
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  useEffect(() => {
    setCurrentPage(1);
  }, [cityFocus, rows.length, season]);

  return (
    <section className="health-panel city-exposure-section" aria-labelledby="city-exposure-title">
      <header className="health-panel-header">
        <div>
          <h2 id="city-exposure-title">City-Level Exposure Summary</h2>
        </div>
        <strong>{cityFocus === ALL_CITIES ? SEASON_LABELS[season] : `${rows.length}/${totalCities}`}</strong>
      </header>

      <div className="city-exposure-grid">
        {pageRows.map((row) => (
          <article className="city-exposure-card" key={row.name}>
            <header>
              <i aria-hidden style={{ backgroundColor: row.riskColor }} />
              <h3>{row.name}</h3>
            </header>
            <dl className="city-exposure-stats">
              <div>
                <dt>Country</dt>
                <dd>{row.country}</dd>
              </div>
              <div>
                <dt>NPWEI</dt>
                <dd style={{ color: row.riskColor }}>{row.npwei}/100</dd>
              </div>
              <div>
                <dt>Risk</dt>
                <dd style={{ color: row.riskColor }}>{row.riskLabel}</dd>
              </div>
              <div>
                <dt>Urban Pop</dt>
                <dd>{row.urbanPop.toFixed(2)}M</dd>
              </div>
              <div>
                <dt>DJF / JJA</dt>
                <dd>
                  {row.djfNpwei} / {row.jjaNpwei}
                </dd>
              </div>
            </dl>
            <span className="city-exposure-score" aria-hidden>
              <b style={{ backgroundColor: row.riskColor, width: `${Math.max(row.npwei, 2)}%` }} />
            </span>
          </article>
        ))}
      </div>

      {totalPages > 1 ? (
        <footer className="city-exposure-pagination" aria-label="City exposure pagination">
          <p className="city-exposure-pagination-summary">
            Showing {pageStart + 1}-{pageEnd} of {rows.length} cities
          </p>

          <div className="city-exposure-pagination-controls">
            <button
              aria-label="Go to first city exposure page"
              className="city-exposure-page-button icon"
              disabled={isFirstPage}
              onClick={() => setCurrentPage(1)}
              type="button"
            >
              <span className="city-exposure-page-double-icon mirror" aria-hidden>
                <ArrowRight size={13} />
                <ArrowRight size={13} />
              </span>
            </button>
            <button
              aria-label="Go to previous city exposure page"
              className="city-exposure-page-button icon"
              disabled={isFirstPage}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              type="button"
            >
              <ArrowRight className="city-exposure-page-icon mirror" size={15} aria-hidden />
            </button>

            {pageItems.map((item) =>
              typeof item === "number" ? (
                <button
                  aria-current={item === currentPage ? "page" : undefined}
                  aria-label={`Go to city exposure page ${item}`}
                  className={`city-exposure-page-button${item === currentPage ? " active" : ""}`}
                  key={item}
                  onClick={() => setCurrentPage(item)}
                  type="button"
                >
                  {item}
                </button>
              ) : (
                <span className="city-exposure-pagination-ellipsis" key={item} aria-hidden>
                  ...
                </span>
              )
            )}

            <button
              aria-label="Go to next city exposure page"
              className="city-exposure-page-button icon"
              disabled={isLastPage}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              type="button"
            >
              <ArrowRight className="city-exposure-page-icon" size={15} aria-hidden />
            </button>
            <button
              aria-label="Go to last city exposure page"
              className="city-exposure-page-button icon"
              disabled={isLastPage}
              onClick={() => setCurrentPage(totalPages)}
              type="button"
            >
              <span className="city-exposure-page-double-icon" aria-hidden>
                <ArrowRight size={13} />
                <ArrowRight size={13} />
              </span>
            </button>
          </div>
        </footer>
      ) : null}
    </section>
  );
}

type CityExposurePageItem = number | "start-ellipsis" | "end-ellipsis";

function getCityExposurePageItems(currentPage: number, totalPages: number): CityExposurePageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items: CityExposurePageItem[] = [1];
  const windowStart = Math.max(2, currentPage - 1);
  const windowEnd = Math.min(totalPages - 1, currentPage + 1);

  if (windowStart > 2) {
    items.push("start-ellipsis");
  }

  for (let page = windowStart; page <= windowEnd; page += 1) {
    items.push(page);
  }

  if (windowEnd < totalPages - 1) {
    items.push("end-ellipsis");
  }

  items.push(totalPages);
  return items;
}

function HealthInsightGrid({ season }: { season: WebDataSeason }) {
  const yearRange = getWebDataYearRange();

  return (
    <section className="health-panel health-insight-section" aria-labelledby="health-insights-title">
      <header className="health-panel-header">
        <Lightbulb size={14} aria-hidden />
        <h2 id="health-insights-title">Health Risk Insights</h2>
      </header>

      <div className="health-insight-grid">
        {getHealthInterpretations(season, yearRange).map((card) => {
          const Icon = card.icon;
          return (
            <article className={`health-insight-card health-insight-card-${card.tone}`} key={card.title}>
              <Icon size={18} aria-hidden />
              <div>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function getSeasonalHighRiskRows() {
  return WEB_DATA_SEASONS.map((season) => ({
    label: season === "Annual" ? "Annual" : season === "DJF" ? "Dry (DJF)" : "Wet (JJA)",
    season,
    value: getHealthSeasonSummary(season).high_risk_population_millions
  }));
}

function getCityRiskTierRows(rows: CityNpweiRow[]): HealthRiskTierRow[] {
  const totals = RISK_TIER_ORDER.reduce(
    (accumulator, label) => ({ ...accumulator, [label]: 0 }),
    {} as Record<RiskTierLabel, number>
  );

  rows.forEach((row) => {
    totals[row.riskLabel] += row.urbanPop;
  });

  const total = Object.values(totals).reduce((sum, value) => sum + value, 0);
  const representativeScores: Record<RiskTierLabel, number> = {
    "Very High": 80,
    High: 60,
    Moderate: 40,
    Low: 20,
    Minimal: 0
  };

  return RISK_TIER_ORDER.map((label) => {
    const risk = getRiskTier(representativeScores[label]);
    const populationMillions = totals[label];

    return {
      color: risk.color,
      label,
      populationMillions,
      share: total > 0 ? (populationMillions / total) * 100 : 0,
      tone: risk.tone
    };
  });
}

function getHealthInterpretations(
  season: WebDataSeason,
  yearRange: string
): Array<{ body: string; icon: LucideIcon; title: string; tone: "amber" | "blue" | "green" | "pink" | "purple" }> {
  const topCountry = getHealthHighRiskCountries(season)[0];
  const topCity = getHealthHighRiskCities(season)[0];
  const veryHighCities = getCityRows(season)
    .filter((row) => row.riskLabel === "Very High")
    .map((row) => row.name);
  const veryHighCityText = veryHighCities.length > 0 ? veryHighCities.join(", ") : topCity?.city ?? "Lagos";
  const dryAdditional = Math.max(
    0,
    getHealthSeasonSummary("DJF").high_risk_population_millions -
      getHealthSeasonSummary("Annual").high_risk_population_millions
  );

  return [
    {
      body: `${topCountry?.country ?? "Nigeria"} records the highest NPWEI (${topCountry?.npwei ?? 100}/100) driven by dense urban-industrial activity.`,
      icon: Building2,
      title: "Highest Burden Country",
      tone: "blue"
    },
    {
      body: `An additional ~${dryAdditional.toFixed(1)}M people enter high-risk zones during the dry season (DJF) due to Harmattan-suppressed vertical mixing.`,
      icon: Sun,
      title: "Dry Season Health Burden",
      tone: "green"
    },
    {
      body: `Cities at Very High tier include ${veryHighCityText}. Residents face chronic NO\u2082 exposure likely exceeding WHO 2021 guidelines.`,
      icon: MapPin,
      title: "Very High Urban Hotspots",
      tone: "blue"
    },
    {
      body: "Children, elderly, and people with respiratory conditions in high-exposure zones face disproportionate health risk.",
      icon: Baby,
      title: "Vulnerable Populations",
      tone: "amber"
    },
    {
      body: "Monsoon ventilation during JJA reduces NO\u2082 burden across most cities, a natural seasonal respite.",
      icon: CloudRain,
      title: "Wet Season Relief",
      tone: "pink"
    },
    {
      body: `All estimates use Sentinel-5P TROPOMI NO\u2082 columns (${yearRange}), population-weighted via NASA Gridded Population 2020 at >=50 ppl/km2.`,
      icon: Database,
      title: "Data Basis",
      tone: "purple"
    }
  ];
}
