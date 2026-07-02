import { afterEach, describe, expect, it } from "vitest";
import {
  buildNo2GridDataUrl,
  buildNo2TileUrlTemplate,
  fetchBackendWebDataSnapshot,
  fetchNo2MapGridData,
  fetchNo2MapGridMetadata,
  fetchNo2MapTileMetadata,
  getNo2MapSeasonYearRanges,
  loadNo2MapData,
  loadWebDataSnapshot,
  normalizeNo2MapGridMetadata,
  normalizeNo2MapTileMetadata,
  type No2MapGridMetadata
} from "../src/data/webDataClient";
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

  it("keeps local fallback JSON aligned to the required generated schema", () => {
    const snapshot = getLocalWebDataSnapshot();
    const city = Object.values(snapshot.citiesPwe)[0];
    const country = Object.values(snapshot.countryPwe)[0];

    expect(city).toEqual(expect.objectContaining({
      Annual_pwe: expect.any(Number),
      DJF_pwe: expect.any(Number),
      JJA_pwe: expect.any(Number),
      country: expect.any(String),
      urban_pop: expect.any(Number)
    }));
    expect(country).toEqual(expect.objectContaining({
      Annual: expect.any(Number),
      DJF: expect.any(Number),
      JJA: expect.any(Number),
      urban_population_millions: expect.any(Number)
    }));
    expect(snapshot.summary).toEqual(expect.objectContaining({
      formula: expect.any(String),
      no2_units: expect.any(String),
      years_covered: expect.any(Array)
    }));
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

  it("parses NO2 map metadata and builds the vector tile URL template", async () => {
    const metadata = await fetchNo2MapTileMetadata(async () => responseFrom(sampleMapMetadata()), "http://backend.test");

    expect(metadata.valueField).toBe("log10_pixel_exposure");
    expect(metadata.log10PixelExposure).toEqual({ min: 18.2, max: 20.4 });
    expect(getNo2MapSeasonYearRanges(metadata, "DJF", 2024)?.log10PixelExposure).toEqual({ min: 19.1, max: 20.1 });
    expect(getNo2MapSeasonYearRanges(metadata, "JJA", 2024)?.log10PixelExposure).toEqual({ min: 18.5, max: 19.4 });
    expect(buildNo2TileUrlTemplate(metadata, "Annual", 2024, "http://backend.test")).toBe(
      "http://backend.test/api/map/no2/tiles/Annual/2024/{z}/{x}/{y}.mvt"
    );
    expect(buildNo2TileUrlTemplate(metadata, "DJF", 2024, "http://backend.test")).toBe(
      "http://backend.test/api/map/no2/tiles/DJF/2024/{z}/{x}/{y}.mvt"
    );
  });

  it("normalizes null NO2 map season-year definition as omitted", () => {
    const metadata = normalizeNo2MapTileMetadata({ ...sampleMapMetadata(), seasonYearDefinition: null });

    expect(metadata.seasonYearDefinition).toBeUndefined();
  });

  it("rejects map metadata that is not keyed to log10 pixel exposure", () => {
    const metadata = { ...sampleMapMetadata(), valueField: "npwei" };

    expect(() => normalizeNo2MapTileMetadata(metadata)).toThrow("log10_pixel_exposure");
  });

  it("parses NO2 grid metadata and builds the grid data URL", async () => {
    const metadata = await fetchNo2MapGridMetadata(async () => responseFrom(sampleGridMetadata()), "http://backend.test");

    expect(metadata.valueField).toBe("log10_pixel_exposure");
    expect(metadata.log10PixelExposure).toEqual({ min: 18.2, max: 20.4 });
    expect(buildNo2GridDataUrl(metadata, "DJF", 2024, "http://backend.test")).toBe(
      "http://backend.test/api/map/no2/grid/DJF/2024.json"
    );
  });

  it("normalizes null NO2 grid season-year definition as omitted", () => {
    const metadata = normalizeNo2MapGridMetadata({ ...sampleGridMetadata(), seasonYearDefinition: null });

    expect(metadata.seasonYearDefinition).toBeUndefined();
  });

  it("rejects grid metadata that is not keyed to log10 pixel exposure", () => {
    const metadata = { ...sampleGridMetadata(), valueField: "npwei" };

    expect(() => normalizeNo2MapGridMetadata(metadata)).toThrow("log10_pixel_exposure");
  });

  it("parses NO2 grid GeoJSON feature collections", async () => {
    const body = {
      type: "FeatureCollection",
      features: [{ type: "Feature", properties: { log10_pixel_exposure: 19 }, geometry: null }]
    };

    const data = await fetchNo2MapGridData(async () => responseFrom(body), sampleGridMetadata(), "Annual", 2024, "http://backend.test");

    expect(data.features).toHaveLength(1);
    expect(data.features[0].properties?.log10_pixel_exposure).toBe(19);
  });

  it("uses the tile source when NO2 tile metadata supports the requested season and year", async () => {
    const requests: string[] = [];
    const fetcher: typeof fetch = async (url) => {
      const requestUrl = String(url);
      requests.push(requestUrl);
      if (requestUrl.endsWith("/api/map/no2/metadata")) return responseFrom(sampleMapMetadata());
      if (requestUrl.includes("/api/map/no2/tiles/Annual/2024/4/")) return responseFrom(null);
      throw new Error(`Unexpected request ${requestUrl}`);
    };

    const result = await loadNo2MapData(fetcher, "http://backend.test", "Annual", 2024, { retryDelayMs: 0 });

    expect(result.source).toBe("tile");
    expect(result.metadata.layerName).toBe("no2_pixels");
    expect(requests[0]).toBe("http://backend.test/api/map/no2/metadata");
    expect(requests.slice(1).length).toBeGreaterThan(0);
    expect(requests.slice(1).every((request) => request.includes("/api/map/no2/tiles/Annual/2024/4/"))).toBe(true);
    expect(requests.some((request) => request.includes("/api/map/no2/ti/"))).toBe(false);
  });

  it("falls back to grid source when NO2 tile metadata is unavailable", async () => {
    const requests: string[] = [];
    const fetcher: typeof fetch = async (url) => {
      const requestUrl = String(url);
      requests.push(requestUrl);
      if (requestUrl.endsWith("/api/map/no2/metadata")) return responseFrom(null, { status: 204 });
      if (requestUrl.endsWith("/api/map/no2/grid/metadata")) return responseFrom(sampleGridMetadata());
      if (requestUrl.endsWith("/api/map/no2/grid/DJF/2024.json")) return responseFrom(sampleGridFeatureCollection());
      throw new Error(`Unexpected request ${requestUrl}`);
    };

    const result = await loadNo2MapData(fetcher, "http://backend.test", "DJF", 2024, { retryDelayMs: 0 });

    if (result.source !== "grid") throw new Error(`Expected grid source, received ${result.source}`);
    expect(result.data.features).toHaveLength(1);
    expect(requests).toEqual([
      "http://backend.test/api/map/no2/metadata",
      "http://backend.test/api/map/no2/grid/metadata",
      "http://backend.test/api/map/no2/grid/DJF/2024.json"
    ]);
  });

  it("retries transient metadata fetch failures and succeeds without a page refresh", async () => {
    let metadataAttempts = 0;
    const fetcher: typeof fetch = async (url) => {
      const requestUrl = String(url);
      if (requestUrl.endsWith("/api/map/no2/metadata")) {
        metadataAttempts += 1;
        if (metadataAttempts < 3) throw new Error("NO2 tile metadata is warming up");
        return responseFrom(sampleMapMetadata());
      }
      if (requestUrl.includes("/api/map/no2/tiles/Annual/2024/4/")) return responseFrom(null);
      throw new Error(`Unexpected request ${requestUrl}`);
    };

    const result = await loadNo2MapData(fetcher, "http://backend.test", "Annual", 2024, { retryDelayMs: 0 });

    expect(result.source).toBe("tile");
    expect(metadataAttempts).toBe(3);
  });

  it("falls back to grid source when initial NO2 tile coverage is incomplete", async () => {
    const requests: string[] = [];
    const fetcher: typeof fetch = async (url) => {
      const requestUrl = String(url);
      requests.push(requestUrl);
      if (requestUrl.endsWith("/api/map/no2/metadata")) return responseFrom(sampleMapMetadata());
      if (requestUrl.includes("/api/map/no2/tiles/DJF/2024/4/")) return responseFrom(null, { status: 404 });
      if (requestUrl.endsWith("/api/map/no2/grid/metadata")) return responseFrom(sampleGridMetadata());
      if (requestUrl.endsWith("/api/map/no2/grid/DJF/2024.json")) return responseFrom(sampleGridFeatureCollection());
      throw new Error(`Unexpected request ${requestUrl}`);
    };

    const result = await loadNo2MapData(fetcher, "http://backend.test", "DJF", 2024, { retryDelayMs: 0 });

    if (result.source !== "grid") throw new Error(`Expected grid source, received ${result.source}`);
    expect(requests.some((request) => request.includes("/api/map/no2/tiles/DJF/2024/4/"))).toBe(true);
    expect(requests).toContain("http://backend.test/api/map/no2/grid/metadata");
    expect(result.data.features).toHaveLength(1);
  });

  it("stops with a clear error after the NO2 map data retry budget is exhausted", async () => {
    let metadataAttempts = 0;
    const fetcher: typeof fetch = async () => {
      metadataAttempts += 1;
      throw new Error("NO2 tile metadata is still unavailable");
    };

    await expect(loadNo2MapData(fetcher, "http://backend.test", "Annual", 2024, { retries: 1, retryDelayMs: 0 })).rejects.toThrow(
      "NO2 tile metadata is still unavailable"
    );
    expect(metadataAttempts).toBe(2);
  });

});

function cloneLocalSnapshot(): WebDataSnapshot {
  return structuredClone(getLocalWebDataSnapshot());
}

function responseFrom(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  const status = init.status ?? 200;
  return {
    json: async () => body,
    ok: init.ok ?? (status >= 200 && status < 300),
    status
  } as Response;
}

function sampleMapMetadata() {
  return {
    availableYears: [2024],
    availableSeasons: ["Annual", "DJF", "JJA"],
    tileUrlTemplate: "/api/map/no2/tiles/{season}/{year}/{z}/{x}/{y}.mvt",
    bounds: [-18.2, 4.0, 15.2, 16.0],
    minzoom: 4,
    maxzoom: 8,
    layerName: "no2_pixels",
    valueField: "log10_pixel_exposure",
    no2Column: { min: 1.0e15, max: 6.0e15 },
    populationCount: { min: 120, max: 64000 },
    pixelExposure: { min: 1.0e18, max: 2.5e20 },
    log10PixelExposure: { min: 18.2, max: 20.4 },
    rangesBySeasonYear: {
      Annual: {
        "2024": {
          no2Column: { min: 1.0e15, max: 6.0e15 },
          populationCount: { min: 120, max: 64000 },
          pixelExposure: { min: 1.0e18, max: 2.5e20 },
          log10PixelExposure: { min: 18.2, max: 20.4 }
        }
      },
      DJF: {
        "2024": {
          no2Column: { min: 2.0e15, max: 6.0e15 },
          populationCount: { min: 120, max: 64000 },
          pixelExposure: { min: 1.3e19, max: 1.3e20 },
          log10PixelExposure: { min: 19.1, max: 20.1 }
        }
      },
      JJA: {
        "2024": {
          no2Column: { min: 1.0e15, max: 3.0e15 },
          populationCount: { min: 120, max: 64000 },
          pixelExposure: { min: 3.0e18, max: 2.5e19 },
          log10PixelExposure: { min: 18.5, max: 19.4 }
        }
      }
    },
    units: {
      no2Column: "molec cm-2",
      populationCount: "people",
      pixelExposure: "molec cm-2 people",
      log10PixelExposure: "log10(molec cm-2 people)",
      npwei: "normalized 0-100 index"
    },
    generatedAt: "2026-01-01T00:00:00+00:00"
  };
}

function sampleGridMetadata(): No2MapGridMetadata {
  return {
    availableYears: [2024],
    availableSeasons: ["Annual", "DJF", "JJA"],
    dataUrlTemplate: "/api/map/no2/grid/{season}/{year}.json",
    bounds: [-18.2, 4.0, 15.2, 16.0],
    layerName: "no2_population_grid",
    valueField: "log10_pixel_exposure",
    no2Column: { min: 1.0e15, max: 6.0e15 },
    populationCount: { min: 120, max: 64000 },
    pixelExposure: { min: 1.0e18, max: 2.5e20 },
    log10PixelExposure: { min: 18.2, max: 20.4 },
    units: {
      no2Column: "molec cm-2",
      populationCount: "people",
      pixelExposure: "molec cm-2 people",
      log10PixelExposure: "log10(molec cm-2 people)",
      npwei: "normalized 0-100 index"
    },
    generatedAt: "2026-01-01T00:00:00+00:00"
  };
}

function sampleGridFeatureCollection() {
  return {
    type: "FeatureCollection",
    features: [{ type: "Feature", properties: { log10_pixel_exposure: 19 }, geometry: null }]
  };
}
