import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CloudSun,
  Cog,
  Map,
  Satellite,
  UsersRound
} from "lucide-react";
import { BrandedNavbar } from "@/components/BrandedNavbar";
import {
  DEFAULT_FILTERS,
  NO2_COLUMN_UNIT_LABEL,
  getCityRows,
  getHealthSeasonSummary,
  getOverviewAnnualTrend,
  getOverviewHotspots,
  getOverviewMonthlyCycle,
  getWebDataObservationPeriod,
  getWebDataSummary,
  getWebDataYearRange,
  getWebDataYears,
  toNo2ColumnValue
} from "@/data/webData";
import { createPageMetadata } from "@/app/metadata";
import type { Hotspot, TrendPoint } from "@/types/exposure";

export const metadata = createPageMetadata({
  title: "West Africa Exposure Intelligence",
  description:
    "CLeNE provides interactive TROPOMI NO2 exposure intelligence, city rankings, seasonal trends, and health risk insights for West Africa.",
  path: "/",
  keywords: ["West Africa NO2", "TROPOMI", "urban exposure", "air quality dashboard"]
});

type InsightVisualKind = "monthly" | "annual" | "ranking";

const webDataSummary = getWebDataSummary();
const annualHealthSummary = getHealthSeasonSummary("Annual");
const coveredYears = Array.from(new Set([...webDataSummary.years_covered, ...getWebDataYears()])).sort((a, b) => a - b);
const yearRange = coveredYears.length > 0 ? getWebDataYearRange() : "No generated years";
const observationPeriod = getWebDataObservationPeriod();
const urbanPopulationMillions = webDataSummary.total_urban_population / 1_000_000;

const metrics = [
  { icon: Building2, value: String(getCityRows("Annual").length), label: "Cities Analyzed", tone: "blue" },
  { icon: Satellite, value: yearRange, label: "TROPOMI Observations", tone: "teal" },
  { icon: UsersRound, value: `${urbanPopulationMillions.toFixed(1)}M`, label: "Urban Pop Covered", tone: "green" },
  { icon: CloudSun, value: `${annualHealthSummary.wa_npwei}/100`, label: "WA Avg NPWEI", tone: "yellow" }
];

const monthlyCycle = getOverviewMonthlyCycle(DEFAULT_FILTERS);
const annualTrend = getOverviewAnnualTrend(DEFAULT_FILTERS);
const cityRanking = getOverviewHotspots(DEFAULT_FILTERS)
  .filter((hotspot) => Boolean(hotspot.cityId))
  .slice(0, 7);

const insightCards: {
  date: string;
  featured?: boolean;
  href: string;
  tags: string[];
  title: string;
  visual: InsightVisualKind;
}[] = [
  {
    title: "What TROPOMI NO₂ Patterns Reveal About West Africa's Urban Exposure",
    tags: ["Exposure", "Urban Hotspots", "NO₂", "West Africa"],
    date: "June 7, 2026",
    href: "/insights",
    visual: "monthly",
    featured: true
  },
  {
    title: "Dry-season fire activity is amplifying exposure risk across key transport corridors",
    tags: ["Fires", "Seasonality", "Public Health"],
    date: "May 28, 2026",
    href: "/insights",
    visual: "annual"
  },
  {
    title: "Cities with the highest population-weighted NO₂ exposure need targeted monitoring",
    tags: ["Cities", "Population", "Policy"],
    date: "May 10, 2026",
    href: "/insights",
    visual: "ranking"
  }
];

const methodologySteps = [
  {
    title: "Data Acquisition",
    body: `Monthly TROPOMI NO2 L3 files (.nc4) downloaded from NASA GES DISC for ${observationPeriod}. NASA Gridded 2020 population raster clipped to West Africa at 0.1 degree resolution.`
  },
  {
    title: "Urban Masking",
    body: "Pixel density computed accounting for latitude-varying cell area. Only pixels >=50 people/km2 contribute, isolating genuine urban exposure from sparse rural areas."
  },
  {
    title: "PWE Computation",
    body: "PWE = sum(population x NO2) / sum(population) per city and country. Seasonal means computed for DJF, JJA, and Annual using RegularGridInterpolator alignment."
  },
  {
    title: "Normalisation & Export",
    body: "Raw PWE normalised 0-100 per season: NPWEI = (PWE - min)/(max - min) x 100. Exported as JSON and PNG overlay tiles for web rendering."
  }
];

const riskScale = [
  { label: "Very High", range: "80-100", tone: "very-high", width: "92%" },
  { label: "High", range: "60-79", tone: "high", width: "72%" },
  { label: "Moderate", range: "40-59", tone: "moderate", width: "52%" },
  { label: "Low", range: "20-39", tone: "low", width: "31%" },
  { label: "Minimal", range: "0-19", tone: "minimal", width: "11%" }
];

export default function Home() {
  return (
    <main className="home-page">
      <BrandedNavbar />

      <section className="home-hero" aria-label="CLeNE NO₂ exposure intelligence platform">
        <div className="home-hero-bg" aria-hidden />
        <div className="home-hero-content">
          <h1>
            <span>West Africa&apos;s</span>
            <span>
              <strong>NO₂ Exposure</strong> Intelligence
            </span>
            <span>Platform</span>
          </h1>

          <p className="home-subtitle">
            Transforming Sentinel-5P TROPOMI observations and population data into city-level exposure insights for
            policymakers, researchers, and the public.
          </p>

          <div className="home-actions" aria-label="Primary actions">
            <Link className="home-cta primary" href="/insights">
              <BarChart3 size={25} aria-hidden />
              <span>View Insights</span>
              <ArrowRight className="home-cta-arrow" size={18} strokeWidth={2.5} aria-hidden />
            </Link>
            <Link className="home-cta" href="/map">
              <Map size={26} aria-hidden />
              <span>Explore Map</span>
              <ArrowRight className="home-cta-arrow" size={18} strokeWidth={2.5} aria-hidden />
            </Link>
          </div>
        </div>

        <div className="home-metrics" aria-label="Platform metrics">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <article className="home-metric" key={metric.label}>
                <Icon className={`home-metric-icon ${metric.tone}`} size={54} aria-hidden />
                <div>
                  <strong>{metric.value}</strong>
                  <span>{metric.label}</span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="home-insights" id="insights" aria-labelledby="home-insights-title">
        <div className="home-insights-inner">
          <div className="home-section-kicker">
            <span aria-hidden />
            <strong>INSIGHTS</strong>
          </div>

          <div className="home-insights-header">
            <div>
              <h2 id="home-insights-title">Latest Analysis</h2>
              <p>
                Explore recent CLENE analysis generated from Sentinel-5P TROPOMI observations, population exposure
                layers, and city-level air quality intelligence.
              </p>
            </div>
            <Link className="home-all-articles" href="/insights">
              <span>All articles</span>
              <ArrowRight size={17} strokeWidth={2.5} aria-hidden />
            </Link>
          </div>

          <div className="home-insight-grid">
            {insightCards.map((card) => (
              <Link className={card.featured ? "home-insight-card featured" : "home-insight-card"} href={card.href} key={card.title}>
                <div className={`home-insight-visual ${card.visual}`}>
                  <InsightVisual variant={card.visual} />
                </div>
                <div className="home-insight-body">
                  <p className="home-insight-tags">{card.tags.join(" · ")}</p>
                  <h3>{card.title}</h3>
                  <div className="home-insight-date">
                    <span>{card.date}</span>
                    <ArrowRight size={18} strokeWidth={2.5} aria-hidden />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="home-methodology" id="methodology" aria-labelledby="home-methodology-title">
        <div className="home-methodology-inner">
          <div className="home-section-kicker home-section-kicker-dark">
            <span aria-hidden />
            <strong>METHODOLOGY</strong>
          </div>

          <div className="home-methodology-header">
            <div>
              <h2 id="home-methodology-title">How We Compute the NPWEI</h2>
              <p>A four-step pipeline from raw satellite data to a normalised population exposure index.</p>
            </div>
            <div className="home-methodology-badge" aria-hidden>
              <Cog size={14} strokeWidth={2.8} aria-hidden />
              <span>4 steps</span>
            </div>
          </div>

          <div className="home-methodology-steps">
            {methodologySteps.map((step, index) => (
              <article className="home-methodology-step" key={step.title}>
                <span className="home-methodology-number">{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-risk" id="risk-scale" aria-labelledby="home-risk-title">
        <div className="home-risk-inner">
          <div className="home-section-kicker">
            <span aria-hidden />
            <strong>RISK CLASSIFICATION</strong>
          </div>

          <div className="home-risk-header">
            <div>
              <h2 id="home-risk-title">Understanding the NPWEI Risk Scale</h2>
              <p>
                The Normalised Population-Weighted Exposure Index (NPWEI) is scored 0-100 across five tiers. Cities and
                countries are benchmarked relative to each other within each season, making the index a comparative
                measure of relative urban NO2 burden.
              </p>

              <div className="home-risk-chips" aria-label="NPWEI risk categories">
                {riskScale
                  .slice()
                  .reverse()
                  .map((tier) => (
                    <span className={`home-risk-chip ${tier.tone}`} key={tier.label}>
                      <i aria-hidden />
                      {tier.label}
                    </span>
                  ))}
              </div>
            </div>

            <div className="home-risk-scale" aria-label="NPWEI score tiers">
              {riskScale.map((tier) => (
                <article className={`home-risk-row ${tier.tone}`} key={tier.label}>
                  <div className="home-risk-label">
                    <i className={tier.tone} aria-hidden />
                    <strong>{tier.label}</strong>
                  </div>
                  <span className="home-risk-range">{tier.range}</span>
                  <div className="home-risk-track" aria-hidden>
                    <span className={tier.tone} style={{ width: tier.width }} />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function InsightVisual({ variant }: { variant: InsightVisualKind }) {
  if (variant === "annual") return <AnnualTrendChart data={annualTrend} />;
  if (variant === "ranking") return <CityRankingChart data={cityRanking} />;
  return <MonthlyExposureChart data={monthlyCycle} />;
}

function MonthlyExposureChart({ data }: { data: TrendPoint[] }) {
  const frame = { bottom: 258, height: 310, left: 76, right: 112, top: 42, width: 700 };
  const no2Values = data.map((point) => point.no2 ?? 0);
  const fireValues = data.map((point) => point.fireCount ?? 0);
  const no2Axis = getNiceTicks(no2Values, { tickCount: 5 });
  const fireAxis = getNiceTicks(fireValues, { integer: true, tickCount: 5, zeroBased: true });
  const no2Scale = getLinearScaleFromDomain(no2Axis.domain, frame.bottom, frame.top);
  const fireScale = getLinearScaleFromDomain(fireAxis.domain, frame.bottom, frame.top);
  const chartRight = frame.width - frame.right;
  const plotInset = 18;
  const xStep = (chartRight - frame.left - plotInset * 2) / Math.max(1, data.length - 1);
  const xFor = (index: number) => frame.left + plotInset + index * xStep;
  const no2Line = data.map((point, index) => `${index === 0 ? "M" : "L"}${xFor(index).toFixed(1)} ${no2Scale(point.no2 ?? 0).toFixed(1)}`).join(" ");
  const no2Area = `${no2Line} L${xFor(data.length - 1).toFixed(1)} ${frame.bottom} L${frame.left} ${frame.bottom} Z`;
  const barWidth = Math.min(28, xStep * 0.46);

  return (
    <svg viewBox={`0 0 ${frame.width} ${frame.height}`} role="img" aria-label="Monthly NO₂ and fire activity chart">
      <ChartBackground frame={frame} showYAxis={false} tickValues={no2Axis.ticks} yScale={no2Scale} />
      <text className="chart-title" x={frame.left} y={20}>
        Monthly NO₂ column and fire detections
      </text>
      {data.map((point, index) => {
        const barY = fireScale(point.fireCount ?? 0);
        const barHeight = frame.bottom - barY;
        return (
          <rect
            className="chart-bar-fire"
            height={barHeight}
            key={point.label}
            rx="5"
            width={barWidth}
            x={xFor(index) - barWidth / 2}
            y={barY}
          />
        );
      })}
      <path className="chart-area-no2" d={no2Area} />
      <path className="chart-line-no2" d={no2Line} />
      {data.map((point, index) => (
        <circle className="chart-dot-no2" cx={xFor(index)} cy={no2Scale(point.no2 ?? 0)} key={`${point.label}-dot`} r="4" />
      ))}
      <ChartYAxisLabels
        formatValue={(value) => formatTickValue(value, no2Axis.step)}
        frame={frame}
        scale={no2Scale}
        ticks={no2Axis.ticks}
        title={NO2_COLUMN_UNIT_LABEL}
        values={no2Values}
      />
      <ChartYAxisLabels
        formatValue={(value) => Math.round(value).toLocaleString()}
        frame={frame}
        scale={fireScale}
        side="right"
        ticks={fireAxis.ticks}
        title="Fire detections"
        values={fireValues}
      />
      <g className="chart-axis">
        {data.map((point, index) =>
          index % 3 === 0 ? (
            <text key={`${point.label}-label`} textAnchor="middle" x={xFor(index)} y={frame.bottom + 26}>
              {point.label}
            </text>
          ) : null
        )}
      </g>
      <ChartLegend
        items={[
          ["NO₂ column", "no2"],
          ["Fire detections", "fire"]
        ]}
        x={frame.width - 272}
        y={18}
      />
    </svg>
  );
}

function AnnualTrendChart({ data }: { data: TrendPoint[] }) {
  const frame = { bottom: 208, height: 250, left: 54, right: 28, top: 66, width: 420 };
  const no2Values = data.map((point) => point.no2 ?? 0);
  const exposureValues = data.map((point) => point.exposure ?? 0);
  const no2Scale = getLinearScale(no2Values, frame.bottom, frame.top);
  const exposureScale = getLinearScale(exposureValues, frame.bottom, frame.top + 28);
  const xStep = (frame.width - frame.left - frame.right) / Math.max(1, data.length - 1);
  const xFor = (index: number) => frame.left + index * xStep;
  const no2Line = data.map((point, index) => `${index === 0 ? "M" : "L"}${xFor(index).toFixed(1)} ${no2Scale(point.no2 ?? 0).toFixed(1)}`).join(" ");
  const exposureLine = data
    .map((point, index) => `${index === 0 ? "M" : "L"}${xFor(index).toFixed(1)} ${exposureScale(point.exposure ?? 0).toFixed(1)}`)
    .join(" ");
  const exposureArea = `${exposureLine} L${xFor(data.length - 1).toFixed(1)} ${frame.bottom} L${frame.left} ${frame.bottom} Z`;

  return (
    <svg viewBox={`0 0 ${frame.width} ${frame.height}`} role="img" aria-label="Annual NO₂ and population exposure trend chart">
      <ChartBackground frame={frame} ticks={3} />
      <text className="chart-title" x={frame.left} y={24}>
        {yearRange} exposure trend
      </text>
      <path className="chart-area-exposure" d={exposureArea} />
      <path className="chart-line-exposure" d={exposureLine} />
      <path className="chart-line-no2" d={no2Line} />
      {data.map((point, index) => (
        <circle className="chart-dot-no2" cx={xFor(index)} cy={no2Scale(point.no2 ?? 0)} key={point.label} r="4" />
      ))}
      <ChartYAxisLabels frame={frame} values={no2Values} suffix="" />
      <g className="chart-axis">
        {data.map((point, index) => (
          <text key={point.label} textAnchor="middle" x={xFor(index)} y={frame.bottom + 24}>
            {index % 2 === 0 ? point.label : ""}
          </text>
        ))}
      </g>
      <ChartLegend
        items={[
          ["NO₂", "no2"],
          ["Exposure", "exposure"]
        ]}
        x={frame.left}
        y={40}
      />
    </svg>
  );
}

function CityRankingChart({ data }: { data: Hotspot[] }) {
  const frame = { bottom: 216, height: 250, left: 118, right: 50, top: 42, width: 420 };
  const ranking = data.map((hotspot) => ({
    ...hotspot,
    columnNo2: toNo2ColumnValue(hotspot.no2, "hotspot")
  }));
  const maxNo2 = Math.max(...ranking.map((hotspot) => hotspot.columnNo2), 1);
  const rowGap = 8;
  const rowHeight = (frame.bottom - frame.top - rowGap * (ranking.length - 1)) / ranking.length;
  const barWidth = (value: number) => ((frame.width - frame.left - frame.right) * value) / maxNo2;

  return (
    <svg viewBox={`0 0 ${frame.width} ${frame.height}`} role="img" aria-label="Top city NO₂ exposure ranking chart">
      <ChartBackground frame={frame} ticks={3} />
      <text className="chart-title" x={frame.left} y={24}>
        City NO₂ exposure ranking
      </text>
      {ranking.map((hotspot, index) => {
        const y = frame.top + index * (rowHeight + rowGap);
        return (
          <g key={hotspot.id}>
            <text className="chart-rank-label" dominantBaseline="middle" textAnchor="end" x={frame.left - 10} y={y + rowHeight / 2}>
              {hotspot.label}
            </text>
            <rect className="chart-bar-track" height={rowHeight} rx="6" width={frame.width - frame.left - frame.right} x={frame.left} y={y} />
            <rect className="chart-bar-ranking" height={rowHeight} rx="6" width={barWidth(hotspot.columnNo2)} x={frame.left} y={y} />
            <text className="chart-value-label" dominantBaseline="middle" x={frame.left + barWidth(hotspot.columnNo2) + 8} y={y + rowHeight / 2}>
              {hotspot.columnNo2.toFixed(2)}
            </text>
          </g>
        );
      })}
      <text className="chart-axis-title" x={frame.left} y={frame.height - 8}>
        {NO2_COLUMN_UNIT_LABEL}
      </text>
    </svg>
  );
}

function ChartBackground({
  frame,
  showYAxis = true,
  tickValues,
  ticks,
  yScale
}: {
  frame: { bottom: number; height: number; left: number; right: number; top: number; width: number };
  showYAxis?: boolean;
  ticks?: number;
  tickValues?: number[];
  yScale?: (value: number) => number;
}) {
  const gridLines =
    tickValues && yScale
      ? tickValues.map((value) => yScale(value))
      : Array.from({ length: ticks ?? 4 }, (_, index) => frame.top + ((frame.bottom - frame.top) * index) / Math.max(1, (ticks ?? 4) - 1));
  const axisPath = showYAxis ? `M${frame.left} ${frame.top}V${frame.bottom}H${frame.width - frame.right}` : `M${frame.left} ${frame.bottom}H${frame.width - frame.right}`;

  return (
    <>
      <path className="chart-grid-fill" d={`M0 0h${frame.width}v${frame.height}H0z`} />
      <path className="chart-grid-line" d={gridLines.map((y) => `M${frame.left} ${y.toFixed(1)}H${frame.width - frame.right}`).join(" ")} />
      <path className="chart-axis-line" d={axisPath} />
    </>
  );
}

function ChartYAxisLabels({
  frame,
  formatValue,
  scale,
  showAxis,
  side = "left",
  suffix = "",
  textAnchor,
  ticks,
  title,
  values
}: {
  formatValue?: (value: number) => string;
  frame: { bottom: number; left: number; right?: number; top: number; width?: number };
  scale?: (value: number) => number;
  showAxis?: boolean;
  side?: "left" | "right";
  suffix?: string;
  textAnchor?: "start" | "middle" | "end";
  ticks?: number[];
  title?: string;
  values: number[];
}) {
  const { max, min } = getExtent(values);
  const axisTicks = ticks ?? [max, min + (max - min) / 2, min];
  const valueScale = scale ?? getLinearScaleFromDomain([min, max], frame.bottom, frame.top);
  const chartRight = typeof frame.width === "number" && typeof frame.right === "number" ? frame.width - frame.right : frame.left;
  const axisX = side === "right" ? chartRight : frame.left;
  const tickSize = 6;
  const tickPadding = 8;
  const labelX = side === "right" ? axisX + tickSize + tickPadding : axisX - tickSize - tickPadding;
  const axisTitleX = side === "right" ? chartRight + 56 : Math.max(14, frame.left - 58);
  const axisTitleY = frame.top + (frame.bottom - frame.top) / 2;
  const resolvedTextAnchor = textAnchor ?? (side === "right" ? "start" : "end");
  const titleRotation = side === "right" ? 90 : -90;
  const renderAxis = showAxis ?? Boolean(title);

  return (
    <g className="chart-axis">
      {renderAxis ? <path className="chart-axis-spine" d={`M${axisX} ${frame.top}V${frame.bottom}`} /> : null}
      {title ? (
        <text
          className="chart-axis-title"
          textAnchor="middle"
          transform={`rotate(${titleRotation} ${axisTitleX} ${axisTitleY})`}
          x={axisTitleX}
          y={axisTitleY}
        >
          {title}
        </text>
      ) : null}
      {axisTicks.map((value, index) => {
        const y = valueScale(value);
        const tickX2 = side === "right" ? axisX + tickSize : axisX - tickSize;

        return (
          <g key={`${side}-${value}-${index}`}>
            {renderAxis ? <path className="chart-axis-tick" d={`M${axisX} ${y.toFixed(1)}H${tickX2}`} /> : null}
            <text dominantBaseline="middle" textAnchor={resolvedTextAnchor} x={labelX} y={y}>
              {formatValue ? formatValue(value) : value.toFixed(1)}
              {suffix}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function ChartLegend({ items, x, y }: { items: [string, "no2" | "fire" | "exposure"][]; x: number; y: number }) {
  return (
    <g className="home-chart-legend">
      {items.map(([label, tone], index) => (
        <g key={label} transform={`translate(${x + index * 104} ${y})`}>
          <rect className={`home-chart-legend-swatch ${tone}`} height="8" rx="2" width="18" />
          <text x="25" y="8">
            {label}
          </text>
        </g>
      ))}
    </g>
  );
}

function getNiceTicks(
  values: number[],
  options: { integer?: boolean; tickCount?: number; zeroBased?: boolean } = {}
): { domain: [number, number]; step: number; ticks: number[] } {
  const finiteValues = values.filter((value) => Number.isFinite(value));
  const tickCount = Math.max(2, options.tickCount ?? 5);
  const fallbackMin = finiteValues.length > 0 ? Math.min(...finiteValues) : 0;
  const fallbackMax = finiteValues.length > 0 ? Math.max(...finiteValues) : 1;
  const dataMin = options.zeroBased ? 0 : fallbackMin;
  const dataMax = Math.max(fallbackMax, options.zeroBased ? 1 : dataMin + 0.1);
  const minValue = options.zeroBased ? 0 : dataMin;
  const maxValue = dataMax > minValue ? dataMax : minValue + (options.integer ? 1 : 0.1);
  const rawStep = (maxValue - minValue) / Math.max(1, tickCount - 1);
  const candidates = getNiceStepCandidates(rawStep, Boolean(options.integer));
  const positiveOnly = finiteValues.every((value) => value >= 0);

  const best = candidates
    .map((step) => {
      let min = options.zeroBased ? 0 : roundTick(Math.floor(minValue / step) * step);
      if (!options.zeroBased && positiveOnly) min = Math.max(0, min);

      const neededSteps = Math.ceil((maxValue - min) / step);
      const axisSteps = options.zeroBased ? Math.max(tickCount - 1, neededSteps) : neededSteps;
      const max = roundTick(min + axisSteps * step);
      const count = axisSteps + 1;
      const countPenalty = count >= 4 && count <= 5 ? 0 : Math.abs(count - tickCount) + 4;
      const padding = Math.max(0, max - maxValue) + Math.max(0, minValue - min);

      return { count, max, min, padding, score: countPenalty * 100 + Math.abs(count - tickCount) * 8 + padding / step, step };
    })
    .sort((a, b) => a.score - b.score || a.padding - b.padding)[0];

  const ticks = Array.from({ length: best.count }, (_, index) => roundTick(best.min + index * best.step));
  return { domain: [best.min, best.max], step: best.step, ticks };
}

function getNiceStepCandidates(rawStep: number, integer: boolean) {
  const safeStep = Math.max(rawStep, Number.EPSILON);
  const exponent = Math.floor(Math.log10(safeStep));
  const multipliers = [1, 2, 2.5, 5, 10];
  const candidates = new Set<number>();

  for (let power = exponent - 2; power <= exponent + 2; power += 1) {
    const magnitude = 10 ** power;
    for (const multiplier of multipliers) {
      const step = roundTick(multiplier * magnitude);
      if (integer && (!Number.isInteger(step) || step < 1)) continue;
      candidates.add(step);
    }
  }

  if (candidates.size === 0) candidates.add(1);
  return Array.from(candidates).sort((a, b) => a - b);
}

function roundTick(value: number) {
  return Number(value.toPrecision(12));
}

function formatTickValue(value: number, step: number) {
  const precision = getStepPrecision(step);
  return value.toLocaleString(undefined, {
    maximumFractionDigits: precision,
    minimumFractionDigits: precision
  });
}

function getStepPrecision(step: number) {
  for (let precision = 0; precision <= 4; precision += 1) {
    if (Number.isInteger(roundTick(step * 10 ** precision))) return precision;
  }
  return 1;
}

function getExtent(values: number[]) {
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const spread = Math.max(maxValue - minValue, maxValue * 0.1, 1);
  return {
    max: maxValue + spread * 0.12,
    min: Math.max(0, minValue - spread * 0.12)
  };
}

function getLinearScaleFromDomain([min, max]: [number, number], bottom: number, top: number) {
  const height = bottom - top;
  return (value: number) => bottom - ((value - min) / Math.max(Number.EPSILON, max - min)) * height;
}

function getLinearScale(values: number[], bottom: number, top: number) {
  const { max, min } = getExtent(values);
  return getLinearScaleFromDomain([min, max], bottom, top);
}
