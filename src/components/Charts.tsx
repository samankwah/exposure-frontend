"use client";

import { useMemo, useState } from "react";
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
}

const WIDTH = 640;
const HEIGHT = 260;
const PAD_X = 44;
const PAD_TOP = 28;
const PAD_BOTTOM = 48;

export function LineChart({
  title,
  eyebrow,
  data,
  primaryKey,
  primaryLabel,
  secondaryKey,
  secondaryLabel,
  unit = ""
}: LineChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const domain = useMemo(() => {
    const values = data.flatMap((point) => [
      Number(point[primaryKey] ?? 0),
      secondaryKey ? Number(point[secondaryKey] ?? 0) : Number(point[primaryKey] ?? 0)
    ]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const spread = Math.max(1, max - min);
    return { min: min - spread * 0.12, max: max + spread * 0.12 };
  }, [data, primaryKey, secondaryKey]);

  const xFor = (index: number) => PAD_X + (index / Math.max(1, data.length - 1)) * (WIDTH - PAD_X * 2);
  const yFor = (value: number) => {
    const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
    return PAD_TOP + (1 - (value - domain.min) / (domain.max - domain.min)) * plotHeight;
  };

  const pathFor = (key: MetricKey) =>
    data
      .map((point, index) => {
        const x = xFor(index);
        const y = yFor(Number(point[key] ?? 0));
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");

  const activePoint = hovered === null ? null : data[hovered];

  return (
    <article className="chart-card">
      <header className="panel-header">
        <span>{eyebrow}</span>
        <strong>{title}</strong>
      </header>
      <div className="chart-wrap">
        <svg role="img" aria-label={title} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id={`${title}-grid`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="rgba(88, 208, 255, 0.1)" />
              <stop offset="100%" stopColor="rgba(178, 255, 89, 0.04)" />
            </linearGradient>
          </defs>
          {[0, 1, 2, 3].map((line) => {
            const y = PAD_TOP + line * ((HEIGHT - PAD_TOP - PAD_BOTTOM) / 3);
            return <line className="grid-line" key={line} x1={PAD_X} x2={WIDTH - PAD_X} y1={y} y2={y} />;
          })}
          <path className="chart-area" d={`${pathFor(primaryKey)} L ${WIDTH - PAD_X} ${HEIGHT - PAD_BOTTOM} L ${PAD_X} ${HEIGHT - PAD_BOTTOM} Z`} />
          <path className="chart-line primary" d={pathFor(primaryKey)} />
          {secondaryKey ? <path className="chart-line secondary" d={pathFor(secondaryKey)} /> : null}
          {data.map((point, index) => {
            const x = xFor(index);
            const primaryY = yFor(Number(point[primaryKey] ?? 0));
            const secondaryY = secondaryKey ? yFor(Number(point[secondaryKey] ?? 0)) : null;
            return (
              <g key={point.label}>
                <rect
                  className="hover-target"
                  x={x - 18}
                  y={PAD_TOP}
                  width={36}
                  height={HEIGHT - PAD_TOP - PAD_BOTTOM}
                  onMouseEnter={() => setHovered(index)}
                  onMouseLeave={() => setHovered(null)}
                />
                <circle className="chart-dot primary" cx={x} cy={primaryY} r={hovered === index ? 5 : 3} />
                {secondaryY !== null ? (
                  <circle className="chart-dot secondary" cx={x} cy={secondaryY} r={hovered === index ? 5 : 3} />
                ) : null}
                <text className="axis-label" x={x} y={HEIGHT - 16}>
                  {point.label}
                </text>
              </g>
            );
          })}
        </svg>

        {activePoint ? (
          <div className="chart-tooltip" style={{ left: `${(hovered ?? 0) / Math.max(1, data.length - 1) * 88 + 6}%` }}>
            <strong>{activePoint.label}</strong>
            <span>
              {primaryLabel}: {formatValue(activePoint[primaryKey])}
              {unit}
            </span>
            {secondaryKey ? (
              <span>
                {secondaryLabel}: {formatValue(activePoint[secondaryKey])}
                {unit}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
      <footer className="chart-legend">
        <span>
          <i className="legend-dot primary" />
          {primaryLabel}
        </span>
        {secondaryKey ? (
          <span>
            <i className="legend-dot secondary" />
            {secondaryLabel}
          </span>
        ) : null}
      </footer>
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
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((point) => Number(point[metricKey] ?? 0)));
  const activePoint = hovered === null ? null : data[hovered];

  return (
    <article className="chart-card">
      <header className="panel-header">
        <span>{eyebrow}</span>
        <strong>{title}</strong>
      </header>
      <div className="bar-chart">
        {data.map((point, index) => {
          const value = Number(point[metricKey] ?? 0);
          return (
            <button
              className="bar-column"
              key={point.label}
              type="button"
              title={`${point.label}: ${formatValue(value)}`}
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered(null)}
            >
              <span style={{ height: `${Math.max(7, (value / max) * 100)}%` }} />
              <small>{point.label}</small>
            </button>
          );
        })}
        {activePoint ? (
          <div className="bar-tooltip">
            <strong>{activePoint.label}</strong>
            <span>
              {label}: {formatValue(activePoint[metricKey])}
            </span>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function formatValue(value: unknown) {
  const number = Number(value ?? 0);
  if (number >= 1000) return Math.round(number).toLocaleString();
  return Number(number.toFixed(1)).toLocaleString();
}
