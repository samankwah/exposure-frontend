import { describe, expect, it } from "vitest";
import {
  COUNTRIES,
  DEFAULT_FILTERS,
  NO2_COLUMN_UNIT_LABEL,
  YEARS,
  getAnnualTrend,
  getCountryRanking,
  getHotspotThreshold,
  getHotspots,
  getInterpolatedNo2Cells,
  getMapCityRanking,
  getMapKpis,
  getMonthlyCycle,
  getNpweiValue,
  getSummaryMetrics
} from "../src/data/sampleData";

describe("sample analytics", () => {
  it("returns summary metrics for the dashboard cards", () => {
    const metrics = getSummaryMetrics(DEFAULT_FILTERS);

    expect(metrics).toHaveLength(4);
    expect(metrics[0].value).not.toContain("ppb");
    expect(metrics[0].detail).toContain(NO2_COLUMN_UNIT_LABEL);
    expect(metrics[3].detail).toContain(NO2_COLUMN_UNIT_LABEL);
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
    expect(getAnnualTrend(DEFAULT_FILTERS)).toHaveLength(YEARS.length);
    expect(getMonthlyCycle(DEFAULT_FILTERS)).toHaveLength(12);
    expect(COUNTRIES.length).toBeGreaterThan(10);
  });

  it("builds map helper values for both metric modes", () => {
    const npweiRows = getMapCityRanking(DEFAULT_FILTERS, "npwei");
    const no2Rows = getMapCityRanking(DEFAULT_FILTERS, "no2");
    const npwei = getNpweiValue(DEFAULT_FILTERS, npweiRows[0].id);

    expect(npweiRows).toHaveLength(15);
    expect(no2Rows).toHaveLength(15);
    expect(npwei).toBeGreaterThanOrEqual(0);
    expect(npwei).toBeLessThanOrEqual(100);
    expect(getMapKpis(DEFAULT_FILTERS, "npwei")).toHaveLength(5);
    expect(getMapKpis(DEFAULT_FILTERS, "no2")).toHaveLength(5);
    expect(no2Rows[0].value).not.toBe(npweiRows[0].value);
  });

  it("keeps the default raster inside the West Africa country boundary extent", () => {
    const surface = getInterpolatedNo2Cells(DEFAULT_FILTERS, 0.5);
    const coordinates = surface.features.flatMap((feature) => feature.geometry.coordinates[0]);

    expect(coordinates.length).toBeGreaterThan(0);
    expect(coordinates.every(([longitude]) => longitude <= 16.2)).toBe(true);
    expect(coordinates.every(([, latitude]) => latitude >= 4.0)).toBe(true);
    expect(coordinates.some(([longitude, latitude]) => longitude > 15.5 && latitude < 3.5)).toBe(false);
    expect(coordinates.some(([longitude]) => longitude > 22)).toBe(false);
  });
});
