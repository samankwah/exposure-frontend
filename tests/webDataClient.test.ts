import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildNo2GridDataUrl,
  buildNo2TileUrlTemplate,
  clearNo2MapDataCache,
  fetchBackendWebDataSnapshot,
  fetchNo2MapGridData,
  fetchNo2MapGridMetadata,
  fetchNo2MapTileMetadata,
  getApiBaseUrl,
  getNo2MapDisplayLog10ExposureRange,
  getNo2MapDisplaySeasonYearRanges,
  getNo2MapSeasonYearRanges,
  loadNo2MapData,
  loadWebDataSnapshot,
  normalizeNo2MapGridMetadata,
  normalizeNo2MapTileMetadata,
  type No2MapGridMetadata
} from "../src/data/webDataClient";
import {
  THEME_STORAGE_KEY,
  readStoredTheme,
  resolveInitialTheme,
  writeStoredTheme
} from "../src/components/ThemeProvider";
import {
  DEFAULT_FILTERS,
  NO2_COLUMN_UNIT,
  NO2_COLUMN_UNIT_LABEL,
  getCityRows,
  getCountryRows,
  getHealthSeasonSummary,
  getOverviewSummaryMetrics,
  getSeasonalTrendRows,
  getLocalWebDataSnapshot,
  RISK_TIER_ORDER,
  canonicalRiskLabel,
  formatPwe,
  resetActiveWebDataSnapshot,
  setActiveWebDataSnapshot,
  type WebDataSnapshot
} from "../src/data/webData";

const ORIGINAL_NEXT_PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const ORIGINAL_NEXT_PUBLIC_API_BASE = process.env.NEXT_PUBLIC_API_BASE;

vi.mock("@deck.gl/react", () => ({ default: () => null }));
vi.mock("@deck.gl/layers", () => ({ GeoJsonLayer: class MockGeoJsonLayer {} }));
vi.mock("@deck.gl/geo-layers", () => ({ MVTLayer: class MockMvtLayer {} }));
vi.mock("maplibre-gl", () => ({}));
vi.mock("react-map-gl/maplibre", () => ({ default: () => null, ScaleControl: () => null }));

describe("backend web_data client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    restoreEnvValue("NEXT_PUBLIC_API_BASE_URL", ORIGINAL_NEXT_PUBLIC_API_BASE_URL);
    restoreEnvValue("NEXT_PUBLIC_API_BASE", ORIGINAL_NEXT_PUBLIC_API_BASE);
    clearNo2MapDataCache();
    resetActiveWebDataSnapshot();
  });

  it("uses the configured production API base URL without a trailing slash", () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://exposure-backend-eta.vercel.app/";
    delete process.env.NEXT_PUBLIC_API_BASE;

    expect(getApiBaseUrl()).toBe("https://exposure-backend-eta.vercel.app");
  });

  it("uses the deployed backend on the Netlify hostname when the build env is missing", () => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    delete process.env.NEXT_PUBLIC_API_BASE;
    vi.stubGlobal("window", { location: { hostname: "no2exposure.netlify.app" } });

    expect(getApiBaseUrl()).toBe("https://exposure-backend-eta.vercel.app");
  });

  it("defaults local previews to the deployed backend when no API env is configured", () => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    delete process.env.NEXT_PUBLIC_API_BASE;
    vi.stubGlobal("window", { location: { hostname: "localhost" } });

    expect(getApiBaseUrl()).toBe("https://exposure-backend-eta.vercel.app");
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

  it("formats PWE in scaled NO2 column display units", () => {
    expect(NO2_COLUMN_UNIT).toBe("x10^15 molecules cm^-2");
    expect(NO2_COLUMN_UNIT_LABEL).toBe("\u00d710^15 molecules cm\u207b\u00b2");
    expect(formatPwe(3_354_604_383_762_359)).toBe(`3.35 ${NO2_COLUMN_UNIT_LABEL}`);
  });

  it("resolves the site theme from stored choice before system preference", () => {
    expect(
      resolveInitialTheme({
        storage: storageReturning("night"),
        matchMedia: mediaMatching(false)
      })
    ).toBe("night");
    expect(
      resolveInitialTheme({
        storage: storageReturning("day"),
        matchMedia: mediaMatching(true)
      })
    ).toBe("day");
    expect(
      resolveInitialTheme({
        storage: storageReturning(null),
        matchMedia: mediaMatching(true)
      })
    ).toBe("night");
    expect(readStoredTheme(storageReturning("unexpected"))).toBeNull();
  });

  it("persists explicit site theme choices under the CLeNE storage key", () => {
    const storage = { setItem: vi.fn() };

    writeStoredTheme(storage, "night");

    expect(storage.setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, "night");
  });

  it("keeps the root layout theme bootstrap in the pre-hydration path", () => {
    const layoutSource = readFileSync(join(process.cwd(), "src", "app", "layout.tsx"), "utf-8");

    expect(layoutSource).toContain("ThemeProvider");
    expect(layoutSource).toContain("suppressHydrationWarning");
    expect(layoutSource).toContain("clene-theme");
    expect(layoutSource).toContain("prefers-color-scheme: dark");
    expect(layoutSource).toContain("document.documentElement.dataset.theme");
    expect(layoutSource).toContain("document.documentElement.style.colorScheme");
  });

  it("adds the day-night toggle to the desktop navbar and mobile drawer actions", () => {
    const navbarSource = readFileSync(join(process.cwd(), "src", "components", "BrandedNavbar.tsx"), "utf-8");
    const toggleSource = readFileSync(join(process.cwd(), "src", "components", "ThemeToggle.tsx"), "utf-8");

    expect(navbarSource).toContain('import { ThemeToggle } from "@/components/ThemeToggle";');
    expect(navbarSource).toContain('className="home-theme-toggle"');
    expect(navbarSource).toContain('className="mobile-nav-theme-toggle"');
    expect(toggleSource).toContain("Sun");
    expect(toggleSource).toContain("Moon");
    expect(toggleSource).toContain("toggleTheme");
    expect(toggleSource).toContain('<span className="sr-only">Toggle color theme</span>');
  });

  it("covers page-specific surfaces and chart canvases in night mode", () => {
    const cssSource = readFileSync(join(process.cwd(), "src", "app", "globals.css"), "utf-8");
    const chartSource = readFileSync(join(process.cwd(), "src", "components", "Charts.tsx"), "utf-8");
    const citiesSource = readFileSync(join(process.cwd(), "src", "components", "CitiesPage.tsx"), "utf-8");
    const healthSource = readFileSync(join(process.cwd(), "src", "components", "HealthPage.tsx"), "utf-8");

    expect(cssSource).toContain('html[data-theme="night"] :where(');
    for (const selector of [
      ".home-page",
      ".branded-data-page",
      ".insights-detail-page",
      ".health-page",
      ".cities-page",
      ".trends-page",
      ".about-page",
      ".contact-page"
    ]) {
      expect(cssSource).toContain(selector);
    }

    expect(chartSource).toContain("useChartColors");
    expect(chartSource).toContain("chartColorThemes");
    expect(chartSource).toContain("gridSoft");
    expect(citiesSource).toContain('resolvedTheme === "night"');
    expect(healthSource).toContain('resolvedTheme === "night"');
  });

  it("keeps Health night surfaces, shared shell spacing, and city pagination guarded", () => {
    const cssSource = readFileSync(join(process.cwd(), "src", "app", "globals.css"), "utf-8");
    const healthSource = readFileSync(join(process.cwd(), "src", "components", "HealthPage.tsx"), "utf-8");
    const healthNightOverrideStart = cssSource.indexOf("/* Final Health night-mode surface hardening. */");
    const shellSpacingStart = cssSource.indexOf("/* Shared branded shell bottom spacing");
    const healthNightOverrideSource = cssSource.slice(healthNightOverrideStart);
    const shellSpacingSource = cssSource.slice(shellSpacingStart);

    expect(healthNightOverrideStart).toBeGreaterThan(-1);
    expect(shellSpacingStart).toBeGreaterThan(-1);
    expect(healthNightOverrideSource).toContain('html[data-theme="night"] .health-page .health-hero');
    expect(healthNightOverrideSource).toContain('html[data-theme="night"] .health-page .city-exposure-section');
    expect(healthNightOverrideSource).toContain("var(--theme-surface)");
    expect(healthNightOverrideSource).toContain("var(--theme-surface-soft)");
    expect(healthNightOverrideSource).toContain("var(--theme-line)");
    expect(healthNightOverrideSource).toContain("var(--theme-text)");
    expect(healthNightOverrideSource).toContain("var(--theme-muted)");
    expect(healthNightOverrideSource).toContain(".health-page .health-kpi-card svg");
    expect(cssSource).toContain("--health-red: #fb7185");
    expect(cssSource).not.toContain("color-mix(in srgb, var(--health-accent) 12%");

    for (const selector of [
      ".data-page-shell",
      ".branded-map-page .data-page-shell",
      ".health-page .health-dashboard-shell",
      ".cities-page .cities-dashboard-shell",
      ".trends-dashboard-shell",
      ".about-dashboard-shell",
      ".contact-dashboard-shell",
      ".insights-detail-shell"
    ]) {
      expect(shellSpacingSource).toContain(selector);
    }
    expect(shellSpacingSource).toContain("padding-bottom: 72px;");
    expect(shellSpacingSource).toContain("padding-bottom: 24px;");

    expect(healthSource).toContain("CITY_EXPOSURE_PAGE_SIZE = 16");
    expect(healthSource).toContain("const [currentPage, setCurrentPage] = useState(1);");
    expect(healthSource).toContain("rows.slice(pageStart, pageEnd)");
    expect(healthSource).toContain("getCityExposurePageItems(currentPage, totalPages)");
    expect(healthSource).toContain('className="city-exposure-pagination-controls"');
    expect(healthSource).toContain('aria-current={item === currentPage ? "page" : undefined}');
    expect(healthSource).toContain("Go to first city exposure page");
    expect(healthSource).toContain("Go to previous city exposure page");
    expect(healthSource).toContain("Go to next city exposure page");
    expect(healthSource).toContain("Go to last city exposure page");
  });

  it("labels dashboard NO2 summary metrics with scaled column units", () => {
    const metrics = getOverviewSummaryMetrics(DEFAULT_FILTERS);

    expect(metrics.find((metric) => metric.label === "West Africa average NO2")?.detail).toBe(NO2_COLUMN_UNIT_LABEL);
    expect(metrics.find((metric) => metric.label === "Highest NO2 country")?.detail).toBe(NO2_COLUMN_UNIT_LABEL);
    expect(metrics.find((metric) => metric.label === "Highest urban hotspot")?.detail).toBe(NO2_COLUMN_UNIT_LABEL);
    expect(metrics.find((metric) => metric.label === "NO2 color range")?.detail).toBe(NO2_COLUMN_UNIT_LABEL);
    expect(metrics.find((metric) => metric.label === "Population in high-column zones")?.detail).toBe("NPWEI >= 60 urban population");
  });

  it("parses NO2 map metadata and builds the vector tile URL template", async () => {
    const metadata = await fetchNo2MapTileMetadata(async () => responseFrom(sampleMapMetadata()), "http://backend.test");

    expect(metadata.valueField).toBe("log10_pixel_exposure");
    expect(metadata.log10PixelExposure).toEqual({ min: 18.2, max: 20.4 });
    expect(getNo2MapSeasonYearRanges(metadata, "DJF", 2024)?.log10PixelExposure).toEqual({ min: 19.1, max: 20.1 });
    expect(getNo2MapDisplaySeasonYearRanges(metadata, "DJF", 2024)?.log10PixelExposure).toEqual({ min: 18.6, max: 20.4 });
    expect(getNo2MapSeasonYearRanges(metadata, "JJA", 2024)?.log10PixelExposure).toEqual({ min: 18.5, max: 19.4 });
    expect(buildNo2TileUrlTemplate(metadata, "Annual", 2024, "http://backend.test")).toBe(
      "http://backend.test/api/map/no2/tiles/Annual/2024/{z}/{x}/{y}.mvt"
    );
    expect(buildNo2TileUrlTemplate(metadata, "DJF", 2024, "http://backend.test")).toBe(
      "http://backend.test/api/map/no2/tiles/DJF/2024/{z}/{x}/{y}.mvt"
    );
  });

  it("uses clipped grid NO2 map ranges between display season-year and raw ranges", () => {
    const metadata = normalizeNo2MapTileMetadata(sampleMapMetadata());
    const withoutSeasonDisplay = normalizeNo2MapTileMetadata({ ...sampleMapMetadata(), displayRangesBySeasonYear: {} });
    const withoutDisplayRanges = normalizeNo2MapTileMetadata({
      ...sampleMapMetadata(),
      displayLog10PixelExposure: undefined,
      displayRangesBySeasonYear: undefined
    });
    const rawWideGridMetadata = normalizeNo2MapGridMetadata({
      ...sampleGridMetadata(),
      log10PixelExposure: { min: 18.4, max: 22.4 },
      rangesBySeasonYear: {
        DJF: {
          "2024": {
            no2Column: { min: 1.0e15, max: 6.0e15 },
            populationCount: { min: 120, max: 64000 },
            pixelExposure: { min: 1.0e18, max: 2.5e22 },
            log10PixelExposure: { min: 18.4, max: 22.4 }
          }
        }
      }
    });
    const clippedRange = { min: 18.6, max: 20.4 };

    expect(getNo2MapDisplayLog10ExposureRange(metadata, "Annual", 2024, clippedRange)).toEqual({ min: 18.7, max: 20.2 });
    expect(getNo2MapDisplayLog10ExposureRange(withoutSeasonDisplay, "Annual", 2024, clippedRange)).toEqual(clippedRange);
    expect(getNo2MapDisplayLog10ExposureRange(withoutSeasonDisplay, "Annual", 2024)).toEqual({ min: 18.6, max: 20.2 });
    expect(getNo2MapDisplayLog10ExposureRange(withoutDisplayRanges, "DJF", 2024, clippedRange)).toEqual(clippedRange);
    expect(getNo2MapDisplayLog10ExposureRange(withoutDisplayRanges, "DJF", 2024)).toEqual({ min: 19.1, max: 20.1 });
    expect(getNo2MapDisplayLog10ExposureRange(rawWideGridMetadata, "DJF", 2024, clippedRange)).toEqual(clippedRange);
    expect(getNo2MapDisplayLog10ExposureRange(rawWideGridMetadata, "DJF", 2024)).toEqual({ min: 18.4, max: 22.4 });
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
    expect(requests.some((request) => request.includes("/api/map/no2/tiles/Annual/2024/4/"))).toBe(true);
    expect(requests.some((request) => request.includes("/api/map/no2/grid/"))).toBe(false);
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

  it("shares cached and in-flight NO2 map requests for duplicate load targets", async () => {
    const requests: string[] = [];
    const fetcher: typeof fetch = async (url) => {
      const requestUrl = String(url);
      requests.push(requestUrl);
      if (requestUrl.endsWith("/api/map/no2/metadata")) return responseFrom(null, { status: 204 });
      if (requestUrl.endsWith("/api/map/no2/grid/metadata")) return responseFrom(sampleGridMetadata());
      if (requestUrl.endsWith("/api/map/no2/grid/DJF/2024.json")) return responseFrom(sampleGridFeatureCollection());
      throw new Error(`Unexpected request ${requestUrl}`);
    };

    const [firstResult, secondResult] = await Promise.all([
      loadNo2MapData(fetcher, "http://backend.test", "DJF", 2024, { retryDelayMs: 0 }),
      loadNo2MapData(fetcher, "http://backend.test", "DJF", 2024, { retryDelayMs: 0 })
    ]);
    const cachedResult = await loadNo2MapData(fetcher, "http://backend.test", "DJF", 2024, { retryDelayMs: 0 });

    expect(firstResult.source).toBe("grid");
    expect(secondResult).toBe(firstResult);
    expect(cachedResult).toBe(firstResult);
    expect(requests.filter((request) => request.endsWith("/api/map/no2/metadata"))).toHaveLength(1);
    expect(requests.filter((request) => request.endsWith("/api/map/no2/grid/metadata"))).toHaveLength(1);
    expect(requests.filter((request) => request.endsWith("/api/map/no2/grid/DJF/2024.json"))).toHaveLength(1);
  });

  it("retries transient grid metadata fetch failures and succeeds without a page refresh", async () => {
    let gridMetadataAttempts = 0;
    const requests: string[] = [];
    const fetcher: typeof fetch = async (url) => {
      const requestUrl = String(url);
      requests.push(requestUrl);
      if (requestUrl.endsWith("/api/map/no2/metadata")) return responseFrom(null, { status: 204 });
      if (requestUrl.endsWith("/api/map/no2/grid/metadata")) {
        gridMetadataAttempts += 1;
        if (gridMetadataAttempts < 3) throw new Error("NO2 grid metadata is warming up");
        return responseFrom(sampleGridMetadata());
      }
      if (requestUrl.endsWith("/api/map/no2/grid/Annual/2024.json")) return responseFrom(sampleGridFeatureCollection());
      throw new Error(`Unexpected request ${requestUrl}`);
    };

    const result = await loadNo2MapData(fetcher, "http://backend.test", "Annual", 2024, { retryDelayMs: 0 });

    expect(result.source).toBe("grid");
    expect(gridMetadataAttempts).toBe(3);
    expect(requests.filter((request) => request.endsWith("/api/map/no2/metadata"))).toHaveLength(3);
    expect(requests).toContain("http://backend.test/api/map/no2/grid/Annual/2024.json");
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

  it("falls back to grid source when optional NO2 tile metadata fetches fail", async () => {
    const requests: string[] = [];
    const fetcher: typeof fetch = async (url) => {
      const requestUrl = String(url);
      requests.push(requestUrl);
      if (requestUrl.endsWith("/api/map/no2/metadata")) throw new TypeError("Failed to fetch");
      if (requestUrl.endsWith("/api/map/no2/grid/metadata")) return responseFrom(sampleGridMetadata());
      if (requestUrl.endsWith("/api/map/no2/grid/Annual/2024.json")) return responseFrom(sampleGridFeatureCollection());
      throw new Error(`Unexpected request ${requestUrl}`);
    };

    const result = await loadNo2MapData(fetcher, "http://backend.test", "Annual", 2024, { retryDelayMs: 0 });

    if (result.source !== "grid") throw new Error(`Expected grid source, received ${result.source}`);
    expect(requests).toEqual([
      "http://backend.test/api/map/no2/metadata",
      "http://backend.test/api/map/no2/grid/metadata",
      "http://backend.test/api/map/no2/grid/Annual/2024.json"
    ]);
    expect(result.data.features).toHaveLength(1);
  });

  it("starts grid fallback only after a tile probe confirms missing coverage", async () => {
    const requests: string[] = [];
    const slowTileUrl = "http://backend.test/api/map/no2/tiles/Annual/2024/4/7/7.mvt";
    const incompleteTileUrl = "http://backend.test/api/map/no2/tiles/Annual/2024/4/8/7.mvt";
    let releaseSlowProbe: () => void = () => {};
    let slowProbeResolved = false;
    const fetcher: typeof fetch = async (url) => {
      const requestUrl = String(url);
      requests.push(requestUrl);
      if (requestUrl.endsWith("/api/map/no2/metadata")) return responseFrom(sampleMapMetadata());
      if (requestUrl.endsWith("/api/map/no2/grid/metadata")) return responseFrom(sampleGridMetadata());
      if (requestUrl.endsWith("/api/map/no2/grid/Annual/2024.json")) return responseFrom(sampleGridFeatureCollection());
      if (requestUrl === slowTileUrl) {
        return new Promise<Response>((resolve) => {
          releaseSlowProbe = () => {
            slowProbeResolved = true;
            resolve(responseFrom(null));
          };
        });
      }
      if (requestUrl === incompleteTileUrl) return responseFrom(null, { status: 404 });
      throw new Error(`Unexpected request ${requestUrl}`);
    };

    const result = await loadNo2MapData(fetcher, "http://backend.test", "Annual", 2024, { retryDelayMs: 0 });

    if (result.source !== "grid") throw new Error(`Expected grid source, received ${result.source}`);
    expect(result.data.features).toHaveLength(1);
    expect(slowProbeResolved).toBe(false);
    expect(requests).toContain(slowTileUrl);
    expect(requests).toContain(incompleteTileUrl);
    expect(requests.indexOf("http://backend.test/api/map/no2/grid/metadata")).toBeGreaterThan(requests.indexOf(incompleteTileUrl));

    releaseSlowProbe();
  });

  it("stops with the unavailable-map error when the selected map year is unsupported", async () => {
    const requests: string[] = [];
    const fetcher: typeof fetch = async (url) => {
      const requestUrl = String(url);
      requests.push(requestUrl);
      if (requestUrl.endsWith("/api/map/no2/metadata")) return responseFrom(sampleMapMetadata());
      if (requestUrl.endsWith("/api/map/no2/grid/metadata")) return responseFrom(sampleGridMetadata());
      throw new Error(`Unexpected request ${requestUrl}`);
    };

    await expect(loadNo2MapData(fetcher, "http://backend.test", "Annual", 2023, { retryDelayMs: 0 })).rejects.toThrow(
      "Backend NO2 population grid is unavailable for 2023."
    );
    expect(requests).toEqual(["http://backend.test/api/map/no2/metadata", "http://backend.test/api/map/no2/grid/metadata"]);
    expect(requests.some((request) => request.toLowerCase().includes("month"))).toBe(false);
  });

  it("stops with a clear error after the NO2 map data retry budget is exhausted", async () => {
    let gridMetadataAttempts = 0;
    const fetcher: typeof fetch = async (url) => {
      const requestUrl = String(url);
      if (requestUrl.endsWith("/api/map/no2/metadata")) throw new Error("NO2 tile metadata is still unavailable");
      if (requestUrl.endsWith("/api/map/no2/grid/metadata")) {
        gridMetadataAttempts += 1;
        throw new Error("NO2 grid metadata is still unavailable");
      }
      throw new Error(`Unexpected request ${requestUrl}`);
    };

    await expect(loadNo2MapData(fetcher, "http://backend.test", "Annual", 2024, { retries: 1, retryDelayMs: 0 })).rejects.toThrow(
      "NO2 grid metadata is still unavailable"
    );
    expect(gridMetadataAttempts).toBe(2);
  });

  it("keeps the map implementation on backend grid or MVT sources instead of synthetic sample surfaces", () => {
    const source = readFileSync(join(process.cwd(), "src", "components", "TargetNpweiMap.tsx"), "utf-8");
    const dashboardSource = readFileSync(join(process.cwd(), "src", "components", "DashboardView.tsx"), "utf-8");
    const mapExplorerSource = readFileSync(join(process.cwd(), "src", "components", "MapExplorer.tsx"), "utf-8");
    const webDataClientSource = readFileSync(join(process.cwd(), "src", "data", "webDataClient.ts"), "utf-8");
    const skeletonSource = readFileSync(join(process.cwd(), "src", "components", "Skeletons.tsx"), "utf-8");
    const legacyMapSource = readFileSync(join(process.cwd(), "src", "components", "ExposureMap.tsx"), "utf-8");

    expect(source).toContain("MVTLayer");
    expect(source).toContain("GeoJsonLayer");
    expect(source).toContain("loadNo2MapData(fetch, apiBaseUrl, season, year)");
    expect(source).not.toContain("void month");
    expect(source).not.toContain("month:");
    expect(webDataClientSource).toContain("fetchNo2MapTileMetadata");
    expect(webDataClientSource).toContain("fetchNo2MapGridMetadata");
    expect(webDataClientSource).toContain("fetchNo2MapGridData");
    expect(webDataClientSource).toContain("DEFAULT_NO2_MAP_DATA_RETRIES = 2");
    expect(webDataClientSource).toContain("NO2_MAP_TILE_PREFLIGHT_LIMIT");
    expect(source).toContain("getNo2MapSeasonYearRanges(metadata, season, year)");
    expect(source).toContain("const clippedLog10ExposureRange = useMemo(() => {");
    expect(source).toContain('"log10_pixel_exposure"');
    expect(source).toContain("const log10ExposureColorRange = getNo2MapDisplayLog10ExposureRange(");
    expect(source).toContain('mapDataState.source === "grid" ? clippedLog10ExposureRange : null');
    expect(source).toContain("log10ExposureRange={log10ExposureColorRange}");
    expect(webDataClientSource).toContain("getNo2MapDisplaySeasonYearRanges(metadata, season, year)?.log10PixelExposure");
    expect(webDataClientSource).toContain("clippedLog10ExposureRange ??");
    expect(webDataClientSource).toContain("metadata.displayLog10PixelExposure ??");
    expect(webDataClientSource).toContain("getNo2MapSeasonYearRanges(metadata, season, year)?.log10PixelExposure ??");
    expect(source).toContain("html: getTooltipHtml(properties, metadata, rows)");
    expect(source).toContain('className: "target-map-tooltip"');
    expect(source).toContain("NO₂ column");
    expect(source).toContain("Population");
    expect(source).toContain("Pixel exposure");
    expect(source).toContain("Log exposure");
    expect(source).not.toContain("text: getTooltipText");
    expect(source).not.toContain("log10(pixel_exposure)");
    expect(source).toContain("PWE = NO2 x Population, Log Scale");
    expect(source).toContain('"background-color": "#ffffff"');
    expect(source).toContain('opacity: layerMode === "population" ? 0.76 : 0.94');
    expect(source).toContain('opacity: layerMode === "population" ? 0.72 : 0.96');
    expect(source).toContain("getLogExposureColor(Number(properties.log10_pixel_exposure ?? 0), log10ExposureRange, 226)");
    expect(source).toContain('className="target-map-legend-end target-map-legend-low"');
    expect(source).toContain('className="target-map-legend-end target-map-legend-high"');
    expect(source).toContain('className="target-map-legend-value target-map-legend-min"');
    expect(source).toContain('className="target-map-legend-value target-map-legend-mid"');
    expect(source).toContain('className="target-map-legend-value target-map-legend-max"');
    expect(source).not.toContain("getLegendTicks(range, layerMode)");
    expect(source).toContain("DAY_MAP_STYLE");
    expect(source).toContain("NIGHT_MAP_STYLE");
    expect(source).toContain("light_all/{z}/{x}/{y}.png");
    expect(source).toContain("dark_all/{z}/{x}/{y}.png");
    expect(source).toContain('resolvedTheme === "night" ? NIGHT_MAP_STYLE : DAY_MAP_STYLE');
    expect(source).not.toContain("local-country-context-fill");
    expect(source).not.toContain("local-country-labels");
    expect(source).not.toContain("COUNTRY_LABELS");
    expect(source).not.toContain("[238, 247, 242");
    expect(source).not.toContain("Fallback");
    expect(source).not.toContain("ScatterplotLayer");
    expect(source).not.toContain("getSparseNo2PixelSurface");
    expect(source).not.toContain("interpolateExposureCell");
    expect(source).not.toContain("SUPPLEMENTAL_EXPOSURE_SOURCES");
    expect(source).not.toContain("@/data/sampleData");
    expect(source).toContain("basemaps.cartocdn.com");
    expect(mapExplorerSource).toContain('import dynamic from "next/dynamic";');
    expect(mapExplorerSource).toContain('import type { TargetNpweiMapProps } from "@/components/TargetNpweiMap";');
    expect(mapExplorerSource).toContain('() => import("@/components/TargetNpweiMap").then((module) => module.TargetNpweiMap)');
    expect(mapExplorerSource).toContain("<TargetNpweiMap");
    expect(mapExplorerSource).not.toContain("Monthly map tiles unavailable");
    expect(mapExplorerSource).not.toContain("target-map-disabled-control");
    expect(mapExplorerSource).not.toContain("SelectedYearSummaryPanel");
    expect(mapExplorerSource).not.toContain("Selected Year Summary");
    expect(mapExplorerSource).not.toContain("buildSelectedYearSummary");
    expect(mapExplorerSource).not.toContain("target-selected-year-summary");
    expect(mapExplorerSource).not.toContain("setMonth");
    expect(mapExplorerSource).not.toContain("max={12}");
    expect(mapExplorerSource).not.toContain("month={");
    expect(dashboardSource).not.toContain("month={");
    expect(dashboardSource).toContain('import dynamic from "next/dynamic";');
    expect(mapExplorerSource).not.toContain("window.location.reload");
    expect(mapExplorerSource).not.toContain("sessionStorage");
    expect(mapExplorerSource).not.toContain('import { TargetNpweiMap } from "@/components/TargetNpweiMap";');
    expect(mapExplorerSource).not.toContain("dynamic<DeferredTargetMapProps>");
    expect(mapExplorerSource).not.toContain("TARGET_MAP_CHUNK_RELOAD_KEY");
    expect(skeletonSource).toContain("skeleton-map-panel");
    expect(skeletonSource).toContain("skeleton-map-zoom");
    expect(skeletonSource).toContain("skeleton-map-layers");
    expect(skeletonSource).toContain("skeleton-map-legend");
    expect(skeletonSource).not.toContain("skeleton-map-land");
    expect(mapExplorerSource).not.toContain("@/data/sampleData");
    expect(legacyMapSource).toContain("basemaps.cartocdn.com");
    expect(legacyMapSource).not.toContain("country-labels");
    expect(legacyMapSource).not.toContain("COUNTRY_LABELS");
  });

  it("keeps map NO2 column labels on scaled display units", () => {
    const source = readFileSync(join(process.cwd(), "src", "components", "TargetNpweiMap.tsx"), "utf-8");
    const overviewTableSource = readFileSync(join(process.cwd(), "src", "components", "OverviewRankingTable.tsx"), "utf-8");
    const rankingTableSource = readFileSync(join(process.cwd(), "src", "components", "RankingTable.tsx"), "utf-8");

    expect(source).toContain("NO2_COLUMN_UNIT_LABEL");
    expect(source).toContain("formatNo2ColumnHtml");
    expect(source).toContain("pweToColumn(value).toFixed(2)");
    expect(overviewTableSource).toContain("NO2_COLUMN_UNIT_LABEL");
    expect(overviewTableSource).not.toContain("x10^15 molecules cm^-2");
    expect(rankingTableSource).toContain("NO2_COLUMN_UNIT_LABEL");
    expect(rankingTableSource).toContain("no2-unit-column");
  });

  it("omits the selected-year summary row from the map explorer", () => {
    const mapExplorerSource = readFileSync(join(process.cwd(), "src", "components", "MapExplorer.tsx"), "utf-8");
    const globalStyles = readFileSync(join(process.cwd(), "src", "app", "globals.css"), "utf-8");

    expect(mapExplorerSource).toContain("<MapKpiStrip");
    expect(mapExplorerSource).toContain("<TargetNpweiMap");
    expect(mapExplorerSource).not.toContain("SelectedYearSummaryPanel");
    expect(mapExplorerSource).not.toContain("Selected Year Summary");
    expect(mapExplorerSource).not.toContain("buildSelectedYearSummary");
    expect(globalStyles).not.toContain("target-selected-year-summary");
  });

  it("derives target map tooltip location labels from current city rows", async () => {
    const source = readFileSync(join(process.cwd(), "src", "components", "TargetNpweiMap.tsx"), "utf-8");

    expect(source).toContain("function getTooltipHtml(properties: No2TileProperties, metadata: No2MapDisplayMetadata, rows: CityNpweiRow[])");
    expect(source).toContain("const locationLabel = getTooltipLocationLabel(properties, rows)");
    expect(source).toContain("export function getTooltipLocationLabel(properties: No2TileProperties, rows: CityNpweiRow[])");
    expect(source).toContain("if (city && country) return `${city}, ${country}`;");
    expect(source).toContain("const nearestRow = getNearestCityRow(properties, rows);");
    expect(source).toContain("return `${nearestRow.name}, ${nearestRow.country}`;");
    expect(source).toContain("getDistanceFromCityDegrees(lon, lat, row)");
    expect(source).not.toContain("Near ");
    expect(source.match(/West Africa grid cell/g)).toHaveLength(1);

    const { getTooltipLocationLabel } = await import("../src/components/TargetNpweiMap");
    const lagos = getCityRows("Annual").find((row) => row.name === "Lagos" && row.country === "Nigeria");
    if (!lagos) throw new Error("Expected Lagos city row in local data");

    expect(getTooltipLocationLabel({ city: "Lagos", country: "Nigeria" }, [])).toBe("Lagos, Nigeria");
    expect(getTooltipLocationLabel({ city: "Lagos" }, [])).toBe("Lagos");
    expect(getTooltipLocationLabel({ country: "Nigeria" }, [])).toBe("Nigeria");
    expect(getTooltipLocationLabel({ lat: lagos.lat + 0.02, lon: lagos.lon - 0.02 }, [lagos])).toBe("Lagos, Nigeria");
    expect(getTooltipLocationLabel({}, [lagos])).toBe("West Africa grid cell");
  });

  it("enables SDF font rendering for remaining outlined map text labels", () => {
    const files = ["ExposureMap.tsx"];

    files.forEach((file) => {
      const source = readFileSync(join(process.cwd(), "src", "components", file), "utf-8");
      const outlinedTextLayers = extractTextLayerProps(source).filter((props) => props.includes("outlineWidth"));

      expect(outlinedTextLayers.length).toBeGreaterThan(0);
      outlinedTextLayers.forEach((props) => {
        expect(props).toContain("fontSettings: { sdf: true }");
      });
    });
  });

  it("keeps overview production metrics on generated web_data selectors", () => {
    const dashboardSource = readFileSync(join(process.cwd(), "src", "components", "DashboardView.tsx"), "utf-8");
    const rankingSource = readFileSync(join(process.cwd(), "src", "components", "OverviewRankingTable.tsx"), "utf-8");
    const homeSource = readFileSync(join(process.cwd(), "src", "app", "page.tsx"), "utf-8");

    expect(dashboardSource).toContain("getOverviewSummaryMetrics");
    expect(dashboardSource).toContain("TargetNpweiMap");
    expect(rankingSource).toContain("getOverviewCountryRanking");
    expect(homeSource).toContain("getOverviewHotspots");
    expect(dashboardSource).not.toContain("@/data/sampleData");
    expect(rankingSource).not.toContain("@/data/sampleData");
    expect(homeSource).not.toContain("@/data/sampleData");
  });

  it("shows the homepage observation year range as 2020 - 2025 without changing population baseline copy", () => {
    const homeSource = readFileSync(join(process.cwd(), "src", "app", "page.tsx"), "utf-8");

    expect(homeSource).toContain('const HOMEPAGE_OBSERVATION_YEAR_RANGE = "2020 - 2025";');
    expect(homeSource).toContain('value: yearRange, label: "TROPOMI Observations"');
    expect(homeSource).toContain("{yearRange} exposure trend");
    expect(homeSource).toContain("NASA Gridded 2020 population raster");
    expect(homeSource).not.toContain('const HOMEPAGE_OBSERVATION_YEAR_RANGE = "2020-2025";');
  });

});

function cloneLocalSnapshot(): WebDataSnapshot {
  return structuredClone(getLocalWebDataSnapshot());
}

function restoreEnvValue(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
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
    displayLog10PixelExposure: { min: 18.6, max: 20.2, p02: 18.6, p98: 20.2 },
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
    displayRangesBySeasonYear: {
      Annual: {
        "2024": {
          log10PixelExposure: { min: 18.7, max: 20.2, p02: 18.7, p98: 20.2 }
        }
      },
      DJF: {
        "2024": {
          log10PixelExposure: { min: 18.6, max: 20.4, p02: 18.6, p98: 20.4 }
        }
      },
      JJA: {
        "2024": {
          log10PixelExposure: { min: 18.5, max: 20.1, p02: 18.5, p98: 20.1 }
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

function storageReturning(value: string | null) {
  return {
    getItem: vi.fn(() => value)
  };
}

function mediaMatching(matches: boolean) {
  return vi.fn(() => ({ matches }));
}

function extractTextLayerProps(source: string): string[] {
  const blocks: string[] = [];
  const marker = "new TextLayer";
  let markerIndex = source.indexOf(marker);

  while (markerIndex !== -1) {
    const openBraceIndex = source.indexOf("{", markerIndex);
    if (openBraceIndex === -1) break;

    let depth = 0;
    let blockEndIndex = -1;
    for (let index = openBraceIndex; index < source.length; index += 1) {
      const character = source[index];
      if (character === "{") depth += 1;
      if (character === "}") depth -= 1;
      if (depth === 0) {
        blockEndIndex = index;
        break;
      }
    }

    if (blockEndIndex === -1) break;
    blocks.push(source.slice(openBraceIndex, blockEndIndex + 1));
    markerIndex = source.indexOf(marker, blockEndIndex + 1);
  }

  return blocks;
}
