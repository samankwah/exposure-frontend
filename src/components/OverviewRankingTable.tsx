"use client";

import type { CSSProperties } from "react";

const rows = [
  { country: "Nigeria", no2: 4.72, population: 85.3 },
  { country: "Ghana", no2: 3.31, population: 18.7 },
  { country: "Côte d'Ivoire", no2: 2.89, population: 15.6 },
  { country: "Senegal", no2: 2.53, population: 12.7 },
  { country: "Cameroon", no2: 2.28, population: 13.3 },
  { country: "Benin", no2: 2.17, population: 7.8 },
  { country: "Togo", no2: 1.98, population: 5.7 },
  { country: "Mali", no2: 1.82, population: 6.9 },
  { country: "Burkina Faso", no2: 1.71, population: 6.6 },
  { country: "Guinea", no2: 1.64, population: 8.5 },
  { country: "Niger", no2: 1.52, population: 7.4 },
  { country: "Liberia", no2: 1.33, population: 4.3 },
  { country: "Sierra Leone", no2: 1.29, population: 3.6 },
  { country: "Mauritania", no2: 1.11, population: 1.4 },
  { country: "Guinea-Bissau", no2: 1.05, population: 1.6 },
  { country: "The Gambia", no2: 0.98, population: 1.3 },
  { country: "Chad", no2: 0.71, population: 0.7 }
];

type BarStyle = CSSProperties & Record<"--bar-width", string>;

export function OverviewRankingTable() {
  const max = rows[0].no2;

  return (
    <article className="population-table-card">
      <header>
        <strong>
          Population-weighted NO{"\u2082"} column exposure by country (2024)
        </strong>
      </header>
      <div className="population-table" role="table" aria-label="Population-weighted NO2 column exposure by country">
        <div className="population-row population-head" role="row">
          <span role="columnheader">Country</span>
          <span role="columnheader">
            NO{"\u2082"} Column
            <small>(×10{"\u00B9\u2075"} molecules cm{"\u207B\u00B2"})</small>
          </span>
          <span className="population-column-header" role="columnheader">
            <span className="population-column-title">Population in High-Column</span>
            <small>Hotspot Zones (Millions)</small>
          </span>
        </div>
        {rows.map((row) => {
          const barWidth = `${Math.max(8, (row.no2 / max) * 100)}%`;
          const barStyle = { "--bar-width": barWidth } as BarStyle;

          return (
            <div className="population-row" key={row.country} role="row">
              <span role="cell">{row.country}</span>
              <span className="no2-bar-cell" role="cell" style={barStyle}>
                <i />
                <b>{row.no2.toFixed(2)}</b>
              </span>
              <span role="cell">{row.population.toFixed(1)}</span>
            </div>
          );
        })}
      </div>
      <footer>High-column hotspot zones = Top 25% highest NO{"\u2082"} column areas</footer>
    </article>
  );
}
