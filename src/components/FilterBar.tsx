"use client";

import { useMemo } from "react";
import { CalendarDays, Filter, MapPin } from "lucide-react";
import type { Filters, Season } from "@/types/exposure";
import { useBackendWebData } from "@/data/useWebData";
import { MONTHS, getCityRows, getCountryId, getCountryRows, getWebDataYears } from "@/data/webData";

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  compact?: boolean;
}

export function FilterBar({ filters, onChange, compact = false }: FilterBarProps) {
  const { version: dataVersion } = useBackendWebData();
  const countries = useMemo(() => {
    void dataVersion;
    return getCountryRows("Annual").map((country) => ({ id: getCountryId(country.country), name: country.country }));
  }, [dataVersion]);
  const allCities = useMemo(() => {
    void dataVersion;
    return getCityRows("Annual").map((city) => ({ id: slugId(city.name), countryId: getCountryId(city.country), name: city.name }));
  }, [dataVersion]);
  const cities = filters.countryId === "all" ? allCities : allCities.filter((city) => city.countryId === filters.countryId);
  const years = useMemo(() => {
    void dataVersion;
    return getWebDataYears();
  }, [dataVersion]);

  const patch = (next: Partial<Filters>) => {
    onChange({ ...filters, ...next });
  };

  return (
    <section className={compact ? "filter-bar compact" : "filter-bar"} aria-label="Data filters">
      <label>
        <span>
          <MapPin size={15} aria-hidden />
          Country
        </span>
        <select
          value={filters.countryId}
          onChange={(event) => patch({ countryId: event.target.value, cityId: "all" })}
        >
          <option value="all">West Africa</option>
          {countries.map((country) => (
            <option key={country.id} value={country.id}>
              {country.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>
          <MapPin size={15} aria-hidden />
          City
        </span>
        <select value={filters.cityId} onChange={(event) => patch({ cityId: event.target.value })}>
          <option value="all">All cities</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>
          <CalendarDays size={15} aria-hidden />
          Year
        </span>
        <select value={filters.year} onChange={(event) => patch({ year: Number(event.target.value) })}>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>
          <CalendarDays size={15} aria-hidden />
          Month
        </span>
        <select
          value={filters.month}
          onChange={(event) => patch({ month: event.target.value === "all" ? "all" : Number(event.target.value) })}
        >
          <option value="all">All months</option>
          {MONTHS.map((month, index) => (
            <option key={month} value={index + 1}>
              {month}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>
          <Filter size={15} aria-hidden />
          Season
        </span>
        <select value={filters.season} onChange={(event) => patch({ season: event.target.value as Season })}>
          <option value="all">All seasons</option>
          <option value="dry">Dry season</option>
          <option value="wet">Wet season</option>
        </select>
      </label>
    </section>
  );
}

function slugId(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
