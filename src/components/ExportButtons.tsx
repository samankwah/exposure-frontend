"use client";

import { Download, FileJson, Printer } from "lucide-react";
import type { Filters } from "@/types/exposure";
import { NO2_COLUMN_UNIT, getCountryFeatureCollection, getCountryName, getOverviewMonthlyCycle } from "@/data/sampleData";

function downloadFile(filename: string, mimeType: string, contents: string) {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ExportButtons({ filters }: { filters: Filters }) {
  const name = getCountryName(filters.countryId).replace(/\s+/g, "-").toLowerCase();

  const exportCsv = () => {
    const rows = getOverviewMonthlyCycle(filters);
    const csv = [
      `month,no2_column_${NO2_COLUMN_UNIT},fire_count,population_exposure_million`,
      ...rows.map((row) => `${row.label},${row.no2 ?? 0},${row.fireCount ?? 0},${row.exposure ?? 0}`)
    ].join("\n");
    downloadFile(`no2-${name}-${filters.year}.csv`, "text/csv", csv);
  };

  const exportGeoJson = () => {
    downloadFile(
      `no2-${name}-${filters.year}.geojson`,
      "application/geo+json",
      JSON.stringify(getCountryFeatureCollection(filters), null, 2)
    );
  };

  return (
    <div className="export-actions">
      <button type="button" title="Export CSV" onClick={exportCsv}>
        <Download size={16} aria-hidden />
        <span>CSV</span>
      </button>
      <button type="button" title="Export GeoJSON" onClick={exportGeoJson}>
        <FileJson size={16} aria-hidden />
        <span>GeoJSON</span>
      </button>
      <button type="button" title="Export PDF" onClick={() => window.print()}>
        <Printer size={16} aria-hidden />
        <span>PDF</span>
      </button>
    </div>
  );
}
