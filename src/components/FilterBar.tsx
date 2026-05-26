"use client";

import { CalendarDays, Filter, MapPin } from "lucide-react";
import type { Filters, Season } from "@/types/exposure";
import { CITIES, COUNTRIES, getCitiesForCountry, MONTHS, YEARS } from "@/data/sampleData";

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  compact?: boolean;
}

export function FilterBar({ filters, onChange, compact = false }: FilterBarProps) {
  const cities = getCitiesForCountry(filters.countryId);

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
          {COUNTRIES.map((country) => (
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
          {(filters.countryId === "all" ? CITIES : cities).map((city) => (
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
          {YEARS.map((year) => (
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
