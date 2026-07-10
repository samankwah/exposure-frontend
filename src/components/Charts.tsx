"use client";

import { useEffect, useMemo, useRef } from "react";
import Chart from "chart.js/auto";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import type { Chart as ChartInstance, ChartConfiguration, ChartTypeRegistry } from "chart.js";
import type { HighchartsReactRefObject } from "highcharts-react-official";
import {
  getCityRows,
  getCountryRows,
  getHealthRiskTierRows,
  getSeasonalTrendRows
} from "@/data/webData";
import { useTheme } from "@/components/ThemeProvider";
import type { WebDataSeason } from "@/data/webData";
import { useWebDataVersion } from "@/data/useWebData";
import type { TrendPoint } from "@/types/exposure";

type MetricKey = "no2" | "fireCount" | "exposure" | "dry" | "wet";

interface LineChartProps {
  title: string;
  eyebrow: string;
  data: TrendPoint[];
  primaryKey: MetricKey;
  primaryLabel: string;
  secondaryKey?: MetricKey;
  secondaryLabel?: string;
  unit?: string;
  variant?: "default" | "overview";
}

const chartColorThemes = {
  day: {
    primary: "#1768d8",
    secondary: "#f58220",
    green: "#2f9e44",
    grid: "#dce6eb",
    gridSoft: "#f1f5f9",
    axis: "#5b6f7c",
    text: "#243746",
    muted: "#667985",
    pointBackground: "#ffffff",
    tooltipBackground: "rgba(255,255,255,0.96)",
    tooltipBorder: "#d9e2e7",
    doughnutBorder: "#ffffff"
  },
  night: {
    primary: "#7db7ff",
    secondary: "#f6a85a",
    green: "#72dda2",
    grid: "#2b4258",
    gridSoft: "#243a50",
    axis: "#7f94a8",
    text: "#e7f0f7",
    muted: "#a7b8c7",
    pointBackground: "#0f1d2c",
    tooltipBackground: "rgba(13,29,44,0.96)",
    tooltipBorder: "#2b4258",
    doughnutBorder: "#0f1d2c"
  }
};

type ChartColorTheme = (typeof chartColorThemes)["day"];

function useChartColors(): ChartColorTheme {
  const { resolvedTheme } = useTheme();
  return chartColorThemes[resolvedTheme];
}

function getAxisLine(colors: ChartColorTheme) {
  return {
    lineColor: colors.axis,
    lineWidth: 1.5,
    tickColor: colors.axis,
    tickLength: 6,
    tickWidth: 1.5
  };
}

function getAxisTitleStyle(colors: ChartColorTheme) {
  return {
    color: colors.muted,
    fontSize: "10px",
    fontWeight: "700"
  };
}

const insightsFont = {
  family: "Sora, Arial, Helvetica, sans-serif"
};

const countryRanking = [
  ["Nigeria", 100],
  ["Mali", 61],
  ["Senegal", 56],
  ["Benin", 48],
  ["Togo", 47],
  ["Ghana", 47],
  ["Guinea", 45],
  ["Gambia", 44],
  ["Côte d'Ivoire", 35],
  ["Burkina Faso", 35],
  ["Sierra Leone", 28],
  ["Niger", 21],
  ["Guinea-Bissau", 20],
  ["Mauritania", 11],
  ["Liberia", 0]
] as const;

const cityHotspots = [
  ["Lagos", 100],
  ["Abuja", 49],
  ["Ibadan", 44],
  ["Abidjan", 42],
  ["Bamako", 39],
  ["Port Harcourt", 35],
  ["Aba", 35],
  ["Onitsha", 34],
  ["Kano", 32],
  ["Enugu", 31]
] as const;

function riskColor(score: number) {
  if (score < 20) return "#22c55e";
  if (score < 40) return "#84cc16";
  if (score < 60) return "#eab308";
  if (score < 80) return "#f97316";
  return "#ef4444";
}

function ResponsiveHighcharts({ options }: { options: Highcharts.Options }) {
  const chartRef = useRef<HighchartsReactRefObject>(null);

  useEffect(() => {
    const chart = chartRef.current?.chart;
    const root = chartRef.current?.container.current;
    const target = root?.parentElement;

    if (!chart || !target) return;

    const resizeChart = () => {
      if (!window.matchMedia("(min-width: 701px)").matches) return;

      const { height, width } = target.getBoundingClientRect();
      if (width > 0 && height > 0) {
        chart.setSize(Math.floor(width), Math.floor(height), false);
      }
    };

    const animationFrame = window.requestAnimationFrame(resizeChart);
    const resizeObserver = new ResizeObserver(resizeChart);
    resizeObserver.observe(target);
    window.addEventListener("resize", resizeChart);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      window.removeEventListener("resize", resizeChart);
    };
  }, [options]);

  return (
    <HighchartsReact
      containerProps={{ className: "highcharts-root", style: { height: "100%", width: "100%" } }}
      highcharts={Highcharts}
      options={options}
      ref={chartRef}
    />
  );
}

function ChartJsChart<TType extends keyof ChartTypeRegistry>({
  ariaLabel,
  className = "",
  config
}: {
  ariaLabel: string;
  className?: string;
  config: ChartConfiguration<TType>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartInstance<TType> | null>(null);

  useEffect(() => {
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;

    chartRef.current = new Chart(context, config);

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [config]);

  return (
    <div className={`insights-chartjs ${className}`}>
      <canvas aria-label={ariaLabel} ref={canvasRef} role="img" />
    </div>
  );
}

export function AnnualNpweiTrendChart() {
  const dataVersion = useWebDataVersion();
  const seasonalRows = useMemo(() => {
    void dataVersion;
    return getSeasonalTrendRows();
  }, [dataVersion]);
  const chartTheme = useChartColors();
  const config = useMemo<ChartConfiguration<"line">>(
    () => ({
      type: "line",
      data: {
        labels: seasonalRows.map((row) => row.year),
        datasets: [
          {
            label: "Annual",
            data: seasonalRows.map((row) => row.Annual),
            borderColor: "#2563eb",
            backgroundColor: "rgba(37,99,235,.08)",
            fill: true,
            tension: 0.35,
            pointRadius: 4,
            pointHoverRadius: 4,
            pointBackgroundColor: chartTheme.pointBackground,
            pointBorderColor: "#2563eb",
            pointBorderWidth: 2,
            borderWidth: 2.5
          },
          {
            label: "DJF (Dry)",
            data: seasonalRows.map((row) => row.DJF),
            borderColor: "#f97316",
            backgroundColor: "transparent",
            tension: 0.35,
            pointRadius: 3,
            pointHoverRadius: 3,
            pointBackgroundColor: chartTheme.pointBackground,
            pointBorderColor: "#f97316",
            pointBorderWidth: 2,
            borderWidth: 1.8,
            borderDash: [5, 4]
          },
          {
            label: "JJA (Wet)",
            data: seasonalRows.map((row) => row.JJA),
            borderColor: "#22c55e",
            backgroundColor: "transparent",
            tension: 0.35,
            pointRadius: 3,
            pointHoverRadius: 3,
            pointBackgroundColor: chartTheme.pointBackground,
            pointBorderColor: "#22c55e",
            pointBorderWidth: 2,
            borderWidth: 1.8,
            borderDash: [5, 4]
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: "bottom",
            labels: {
              boxWidth: 10,
              padding: 8,
              color: chartTheme.muted,
              font: {
                ...insightsFont,
                size: 9,
                weight: "500"
              },
              usePointStyle: false
            }
          },
          tooltip: {
            callbacks: {
              label(context) {
                return `${context.dataset.label}: ${context.parsed.y}/100`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: chartTheme.gridSoft },
            border: { display: false },
            ticks: {
              color: chartTheme.muted,
              font: {
                ...insightsFont,
                size: 9
              }
            }
          },
          y: {
            grid: { color: chartTheme.gridSoft },
            border: { display: false },
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20,
              color: chartTheme.muted,
              font: {
                ...insightsFont,
                size: 9
              }
            }
          }
        }
      }
    }),
    [chartTheme, seasonalRows]
  );

  return <ChartJsChart ariaLabel="Yearly NPWEI trend" config={config} />;
}

export function CountryRankingChart({ season = "Annual" }: { season?: WebDataSeason }) {
  const dataVersion = useWebDataVersion();
  const annualCountryRanking = useMemo(() => {
    void dataVersion;
    return getCountryRows(season);
  }, [dataVersion, season]);
  const chartTheme = useChartColors();
  const config = useMemo<ChartConfiguration<"bar">>(
    () => ({
      type: "bar",
      data: {
        labels: annualCountryRanking.map((row) => (row.country.length > 12 ? `${row.country.slice(0, 11)}...` : row.country)),
        datasets: [
          {
            data: annualCountryRanking.map((row) => row.npwei),
            backgroundColor: annualCountryRanking.map((row) => row.riskColor),
            borderRadius: 4,
            borderSkipped: false
          }
        ]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label(context) {
                return `NPWEI: ${context.parsed.x}/100`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: chartTheme.gridSoft },
            border: { display: false },
            min: 0,
            max: 100,
            ticks: {
              color: chartTheme.muted,
              font: { ...insightsFont, size: 9 }
            }
          },
          y: {
            grid: { display: false },
            border: { display: false },
            ticks: {
              color: chartTheme.muted,
              font: { ...insightsFont, size: 9 }
            }
          }
        }
      }
    }),
    [annualCountryRanking, chartTheme]
  );

  return <ChartJsChart ariaLabel="Country NPWEI ranking" config={config} />;
}

export function SeasonalCycleChart() {
  const chartTheme = useChartColors();
  const config = useMemo<ChartConfiguration<"line">>(
    () => ({
      type: "line",
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        datasets: [
          {
            label: "Dry (Nov-May)",
            data: [85, 90, 82, 75, 65, 45, 35, 30, 35, 50, 65, 80],
            borderColor: "#f97316",
            backgroundColor: "rgba(249,115,22,.08)",
            fill: true,
            tension: 0.45,
            pointRadius: 3,
            pointHoverRadius: 3,
            pointBackgroundColor: chartTheme.pointBackground,
            pointBorderColor: "#f97316",
            pointBorderWidth: 2,
            borderWidth: 2.5
          },
          {
            label: "Wet (Jun-Oct)",
            data: [45, 40, 42, 48, 55, 68, 74, 70, 66, 58, 55, 48],
            borderColor: "#22c55e",
            backgroundColor: "rgba(34,197,94,.08)",
            fill: true,
            tension: 0.45,
            pointRadius: 3,
            pointHoverRadius: 3,
            pointBackgroundColor: chartTheme.pointBackground,
            pointBorderColor: "#22c55e",
            pointBorderWidth: 2,
            borderWidth: 1.8,
            borderDash: [5, 4]
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: "bottom",
            labels: {
              boxWidth: 10,
              padding: 8,
              color: chartTheme.muted,
              font: {
                ...insightsFont,
                size: 9,
                weight: "500"
              }
            }
          },
          tooltip: {
            callbacks: {
              label(context) {
                return `NPWEI: ${context.parsed.y}/100`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: {
              color: chartTheme.muted,
              font: { ...insightsFont, size: 8 }
            }
          },
          y: {
            grid: { color: chartTheme.gridSoft },
            border: { display: false },
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20,
              color: chartTheme.muted,
              font: { ...insightsFont, size: 9 }
            }
          }
        }
      }
    }),
    [chartTheme]
  );

  return <ChartJsChart ariaLabel="Monthly NPWEI seasonal cycle" config={config} />;
}

export function CityHotspotsChart({
  country = "all",
  limit = 10,
  season = "Annual"
}: {
  country?: string;
  limit?: number;
  season?: WebDataSeason;
}) {
  const dataVersion = useWebDataVersion();
  const annualCityHotspots = useMemo(
    () => {
      void dataVersion;
      return getCityRows(season)
        .filter((row) => country === "all" || row.country === country)
        .slice(0, limit);
    },
    [country, dataVersion, limit, season]
  );
  const chartTheme = useChartColors();
  const config = useMemo<ChartConfiguration<"bar">>(
    () => ({
      type: "bar",
      data: {
        labels: annualCityHotspots.map((row) => row.name),
        datasets: [
          {
            data: annualCityHotspots.map((row) => row.npwei),
            backgroundColor: annualCityHotspots.map((row) => row.riskColor),
            borderRadius: 5,
            borderSkipped: false
          }
        ]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label(context) {
                return `NPWEI: ${context.parsed.x}/100`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: chartTheme.gridSoft },
            border: { display: false },
            min: 0,
            max: 100,
            ticks: {
              color: chartTheme.muted,
              font: { ...insightsFont, size: 9 }
            }
          },
          y: {
            grid: { display: false },
            border: { display: false },
            ticks: {
              color: chartTheme.muted,
              font: { ...insightsFont, size: 10, weight: "600" }
            }
          }
        }
      }
    }),
    [annualCityHotspots, chartTheme]
  );

  return <ChartJsChart ariaLabel="Top city NPWEI hotspots" className="large" config={config} />;
}

export function RiskTierChart() {
  const dataVersion = useWebDataVersion();
  const annualRiskTiers = useMemo(() => {
    void dataVersion;
    return getHealthRiskTierRows("Annual");
  }, [dataVersion]);
  const chartTheme = useChartColors();
  const config = useMemo<ChartConfiguration<"doughnut">>(
    () => ({
      type: "doughnut",
      data: {
        labels: annualRiskTiers.map((row) => row.label),
        datasets: [
          {
            data: annualRiskTiers.map((row) => row.populationMillions),
            backgroundColor: annualRiskTiers.map((row) => row.color),
            borderColor: chartTheme.doughnutBorder,
            borderWidth: 3,
            hoverOffset: 8
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "62%",
        plugins: {
          legend: {
            display: true,
            position: "bottom",
            labels: {
              boxWidth: 12,
              padding: 10,
              color: chartTheme.muted,
              font: { ...insightsFont, size: 10 }
            }
          },
          tooltip: {
            callbacks: {
              label(context) {
                return `${context.label}: ${context.raw}M people`;
              }
            }
          }
        }
      }
    }),
    [annualRiskTiers, chartTheme]
  );

  return <ChartJsChart ariaLabel="Population by NPWEI risk tier" className="large" config={config} />;
}

function formatChartValue(value: number) {
  return Highcharts.numberFormat(value, 1);
}

function formatCompactChartValue(value: number | string) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return String(value);
  if (Math.abs(numericValue) >= 1000) return `${Highcharts.numberFormat(numericValue / 1000, 1)}k`;
  return formatChartValue(numericValue);
}

export function LineChart({
  title,
  eyebrow,
  data,
  primaryKey,
  primaryLabel,
  secondaryKey,
  secondaryLabel,
  unit = "",
  variant = "default"
}: LineChartProps) {
  const chartTheme = useChartColors();
  const options = useMemo<Highcharts.Options>(() => {
    const themeAxisLine = getAxisLine(chartTheme);
    const themeAxisTitleStyle = getAxisTitleStyle(chartTheme);
    const primaryValues = data.map((point) => Number(point[primaryKey] ?? 0));
    const secondaryValues = secondaryKey ? data.map((point) => Number(point[secondaryKey] ?? 0)) : [];
    const hasDualAxis = secondaryValues.length > 0 && Math.max(...secondaryValues) > Math.max(1, Math.max(...primaryValues)) * 8;
    const isOverview = variant === "overview";

    return {
      accessibility: { enabled: false },
      chart: {
        backgroundColor: "transparent",
        height: "100%",
        margin: isOverview ? [unit.trim() ? 34 : 24, 12, 52, 42] : hasDualAxis ? [48, 64, 62, 58] : [46, 18, 62, 58],
        spacing: isOverview ? [0, 0, 0, 0] : [8, 8, 6, 8],
        style: { fontFamily: "Arial, Helvetica, sans-serif" },
        type: "line"
      },
      credits: { enabled: false },
      legend: {
        align: "center",
        enabled: Boolean(secondaryKey),
        itemStyle: { color: chartTheme.text, fontSize: "11px", fontWeight: "600" },
        margin: 2,
        symbolRadius: 999,
        verticalAlign: "top"
      },
      plotOptions: {
        line: {
          dataLabels: {
            crop: false,
            enabled: data.length <= 6,
            formatter() {
              return formatCompactChartValue(Number(this.y ?? 0));
            },
            overflow: "allow",
            style: {
              color: chartTheme.text,
              fontSize: "10px",
              fontWeight: "700",
              textOutline: "2px contrast"
            },
            y: -6
          },
          lineWidth: 3,
          marker: {
            enabled: true,
            lineColor: chartTheme.pointBackground,
            lineWidth: 2,
            radius: 4,
            symbol: "circle"
          },
          states: {
            hover: { lineWidthPlus: 0 }
          }
        }
      },
      series: [
        {
          color: chartTheme.primary,
          data: primaryValues,
          name: primaryLabel,
          type: "line",
          yAxis: 0
        },
        ...(secondaryKey
          ? [
              {
                color: secondaryLabel?.toLowerCase().includes("wet") ? chartTheme.green : chartTheme.secondary,
                data: secondaryValues,
                name: secondaryLabel ?? "Secondary",
                type: "line" as const,
                yAxis: hasDualAxis ? 1 : 0
              }
            ]
          : [])
      ],
      title: { text: undefined },
      tooltip: {
        backgroundColor: chartTheme.tooltipBackground,
        borderColor: chartTheme.tooltipBorder,
        borderRadius: 7,
        pointFormatter() {
          return `<span style="color:${this.color}">\u25CF</span> ${this.series.name}: <b>${formatCompactChartValue(
            Number(this.y ?? 0)
          )}${unit}</b><br/>`;
        },
        shared: true
      },
      xAxis: {
        ...themeAxisLine,
        categories: data.map((point) => point.label),
        tickmarkPlacement: "on",
        tickPosition: "outside",
        labels: { style: { color: chartTheme.text, fontSize: "11px" } },
        title: { margin: 10, text: "Year", style: themeAxisTitleStyle }
      },
      yAxis: [
        {
          ...themeAxisLine,
          gridLineColor: chartTheme.grid,
          labels: {
            align: "right" as const,
            formatter(this: Highcharts.AxisLabelsFormatterContextObject) {
              return formatCompactChartValue(this.value);
            },
            reserveSpace: true,
            x: -6,
            style: { color: chartTheme.muted, fontSize: "11px" }
          },
          max: isOverview && primaryKey === "no2" && !secondaryKey ? 3 : undefined,
          min: isOverview && primaryKey === "no2" && !secondaryKey ? 1 : undefined,
          minPadding: 0.08,
          tickInterval: isOverview && primaryKey === "no2" && !secondaryKey ? 0.5 : undefined,
          title: { margin: 10, text: primaryLabel, style: themeAxisTitleStyle }
        },
        ...(hasDualAxis
          ? [
              {
                ...themeAxisLine,
                gridLineWidth: 0,
                labels: {
                  align: "left" as const,
                  formatter(this: Highcharts.AxisLabelsFormatterContextObject) {
                    return formatCompactChartValue(this.value);
                  },
                  reserveSpace: true,
                  x: 6,
                  style: { color: chartTheme.secondary, fontSize: "11px" }
                },
                opposite: true,
                title: {
                  text: secondaryLabel,
                  margin: 10,
                  style: { ...themeAxisTitleStyle, color: chartTheme.secondary }
                }
              }
            ]
          : [])
      ]
    };
  }, [chartTheme, data, primaryKey, primaryLabel, secondaryKey, secondaryLabel, unit, variant]);

  return (
    <article className="chart-card">
      <header className="panel-header">
        <span>{eyebrow}</span>
        <strong>{title}</strong>
      </header>
      <div className="chart-wrap highcharts-chart-wrap">
        {unit.trim() ? <span className="chart-unit-label">{unit.trim()}</span> : null}
        <ResponsiveHighcharts options={options} />
      </div>
    </article>
  );
}

export function MonthlyCycleChart({
  title,
  eyebrow,
  data,
  unit = ""
}: {
  title: string;
  eyebrow: string;
  data: TrendPoint[];
  unit?: string;
}) {
  const chartTheme = useChartColors();
  const options = useMemo<Highcharts.Options>(() => {
    const themeAxisLine = getAxisLine(chartTheme);
    const themeAxisTitleStyle = getAxisTitleStyle(chartTheme);
    const baseline = data.map((point) => Number(point.no2 ?? 0));
    const dryLift = [0.49, 0.59, 0.61, 0.68, 0.83, 0.66, 0.47, 0.42, 0.43, 0.55, 1.1, 1.15];
    const wetReduction = [0.46, 0.42, 0.41, 0.36, 0.24, 0.28, 0.33, 0.36, 0.36, 0.35, 0.37, 0.55];

    return {
      accessibility: { enabled: false },
      chart: {
        backgroundColor: "transparent",
        height: "100%",
        margin: [46, 18, 62, 58],
        spacing: [0, 0, 0, 0],
        style: { fontFamily: "Arial, Helvetica, sans-serif" },
        type: "line"
      },
      credits: { enabled: false },
      legend: {
        align: "center",
        itemDistance: 12,
        itemStyle: { color: chartTheme.text, fontSize: "11px", fontWeight: "600" },
        margin: 0,
        symbolRadius: 999,
        verticalAlign: "top"
      },
      plotOptions: {
        line: {
          dataLabels: { crop: false, enabled: false, overflow: "allow" },
          lineWidth: 3,
          marker: {
            enabled: true,
            lineColor: chartTheme.pointBackground,
            lineWidth: 1.5,
            radius: 3.2,
            symbol: "circle"
          },
          states: { hover: { lineWidthPlus: 0 } }
        }
      },
      series: [
        {
          color: chartTheme.primary,
          data: baseline,
          name: "2024",
          type: "line"
        },
        {
          color: chartTheme.secondary,
          data: baseline.map((value, index) => round(value + dryLift[index])),
          name: "Dry Season (Nov-May)",
          type: "line"
        },
        {
          color: chartTheme.green,
          data: baseline.map((value, index) => round(Math.max(0.2, value - wetReduction[index]))),
          name: "Wet Season (Jun-Oct)",
          type: "line"
        }
      ],
      title: { text: undefined },
      tooltip: {
        backgroundColor: chartTheme.tooltipBackground,
        borderColor: chartTheme.tooltipBorder,
        borderRadius: 7,
        pointFormatter() {
          return `<span style="color:${this.color}">\u25CF</span> ${this.series.name}: <b>${formatCompactChartValue(
            Number(this.y ?? 0)
          )}${unit}</b><br/>`;
        },
        shared: true
      },
      xAxis: {
        ...themeAxisLine,
        categories: data.map((point) => point.label),
        tickmarkPlacement: "on",
        tickPosition: "outside",
        labels: { style: { color: chartTheme.text, fontSize: "11px" } },
        title: { margin: 10, text: "Month", style: themeAxisTitleStyle }
      },
      yAxis: {
        ...themeAxisLine,
        gridLineColor: chartTheme.grid,
        labels: {
          align: "right" as const,
          formatter(this: Highcharts.AxisLabelsFormatterContextObject) {
            return formatCompactChartValue(this.value);
          },
          reserveSpace: true,
          x: -6,
          style: { color: chartTheme.muted, fontSize: "11px" }
        },
        max: 4.1,
        min: 1,
        tickInterval: 1,
        title: { margin: 10, text: "NO2", style: themeAxisTitleStyle }
      }
    };
  }, [chartTheme, data, unit]);

  return (
    <article className="chart-card">
      <header className="panel-header">
        <span>{eyebrow}</span>
        <strong>{title}</strong>
      </header>
      <div className="chart-wrap highcharts-chart-wrap">
        {unit.trim() ? <span className="chart-unit-label">{unit.trim()}</span> : null}
        <ResponsiveHighcharts options={options} />
      </div>
    </article>
  );
}

export function BarChart({
  title,
  eyebrow,
  data,
  metricKey,
  label
}: {
  title: string;
  eyebrow: string;
  data: TrendPoint[];
  metricKey: MetricKey;
  label: string;
}) {
  const chartTheme = useChartColors();
  const options = useMemo<Highcharts.Options>(
    () => {
      const themeAxisLine = getAxisLine(chartTheme);
      const themeAxisTitleStyle = getAxisTitleStyle(chartTheme);

      return {
      accessibility: { enabled: false },
      chart: {
        backgroundColor: "transparent",
        height: "100%",
        margin: [46, 18, 62, 58],
        spacing: [8, 4, 8, 4],
        style: { fontFamily: "Arial, Helvetica, sans-serif" },
        type: "column"
      },
      colors: [chartTheme.primary],
      credits: { enabled: false },
      legend: { enabled: false },
      plotOptions: {
        column: {
          borderRadius: 4,
          borderWidth: 0,
          colorByPoint: false,
          groupPadding: 0.12,
          pointPadding: 0.04
        }
      },
      series: [
        {
          color: chartTheme.primary,
          data: data.map((point) => Number(point[metricKey] ?? 0)),
          name: label,
          type: "column"
        }
      ],
      title: { text: undefined },
      tooltip: {
        backgroundColor: chartTheme.tooltipBackground,
        borderColor: chartTheme.tooltipBorder,
        borderRadius: 7,
        pointFormatter() {
          return `${this.series.name}: <b>${formatCompactChartValue(Number(this.y ?? 0))}</b>`;
        }
      },
      xAxis: {
        ...themeAxisLine,
        categories: data.map((point) => point.label),
        tickmarkPlacement: "on",
        tickPosition: "outside",
        labels: { style: { color: chartTheme.text, fontSize: "11px" } },
        title: { margin: 10, text: "Month", style: themeAxisTitleStyle }
      },
      yAxis: {
        ...themeAxisLine,
        gridLineColor: chartTheme.grid,
        labels: {
          align: "right" as const,
          formatter(this: Highcharts.AxisLabelsFormatterContextObject) {
            return formatCompactChartValue(this.value);
          },
          reserveSpace: true,
          x: -6,
          style: { color: chartTheme.muted, fontSize: "11px" }
        },
        min: 0,
        title: { margin: 10, text: label, style: themeAxisTitleStyle }
      }
    };
    },
    [chartTheme, data, label, metricKey]
  );

  return (
    <article className="chart-card">
      <header className="panel-header">
        <span>{eyebrow}</span>
        <strong>{title}</strong>
      </header>
      <div className="chart-wrap highcharts-chart-wrap">
        <ResponsiveHighcharts options={options} />
      </div>
    </article>
  );
}

function round(value: number) {
  return Number(value.toFixed(2));
}
