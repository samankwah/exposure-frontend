import { describe, expect, it } from "vitest";
import {
  COUNTRIES,
  DEFAULT_FILTERS,
  getAnnualTrend,
  getCountryRanking,
  getHotspotThreshold,
  getHotspots,
  getMonthlyCycle,
  getSummaryMetrics
} from "../src/data/sampleData";

describe("sample analytics", () => {
  it("returns summary metrics for the dashboard cards", () => {
    const metrics = getSummaryMetrics(DEFAULT_FILTERS);

    expect(metrics).toHaveLength(4);
    expect(metrics[0].value).toContain("ppb");
  });

  it("filters rankings by selected country", () => {
    const rows = getCountryRanking({ ...DEFAULT_FILTERS, countryId: "gha" });

    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe("gha");
  });

  it("calculates an upper quartile hotspot threshold", () => {
    const threshold = getHotspotThreshold(DEFAULT_FILTERS);
    const values = getHotspots(DEFAULT_FILTERS).map((hotspot) => hotspot.no2);

    expect(threshold).toBeGreaterThan(Math.min(...values));
    expect(threshold).toBeLessThanOrEqual(Math.max(...values));
  });

  it("builds annual and monthly chart series", () => {
    expect(getAnnualTrend(DEFAULT_FILTERS)).toHaveLength(5);
    expect(getMonthlyCycle(DEFAULT_FILTERS)).toHaveLength(12);
    expect(COUNTRIES.length).toBeGreaterThan(10);
  });
});
