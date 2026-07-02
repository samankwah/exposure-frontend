"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { SummaryMetric } from "@/types/exposure";

export function KpiCards({ metrics }: { metrics: SummaryMetric[] }) {
  return (
    <section className="kpi-grid" aria-label="Summary metrics">
      {metrics.map((metric) => {
        const DeltaIcon = metric.delta >= 0 ? ArrowUpRight : ArrowDownRight;

        return (
          <article className={`kpi-card tone-${metric.tone}`} key={metric.label}>
            <span className="kpi-label">{metric.label}</span>
            <strong>{metric.value}</strong>
            <span className="kpi-delta">
              <DeltaIcon size={16} aria-hidden />
              {metric.delta > 0 ? "+" : ""}
              {metric.delta}
            </span>
            <small>{metric.detail}</small>
          </article>
        );
      })}
    </section>
  );
}
