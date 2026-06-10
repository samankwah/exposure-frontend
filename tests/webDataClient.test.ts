import { afterEach, describe, expect, it } from "vitest";
import { fetchBackendWebDataSnapshot, loadWebDataSnapshot } from "../src/data/webDataClient";
import {
  getCityRows,
  getCountryRows,
  getHealthSeasonSummary,
  getSeasonalTrendRows,
  getLocalWebDataSnapshot,
  RISK_TIER_ORDER,
  canonicalRiskLabel,
  formatPwe,
  resetActiveWebDataSnapshot,
  setActiveWebDataSnapshot,
  type WebDataSnapshot
} from "../src/data/webData";

describe("backend web_data client", () => {
  afterEach(() => {
    resetActiveWebDataSnapshot();
  });

  it("uses the backend dataset response when available", async () => {
    const snapshot = cloneLocalSnapshot();
    snapshot.summary.years_covered = [2030];
    const fetcher = async () => responseFrom(snapshot);

    const result = await loadWebDataSnapshot(fetcher, "http://backend.test");

    expect(result.source).toBe("backend");
    expect(result.snapshot.summary.years_covered).toEqual([2030]);
  });

  it("can load the running backend dataset when explicitly enabled", async () => {
    if (process.env.RUN_LIVE_BACKEND_DATASET_TEST !== "1") return;

    const result = await loadWebDataSnapshot(fetch, process.env.LIVE_BACKEND_URL ?? "http://127.0.0.1:8000");

    expect(result.source).toBe("backend");
    expect(result.snapshot.countryRows?.Annual?.[0]).toMatchObject({ country: "Nigeria", npwei: 100 });
    expect(result.snapshot.cityRows?.Annual?.[0]).toMatchObject({ name: "Lagos", npwei: 100 });
  });

  it("falls back to local web_data when the backend request fails", async () => {
    const fetcher = async () => {
      throw new Error("offline");
    };

    const result = await loadWebDataSnapshot(fetcher, "http://backend.test");

    expect(result.source).toBe("local");
    expect(result.snapshot.summary.years_covered).toEqual(getLocalWebDataSnapshot().summary.years_covered);
  });

  it("rejects malformed backend dataset responses", async () => {
    const fetcher = async () => responseFrom({ summary: getLocalWebDataSnapshot().summary });

    await expect(fetchBackendWebDataSnapshot(fetcher, "http://backend.test")).rejects.toThrow("missing required");
  });

  it("updates helper output when a backend-shaped snapshot becomes active", () => {
    const snapshot = cloneLocalSnapshot();
    snapshot.citiesPwe.Dakar.Annual_pwe = 99_000_000_000_000_000;
    setActiveWebDataSnapshot(snapshot);

    expect(getCityRows("Annual")[0].name).toBe("Dakar");
    expect(getCityRows("Annual")[0].npwei).toBe(100);
  });

  it("prefers backend-adapted rows when they are provided", async () => {
    const snapshot = cloneLocalSnapshot();
    snapshot.cityRows = {
      Annual: [{ ...getCityRows("Annual")[0], name: "Backend City", npwei: 77 }],
      DJF: getCityRows("DJF"),
      JJA: getCityRows("JJA")
    };
    snapshot.countryRows = {
      Annual: [{ ...getCountryRows("Annual")[0], country: "Backend Country", npwei: 88 }],
      DJF: getCountryRows("DJF"),
      JJA: getCountryRows("JJA")
    };

    const result = await loadWebDataSnapshot(async () => responseFrom(snapshot), "http://backend.test");
    setActiveWebDataSnapshot(result.snapshot);

    expect(getCityRows("Annual")[0].name).toBe("Backend City");
    expect(getCityRows("Annual")[0].npwei).toBe(77);
    expect(getCountryRows("Annual")[0].country).toBe("Backend Country");
    expect(getCountryRows("Annual")[0].npwei).toBe(88);
  });

  it("provides the datasets needed by trends, cities, and health pages", () => {
    setActiveWebDataSnapshot(cloneLocalSnapshot());

    expect(getSeasonalTrendRows()).toHaveLength(5);
    expect(getCountryRows("Annual")[0].country).toBe("Nigeria");
    expect(getCityRows("Annual")[0].name).toBe("Lagos");
    expect(getHealthSeasonSummary("Annual").high_risk_population_millions).toBeGreaterThan(0);
  });

  it("uses canonical risk labels while accepting legacy aliases", () => {
    const snapshot = cloneLocalSnapshot();
    snapshot.cityRows = {
      Annual: [{ ...getCityRows("Annual")[0], riskLabel: "Severe/Critical" as never, riskTone: "severe" as never }],
      DJF: getCityRows("DJF"),
      JJA: getCityRows("JJA")
    };
    setActiveWebDataSnapshot(snapshot);

    expect(RISK_TIER_ORDER).toEqual(["Very High", "High", "Moderate", "Low", "Minimal"]);
    expect(canonicalRiskLabel("Elevated")).toBe("Low");
    expect(canonicalRiskLabel("Severe/Critical")).toBe("Very High");
    expect(getCityRows("Annual")[0].riskLabel).toBe("Very High");
    expect(getCityRows("Annual")[0].riskTone).toBe("very-high");
  });

  it("formats PWE in source units", () => {
    expect(formatPwe(3_354_604_383_762_359)).toBe("3.35 x 10^15 molec cm^-2");
  });
});

function cloneLocalSnapshot(): WebDataSnapshot {
  return structuredClone(getLocalWebDataSnapshot());
}

function responseFrom(body: unknown) {
  return {
    json: async () => body,
    ok: true,
    status: 200
  } as Response;
}
