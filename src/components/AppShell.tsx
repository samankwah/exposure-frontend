"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CloudSun,
  Download,
  FileDown,
  Flame,
  Info,
  LayoutDashboard,
  Map
} from "lucide-react";
import type { ReactNode } from "react";
import { ObservatoryProvider, useObservatoryFilters } from "@/components/ObservatoryContext";
import {
  CITIES,
  NO2_COLUMN_UNIT,
  NO2_COLUMN_UNIT_LABEL,
  INTERPOLATION_RESOLUTION_KM,
  REGIONS,
  YEARS,
  getCitiesForCountry,
  getCountriesForRegion,
  getOverviewCountryRanking
} from "@/data/sampleData";

const topNavItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/map", label: "Map", icon: Map },
  { href: "/trends", label: "Trends", icon: BarChart3 },
  { href: "/fires", label: "Seasonality", icon: Flame },
  { href: "/reports", label: "Reports", icon: FileDown }
];

const railNavItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/map", label: "Interactive Map", icon: Map },
  { href: "/trends", label: "Trends & Analytics", icon: BarChart3 },
  { href: "/fires", label: "Fire & Seasonality", icon: Flame },
  { href: "/reports", label: "Reports", icon: FileDown }
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <ObservatoryProvider>
      <ObservatoryShell>{children}</ObservatoryShell>
    </ObservatoryProvider>
  );
}

function ObservatoryShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { filters, stagedFilters, setStagedFilters, applyStagedFilters } = useObservatoryFilters();
  const regionCountries = getCountriesForRegion(stagedFilters.regionId);
  const regionCountryIds = new Set(regionCountries.map((country) => country.id));
  const cities =
    stagedFilters.countryId === "all"
      ? CITIES.filter((city) => regionCountryIds.has(city.countryId))
      : getCitiesForCountry(stagedFilters.countryId);

  const patchStaged = (next: Partial<typeof stagedFilters>) => {
    setStagedFilters((current) => {
      const merged = { ...current, ...next };
      if (next.regionId) {
        merged.countryId = "all";
        merged.cityId = "all";
      }
      if (next.countryId) merged.cityId = "all";
      return merged;
    });
  };

  const downloadData = () => {
    const rows = getOverviewCountryRanking(filters);
    const csv = [
      `country,no2_column_${NO2_COLUMN_UNIT},population_exposure_million,fire_detections`,
      ...rows.map((row) => `${row.name},${row.no2.toFixed(2)},${row.exposure},${row.fireCount}`)
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `west-africa-no2-observatory-${filters.startYear}-${filters.endYear}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="observatory-frame">
      <header className="topbar">
        <Link className="topbar-brand" href="/">
          <span className="brand-mark">
            <CloudSun size={24} aria-hidden />
          </span>
          <span>
            <strong>West Africa NO{"\u2082"} Exposure Observatory</strong>
            <small>Satellite (TROPOMI) insights for cleaner air and healthier communities</small>
          </span>
        </Link>

        <nav className="topbar-nav" aria-label="Primary navigation">
          {topNavItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link className={active ? "topbar-link active" : "topbar-link"} href={item.href} key={item.href}>
                <Icon size={17} aria-hidden />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <button className="download-button" type="button" onClick={downloadData}>
          <Download size={17} aria-hidden />
          <span>Download Data</span>
        </button>
      </header>

      <div className="workspace-shell">
        <aside className="explorer-rail">
          <section className="rail-nav-group">
            <span className="rail-label">Explore</span>
            <nav className="rail-nav" aria-label="Explore navigation">
              {railNavItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link className={active ? "rail-nav-link active" : "rail-nav-link"} href={item.href} key={item.href}>
                    <Icon size={18} aria-hidden />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <a className="rail-nav-link" href="#about-data">
                <Info size={18} aria-hidden />
                <span>About</span>
              </a>
            </nav>
          </section>

          <section className="explorer-card selector-card">
            <span className="rail-label">Select region</span>
            <select value={stagedFilters.regionId} onChange={(event) => patchStaged({ regionId: event.target.value })}>
              {REGIONS.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.label === "West Africa" ? "All West Africa" : region.label}
                </option>
              ))}
            </select>

            <select value={stagedFilters.countryId} onChange={(event) => patchStaged({ countryId: event.target.value })}>
              <option value="all">All Countries</option>
              {regionCountries.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>

            <select value={stagedFilters.cityId} onChange={(event) => patchStaged({ cityId: event.target.value })}>
              <option value="all">All Cities</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>

            <span className="rail-label time-label">Select time period</span>
            <div className="year-grid">
              <label>
                <span>Start Year</span>
                <select value={stagedFilters.startYear} onChange={(event) => patchStaged({ startYear: Number(event.target.value) })}>
                  {YEARS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>End Year</span>
                <select value={stagedFilters.endYear} onChange={(event) => patchStaged({ endYear: Number(event.target.value) })}>
                  {YEARS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button className="apply-button" type="button" onClick={applyStagedFilters}>
              Apply
            </button>
          </section>

          <section className="rail-note about-box" id="about-data">
            <span className="rail-label">About NO{"\u2082"} column</span>
            <p>TROPOMI measures the total amount of NO{"\u2082"} in the atmospheric column from the surface to the top of the troposphere.</p>
            <p>Units: {NO2_COLUMN_UNIT_LABEL}</p>
            <a href="#about-data">Learn more →</a>
          </section>

          <p className="rail-source">Data Source: Sentinel-5P TROPOMI Spatial interpolation grid: {INTERPOLATION_RESOLUTION_KM} km Daily Global Coverage</p>
        </aside>

        <main className="content-shell">{children}</main>
      </div>
    </div>
  );
}
