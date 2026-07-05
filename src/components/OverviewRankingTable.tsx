"use client";

import { useMemo, type CSSProperties } from "react";
import { useObservatoryFilters } from "@/components/ObservatoryContext";
import { useBackendWebData } from "@/data/useWebData";
import { NO2_COLUMN_UNIT_LABEL, getOverviewCountryRanking } from "@/data/webData";

type BarStyle = CSSProperties & Record<"--bar-width", string>;

export function OverviewRankingTable() {
  const { filters } = useObservatoryFilters();
  const { version: dataVersion } = useBackendWebData();
  const rows = useMemo(() => {
    void dataVersion;
    return getOverviewCountryRanking(filters);
  }, [dataVersion, filters]);
  const max = Math.max(1, rows[0]?.no2 ?? 1);

  return (
    <article className="population-table-card">
      <header>
        <strong>Population-weighted NO{"\u2082"} column exposure by country</strong>
      </header>
      <div className="population-table" role="table" aria-label="Population-weighted NO2 column exposure by country">
        <div className="population-row population-head" role="row">
          <span role="columnheader">Country</span>
          <span role="columnheader">
            NO{"\u2082"} Column
            <small>({NO2_COLUMN_UNIT_LABEL})</small>
          </span>
          <span className="population-column-header" role="columnheader">
            <span className="population-column-title">Urban Population</span>
            <small>Millions</small>
          </span>
        </div>
        {rows.map((row) => {
          const barWidth = `${Math.max(8, (row.no2 / max) * 100)}%`;
          const barStyle = { "--bar-width": barWidth } as BarStyle;

          return (
            <div className="population-row" key={row.id} role="row">
              <span role="cell">{row.name}</span>
              <span className="no2-bar-cell" role="cell" style={barStyle}>
                <i />
                <b>{row.no2.toFixed(2)}</b>
              </span>
              <span role="cell">{row.exposure.toLocaleString()}</span>
            </div>
          );
        })}
      </div>
      <footer>Country PWE is generated from raw TROPOMI NO2 and GPW population inputs</footer>
    </article>
  );
}
