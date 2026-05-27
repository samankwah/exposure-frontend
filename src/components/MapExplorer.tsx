"use client";

import { useMemo, useState } from "react";
import { Columns2, SlidersHorizontal } from "lucide-react";
import { FilterBar } from "@/components/FilterBar";
import { LayerToggles } from "@/components/LayerToggles";
import { LazyExposureMap } from "@/components/LazyExposureMap";
import { KpiCards } from "@/components/KpiCards";
import { ObservatoryFooter } from "@/components/ObservatoryFooter";
import { useObservatoryFilters } from "@/components/ObservatoryContext";
import type { Filters, LayerKey } from "@/types/exposure";
import { DEFAULT_FILTERS, getCountryName, getOverviewMetrics, MONTHS, YEARS } from "@/data/sampleData";

const DEFAULT_LAYERS: Record<LayerKey, boolean> = {
  no2: true,
  fire: false,
  population: false
};

export function MapExplorer() {
  const { filters, setFilters } = useObservatoryFilters();
  const [compareFilters, setCompareFilters] = useState<Filters>({ ...DEFAULT_FILTERS, year: 2021, season: "dry" });
  const [activeLayers, setActiveLayers] = useState(DEFAULT_LAYERS);
  const [compareMode, setCompareMode] = useState(false);
  const metrics = useMemo(() => getOverviewMetrics(filters), [filters]);
  const updateFilters = (next: Filters) => setFilters((current) => ({ ...current, ...next }));

  const selectedMonth = filters.month === "all" ? 0 : filters.month;

  return (
    <div className="page-stack map-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Interactive map</span>
          <h1>NO₂ raster-style explorer</h1>
          <p>MapLibre and deck.gl remain available for country selection, layer toggles, and year or season comparison.</p>
        </div>
        <button className={compareMode ? "command-button active" : "command-button"} type="button" onClick={() => setCompareMode(!compareMode)}>
          <Columns2 size={16} aria-hidden />
          <span>Split compare</span>
        </button>
      </header>

      <div className="map-controls">
        <FilterBar compact filters={filters} onChange={updateFilters} />
        <div className="range-controls" aria-label="Time slider controls">
          <label>
            <span>
              <SlidersHorizontal size={15} aria-hidden />
              Year {filters.year}
            </span>
            <input
              max={YEARS[YEARS.length - 1]}
              min={YEARS[0]}
              step={1}
              type="range"
              value={filters.year}
              onChange={(event) => setFilters({ ...filters, year: Number(event.target.value) })}
            />
          </label>
          <label>
            <span>Month {selectedMonth === 0 ? "All" : MONTHS[selectedMonth - 1]}</span>
            <input
              max={12}
              min={0}
              step={1}
              type="range"
              value={selectedMonth}
              onChange={(event) =>
                setFilters({ ...filters, month: Number(event.target.value) === 0 ? "all" : Number(event.target.value) })
              }
            />
          </label>
        </div>
        <LayerToggles activeLayers={activeLayers} onChange={setActiveLayers} />
      </div>

      <KpiCards metrics={metrics} />

      <section className={compareMode ? "split-map-grid" : "split-map-grid single"}>
        <div>
          <div className="map-caption">
            <strong>{getCountryName(filters.countryId)}</strong>
            <span>{filters.year} selected view</span>
          </div>
          <LazyExposureMap
            activeLayers={activeLayers}
            filters={filters}
            onSelectCountry={(countryId) => setFilters({ ...filters, countryId, cityId: "all" })}
            selectedCountryId={filters.countryId}
          />
        </div>
        {compareMode ? (
          <div>
            <div className="map-caption">
              <strong>{getCountryName(compareFilters.countryId)}</strong>
              <span>{compareFilters.year} comparison view</span>
            </div>
            <FilterBar compact filters={compareFilters} onChange={setCompareFilters} />
            <LazyExposureMap
              activeLayers={activeLayers}
              filters={compareFilters}
              onSelectCountry={(countryId) => setCompareFilters({ ...compareFilters, countryId, cityId: "all" })}
              selectedCountryId={compareFilters.countryId}
            />
          </div>
        ) : null}
      </section>
      <ObservatoryFooter />
    </div>
  );
}
