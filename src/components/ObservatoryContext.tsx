"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import type { Filters } from "@/types/exposure";
import { DEFAULT_FILTERS, YEARS } from "@/data/sampleData";

export type ObservatoryFilters = Filters & {
  regionId: string;
  startYear: number;
  endYear: number;
};

interface ObservatoryContextValue {
  filters: ObservatoryFilters;
  stagedFilters: ObservatoryFilters;
  setFilters: Dispatch<SetStateAction<ObservatoryFilters>>;
  setStagedFilters: Dispatch<SetStateAction<ObservatoryFilters>>;
  applyStagedFilters: () => void;
}

const defaultFilters: ObservatoryFilters = {
  ...DEFAULT_FILTERS,
  regionId: DEFAULT_FILTERS.regionId ?? "west-africa",
  startYear: DEFAULT_FILTERS.startYear ?? YEARS[0],
  endYear: DEFAULT_FILTERS.endYear ?? YEARS[YEARS.length - 1],
  year: DEFAULT_FILTERS.endYear ?? YEARS[YEARS.length - 1]
};

const ObservatoryContext = createContext<ObservatoryContextValue | null>(null);

export function ObservatoryProvider({ children }: { children: ReactNode }) {
  const [filters, setFilterState] = useState<ObservatoryFilters>(defaultFilters);
  const [stagedFilters, setStagedFilters] = useState<ObservatoryFilters>(defaultFilters);

  const setFilters: Dispatch<SetStateAction<ObservatoryFilters>> = useCallback((next) => {
    setFilterState((current) => {
      const resolved = typeof next === "function" ? next(current) : next;
      const normalized = normalizeFilters(resolved);
      setStagedFilters(normalized);
      return normalized;
    });
  }, []);

  const applyStagedFilters = useCallback(() => {
    setFilterState(normalizeFilters(stagedFilters));
  }, [stagedFilters]);

  const value = useMemo(
    () => ({ filters, stagedFilters, setFilters, setStagedFilters, applyStagedFilters }),
    [applyStagedFilters, filters, setFilters, stagedFilters]
  );

  return <ObservatoryContext.Provider value={value}>{children}</ObservatoryContext.Provider>;
}

export function useObservatoryFilters() {
  const context = useContext(ObservatoryContext);
  if (!context) {
    throw new Error("useObservatoryFilters must be used inside ObservatoryProvider");
  }
  return context;
}

function normalizeFilters(filters: ObservatoryFilters): ObservatoryFilters {
  const startYear = Math.min(filters.startYear, filters.endYear);
  const endYear = Math.max(filters.startYear, filters.endYear);

  return {
    ...filters,
    startYear,
    endYear,
    year: endYear
  };
}
