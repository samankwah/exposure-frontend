"use client";

import { ChevronRight } from "lucide-react";
import { NO2_COLUMN_UNIT_LABEL } from "@/data/webData";
import type { RankingRow } from "@/types/exposure";

export function RankingTable({
  rows,
  selectedId,
  onSelect
}: {
  rows: RankingRow[];
  selectedId: string;
  onSelect: (countryId: string) => void;
}) {
  return (
    <article className="table-panel">
      <header className="panel-header">
        <span>Country ranking</span>
        <strong>NO₂ exposure leaders</strong>
      </header>
      <div className="ranking-table" role="table" aria-label="Country NO₂ ranking">
        <div className="table-row table-head" role="row">
          <span role="columnheader">Country</span>
          <span className="no2-unit-column" role="columnheader">
            <strong>NO{"\u2082"}</strong>
            <small>{NO2_COLUMN_UNIT_LABEL}</small>
          </span>
          <span role="columnheader">Exposure</span>
          <span role="columnheader">Fire</span>
        </div>
        {rows.map((row) => (
          <button
            className={selectedId === row.id ? "table-row active" : "table-row"}
            key={row.id}
            type="button"
            role="row"
            onClick={() => onSelect(row.id)}
          >
            <span className="country-cell" role="cell">
              <ChevronRight size={14} aria-hidden />
              {row.name}
              <small>{row.hotspotShare}% hotspots</small>
            </span>
            <span role="cell">{row.no2.toFixed(1)}</span>
            <span role="cell">{row.exposure.toLocaleString()}</span>
            <span role="cell">{row.fireCount.toLocaleString()}</span>
          </button>
        ))}
      </div>
    </article>
  );
}
