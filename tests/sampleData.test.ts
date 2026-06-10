import { describe, expect, it } from "vitest";
import {
  COUNTRIES,
  DEFAULT_FILTERS,
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

  it("spans the eastern Chad and Cameroon shapefile extent in the default raster", () => {
    const surface = getInterpolatedNo2Cells(DEFAULT_FILTERS, 0.5);
    const centroids = surface.features.map((feature) => feature.properties.id.split("cell-")[1].split("-").map(Number));

    expect(centroids.some(([longitude, latitude]) => longitude > 22 && latitude > 12 && latitude < 20)).toBe(true);
    expect(centroids.some(([longitude, latitude]) => longitude > 15.5 && latitude < 3.5)).toBe(true);
  });
});
