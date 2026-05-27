"use client";

import { useEffect, useMemo, useRef } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import type { HighchartsReactRefObject } from "highcharts-react-official";
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

const chartColors = {
  primary: "#1768d8",
  secondary: "#f58220",
  green: "#2f9e44",
  grid: "#dce6eb",
  axis: "#5b6f7c",
  text: "#243746",
  muted: "#667985"
};

const axisLine = {
  lineColor: chartColors.axis,
  lineWidth: 1.5,
  tickColor: chartColors.axis,
  tickLength: 6,
  tickWidth: 1.5
};

const axisTitleStyle = {
  color: chartColors.muted,
  fontSize: "10px",
  fontWeight: "700"
};

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
  const options = useMemo<Highcharts.Options>(() => {
    const primaryValues = data.map((point) => Number(point[primaryKey] ?? 0));
    const secondaryValues = secondaryKey ? data.map((point) => Number(point[secondaryKey] ?? 0)) : [];
    const hasDualAxis = secondaryValues.length > 0 && Math.max(...secondaryValues) > Math.max(1, Math.max(...primaryValues)) * 8;
    const isOverview = variant === "overview";

    return {
      accessibility: { enabled: false },
      chart: {
        backgroundColor: "transparent",
        height: "100%",
        margin: isOverview ? [unit.trim() ? 34 : 24, 12, 42, 42] : hasDualAxis ? [48, 64, 62, 58] : [46, 18, 62, 58],
        spacing: isOverview ? [0, 0, 0, 0] : [8, 8, 6, 8],
        style: { fontFamily: "Arial, Helvetica, sans-serif" },
        type: "line"
      },
      credits: { enabled: false },
      legend: {
        align: "center",
        enabled: Boolean(secondaryKey),
        itemStyle: { color: chartColors.text, fontSize: "11px", fontWeight: "600" },
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
              color: chartColors.text,
              fontSize: "10px",
              fontWeight: "700",
              textOutline: "2px contrast"
            },
            y: -6
          },
          lineWidth: 3,
          marker: {
            enabled: true,
            lineColor: "#ffffff",
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
          color: chartColors.primary,
          data: primaryValues,
          name: primaryLabel,
          type: "line",
          yAxis: 0
        },
        ...(secondaryKey
          ? [
              {
                color: secondaryLabel?.toLowerCase().includes("wet") ? chartColors.green : chartColors.secondary,
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
        backgroundColor: "rgba(255,255,255,0.96)",
        borderColor: "#d9e2e7",
        borderRadius: 7,
        pointFormatter() {
          return `<span style="color:${this.color}">\u25CF</span> ${this.series.name}: <b>${formatCompactChartValue(
            Number(this.y ?? 0)
          )}${unit}</b><br/>`;
        },
        shared: true
      },
      xAxis: {
        ...axisLine,
        categories: data.map((point) => point.label),
        tickmarkPlacement: "on",
        tickPosition: "outside",
        labels: { style: { color: chartColors.text, fontSize: "11px" } },
        title: { margin: 10, text: "Year", style: axisTitleStyle }
      },
      yAxis: [
        {
          ...axisLine,
          gridLineColor: chartColors.grid,
          labels: {
            align: "right" as const,
            formatter(this: Highcharts.AxisLabelsFormatterContextObject) {
              return formatCompactChartValue(this.value);
            },
            reserveSpace: true,
            x: -6,
            style: { color: chartColors.muted, fontSize: "11px" }
          },
          max: isOverview && primaryKey === "no2" && !secondaryKey ? 3 : undefined,
          min: isOverview && primaryKey === "no2" && !secondaryKey ? 1 : undefined,
          minPadding: 0.08,
          tickInterval: isOverview && primaryKey === "no2" && !secondaryKey ? 0.5 : undefined,
          title: { margin: 10, text: primaryLabel, style: axisTitleStyle }
        },
        ...(hasDualAxis
          ? [
              {
                ...axisLine,
                gridLineWidth: 0,
                labels: {
                  align: "left" as const,
                  formatter(this: Highcharts.AxisLabelsFormatterContextObject) {
                    return formatCompactChartValue(this.value);
                  },
                  reserveSpace: true,
                  x: 6,
                  style: { color: chartColors.secondary, fontSize: "11px" }
                },
                opposite: true,
                title: {
                  text: secondaryLabel,
                  margin: 10,
                  style: { ...axisTitleStyle, color: chartColors.secondary }
                }
              }
            ]
          : [])
      ]
    };
  }, [data, primaryKey, primaryLabel, secondaryKey, secondaryLabel, unit, variant]);

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
  const options = useMemo<Highcharts.Options>(() => {
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
        itemStyle: { color: chartColors.text, fontSize: "11px", fontWeight: "600" },
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
            lineColor: "#ffffff",
            lineWidth: 1.5,
            radius: 3.2,
            symbol: "circle"
          },
          states: { hover: { lineWidthPlus: 0 } }
        }
      },
      series: [
        {
          color: chartColors.primary,
          data: baseline,
          name: "2024",
          type: "line"
        },
        {
          color: chartColors.secondary,
          data: baseline.map((value, index) => round(value + dryLift[index])),
          name: "Dry Season (Nov-May)",
          type: "line"
        },
        {
          color: chartColors.green,
          data: baseline.map((value, index) => round(Math.max(0.2, value - wetReduction[index]))),
          name: "Wet Season (Jun-Oct)",
          type: "line"
        }
      ],
      title: { text: undefined },
      tooltip: {
        backgroundColor: "rgba(255,255,255,0.96)",
        borderColor: "#d9e2e7",
        borderRadius: 7,
        pointFormatter() {
          return `<span style="color:${this.color}">\u25CF</span> ${this.series.name}: <b>${formatCompactChartValue(
            Number(this.y ?? 0)
          )}${unit}</b><br/>`;
        },
        shared: true
      },
      xAxis: {
        ...axisLine,
        categories: data.map((point) => point.label),
        tickmarkPlacement: "on",
        tickPosition: "outside",
        labels: { style: { color: chartColors.text, fontSize: "11px" } },
        title: { margin: 10, text: "Month", style: axisTitleStyle }
      },
      yAxis: {
        ...axisLine,
        gridLineColor: chartColors.grid,
        labels: {
          align: "right" as const,
          formatter(this: Highcharts.AxisLabelsFormatterContextObject) {
            return formatCompactChartValue(this.value);
          },
          reserveSpace: true,
          x: -6,
          style: { color: chartColors.muted, fontSize: "11px" }
        },
        max: 4.1,
        min: 1,
        tickInterval: 1,
        title: { margin: 10, text: "NO2", style: axisTitleStyle }
      }
    };
  }, [data, unit]);

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
  const options = useMemo<Highcharts.Options>(
    () => ({
      accessibility: { enabled: false },
      chart: {
        backgroundColor: "transparent",
        height: "100%",
        margin: [46, 18, 62, 58],
        spacing: [8, 4, 8, 4],
        style: { fontFamily: "Arial, Helvetica, sans-serif" },
        type: "column"
      },
      colors: [chartColors.primary],
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
          color: chartColors.primary,
          data: data.map((point) => Number(point[metricKey] ?? 0)),
          name: label,
          type: "column"
        }
      ],
      title: { text: undefined },
      tooltip: {
        backgroundColor: "rgba(255,255,255,0.96)",
        borderColor: "#d9e2e7",
        borderRadius: 7,
        pointFormatter() {
          return `${this.series.name}: <b>${formatCompactChartValue(Number(this.y ?? 0))}</b>`;
        }
      },
      xAxis: {
        ...axisLine,
        categories: data.map((point) => point.label),
        tickmarkPlacement: "on",
        tickPosition: "outside",
        labels: { style: { color: chartColors.text, fontSize: "11px" } },
        title: { margin: 10, text: "Month", style: axisTitleStyle }
      },
      yAxis: {
        ...axisLine,
        gridLineColor: chartColors.grid,
        labels: {
          align: "right" as const,
          formatter(this: Highcharts.AxisLabelsFormatterContextObject) {
            return formatCompactChartValue(this.value);
          },
          reserveSpace: true,
          x: -6,
          style: { color: chartColors.muted, fontSize: "11px" }
        },
        min: 0,
        title: { margin: 10, text: label, style: axisTitleStyle }
      }
    }),
    [data, label, metricKey]
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
