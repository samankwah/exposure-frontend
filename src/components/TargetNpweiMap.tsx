"use client";

import { useEffect, useMemo, useState } from "react";
import DeckGL from "@deck.gl/react";
import { GeoJsonLayer } from "@deck.gl/layers";
import { MVTLayer } from "@deck.gl/geo-layers";
import * as maplibregl from "maplibre-gl";
import MapLibreMap, { ScaleControl } from "react-map-gl/maplibre";
import { Minus, Plus } from "lucide-react";
import { MapPanelSkeleton } from "@/components/Skeletons";
import westAfricaBoundary from "@/data/westAfricaBoundary.json";
import {
  buildNo2TileUrlTemplate,
  getApiBaseUrl,
  getNo2MapSeasonYearRanges,
  loadNo2MapData,
  type No2MapGridFeatureCollection,
  type No2MapGridMetadata,
  type No2MapTileMetadata,
  type NumericRange
} from "@/data/webDataClient";
import { NO2_COLUMN_UNIT_LABEL, pweToColumn, type CityNpweiRow, type WebDataSeason } from "@/data/webData";

const MAP_STYLE = {
  version: 8,
  sources: {
    "carto-light": {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        "https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
      ],
      tileSize: 256,
      attribution: "&copy; CARTO"
    }
  },
  layers: [
    {
      id: "local-background",
      type: "background",
      paint: {
        "background-color": "#ffffff"
      }
    },
    {
      id: "carto-light",
      type: "raster",
      source: "carto-light",
      paint: {
        "raster-opacity": 0.94,
        "raster-saturation": -0.2
      }
    }
  ]
} as const;

const INITIAL_VIEW_STATE = {
  longitude: -1.35,
  latitude: 11.8,
  zoom: 3.88,
  minZoom: 2.7,
  maxZoom: 8.5,
  pitch: 0,
  bearing: 0
};

type MapViewState = typeof INITIAL_VIEW_STATE;
type TargetMapLayerMode = "no2" | "population";
type No2MapDisplayMetadata = No2MapTileMetadata | No2MapGridMetadata;
type MapDataState =
  | { status: "loading" }
  | { status: "ready"; source: "tile"; metadata: No2MapTileMetadata }
  | { status: "ready"; source: "grid"; metadata: No2MapGridMetadata; data: No2MapGridFeatureCollection }
  | { status: "error"; message: string };

type No2TileProperties = {
  city?: string;
  country?: string;
  density_people_per_km2?: number;
  lat?: number;
  lon?: number;
  log10_pixel_exposure?: number;
  no2_column_molec_cm2?: number;
  npwei?: number;
  pixel_exposure?: number;
  population_count?: number;
  season?: string;
  year?: number;
};

type DeckFeature = {
  properties?: No2TileProperties;
};

const AFFECTED_PWE_DENSITY_THRESHOLD = 50;
const FILTERED_GRID_MIN_RADIUS_DEGREES = 0.65;
const FILTERED_GRID_MAX_RADIUS_DEGREES = 1.35;

export function TargetNpweiMap({
  filterActive = false,
  rows,
  season,
  year,
  layerMode = "no2"
}: {
  filterActive?: boolean;
  rows: CityNpweiRow[];
  season: WebDataSeason;
  year: number;
  layerMode?: TargetMapLayerMode;
}) {
  const [isClient, setIsClient] = useState(false);
  const [mapDataState, setMapDataState] = useState<MapDataState>({ status: "loading" });
  const [viewState, setViewState] = useState<MapViewState>(INITIAL_VIEW_STATE);
  const apiBaseUrl = getApiBaseUrl();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    let canceled = false;
    setMapDataState({ status: "loading" });

    loadNo2MapData(fetch, apiBaseUrl, season, year)
      .then((mapData) => {
        if (!canceled) setMapDataState({ status: "ready", ...mapData });
      })
      .catch((error: unknown) => {
        if (!canceled) {
          const message = error instanceof Error ? error.message : "NO2 population grid is unavailable";
          setMapDataState({ status: "error", message });
        }
      });

    return () => {
      canceled = true;
    };
  }, [apiBaseUrl, season, year]);

  const visibleFeatureKeys = useMemo(() => new Set(rows.map((row) => featureKey(row.country, row.name))), [rows]);
  const maskedGridData = useMemo(() => {
    if (mapDataState.status !== "ready" || mapDataState.source !== "grid") return null;
    const includeFeature = layerMode === "population" ? isPopulationFeature : isAffectedPweFeature;

    return {
      ...mapDataState.data,
      features: mapDataState.data.features.filter((feature) => {
        const properties = feature.properties ?? {};
        return (
          isInsideWestAfricaBoundary(properties) &&
          includeFeature(properties) &&
          isVisibleFeature(properties, visibleFeatureKeys, rows, filterActive)
        );
      })
    };
  }, [filterActive, layerMode, mapDataState, rows, visibleFeatureKeys]);
  const clippedLog10ExposureRange = useMemo(() => {
    if (mapDataState.status !== "ready" || mapDataState.source !== "grid") return null;
    return getClippedNumericRange(
      mapDataState.data,
      "log10_pixel_exposure",
      0.02,
      0.98,
      (properties) =>
        isInsideWestAfricaBoundary(properties) &&
        isAffectedPweFeature(properties) &&
        isVisibleFeature(properties, visibleFeatureKeys, rows, filterActive)
    );
  }, [filterActive, mapDataState, rows, visibleFeatureKeys]);
  const clippedPopulationRange = useMemo(() => {
    if (mapDataState.status !== "ready" || mapDataState.source !== "grid") return null;
    return getClippedNumericRange(
      mapDataState.data,
      "population_count",
      0.02,
      0.98,
      (properties) =>
        isInsideWestAfricaBoundary(properties) &&
        isPopulationFeature(properties) &&
        isVisibleFeature(properties, visibleFeatureKeys, rows, filterActive)
    );
  }, [filterActive, mapDataState, rows, visibleFeatureKeys]);
  const updateViewState = (nextViewState: Partial<MapViewState>) => {
    setViewState({
      ...INITIAL_VIEW_STATE,
      ...nextViewState,
      minZoom: INITIAL_VIEW_STATE.minZoom,
      maxZoom: INITIAL_VIEW_STATE.maxZoom,
      pitch: 0,
      bearing: 0
    });
  };

  const zoomMap = (step: number) => {
    setViewState((current) => ({
      ...current,
      zoom: Math.min(INITIAL_VIEW_STATE.maxZoom, Math.max(INITIAL_VIEW_STATE.minZoom, current.zoom + step))
    }));
  };

  if (!isClient || mapDataState.status === "loading") return <MapPanelSkeleton />;
  if (mapDataState.status === "error") return <UnavailableMapPanel message={mapDataState.message} />;

  const { metadata } = mapDataState;
  const seasonYearRanges = getNo2MapSeasonYearRanges(metadata, season, year);
  const log10ExposureColorRange = clippedLog10ExposureRange ?? seasonYearRanges?.log10PixelExposure ?? metadata.log10PixelExposure;
  const populationColorRange = clippedPopulationRange ?? seasonYearRanges?.populationCount ?? metadata.populationCount;
  if (!metadata.availableSeasons.includes(season)) {
    return <UnavailableMapPanel message={`Backend NO2 population grid is unavailable for ${season}.`} />;
  }
  if (!metadata.availableYears.includes(year)) {
    return <UnavailableMapPanel message={`Backend NO2 population grid is unavailable for ${year}.`} />;
  }

  const no2Layer =
    mapDataState.source === "tile"
      ? new MVTLayer({
          id: `no2-pixel-tiles-${season}-${year}-${layerMode}`,
          data: buildNo2TileUrlTemplate(mapDataState.metadata, season, year, apiBaseUrl),
          minZoom: mapDataState.metadata.minzoom,
          maxZoom: mapDataState.metadata.maxzoom,
          pickable: true,
          filled: true,
          stroked: false,
          opacity: layerMode === "population" ? 0.76 : 0.94,
          getFillColor: (feature: DeckFeature) =>
            getFeatureFillColor(
              feature.properties ?? {},
              layerMode,
              visibleFeatureKeys,
              rows,
              filterActive,
              log10ExposureColorRange,
              populationColorRange
            ),
          updateTriggers: {
            getFillColor: [
              season,
              year,
              layerMode,
              metadata.generatedAt,
              filterActive,
              rows,
              log10ExposureColorRange.min,
              log10ExposureColorRange.max,
              populationColorRange.min,
              populationColorRange.max
            ]
          }
        })
      : new GeoJsonLayer({
          id: `no2-population-grid-${season}-${year}-${layerMode}`,
          data: (maskedGridData ?? mapDataState.data) as any,
          pickable: true,
          filled: true,
          stroked: false,
          opacity: layerMode === "population" ? 0.72 : 0.96,
          getFillColor: (feature: DeckFeature) =>
            getFeatureFillColor(
              feature.properties ?? {},
              layerMode,
              visibleFeatureKeys,
              rows,
              filterActive,
              log10ExposureColorRange,
              populationColorRange
            ),
          updateTriggers: {
            getFillColor: [
              season,
              year,
              layerMode,
              metadata.generatedAt,
              filterActive,
              rows,
              log10ExposureColorRange.min,
              log10ExposureColorRange.max,
              populationColorRange.min,
              populationColorRange.max
            ]
          }
        });
  const layers = [
    no2Layer,
    new GeoJsonLayer({
      id: "west-africa-boundary-halo",
      data: westAfricaBoundary as any,
      pickable: false,
      stroked: true,
      filled: false,
      lineWidthUnits: "pixels",
      lineWidthMinPixels: 2,
      getLineColor: [255, 255, 255, 180]
    }),
    new GeoJsonLayer({
      id: "west-africa-boundary-outline",
      data: westAfricaBoundary as any,
      pickable: false,
      stroked: true,
      filled: false,
      lineWidthUnits: "pixels",
      lineWidthMinPixels: 1.15,
      getLineColor: [0, 0, 0, 225]
    })
  ];

  return (
    <div className="map-panel target-npwei-map-panel">
      <DeckGL
        controller
        getCursor={({ isDragging, isHovering }) => (isDragging ? "grabbing" : isHovering ? "pointer" : "grab")}
        getTooltip={({ object }) => {
          const properties = (object as DeckFeature | null)?.properties;
          if (!properties || !isVisibleFeature(properties, visibleFeatureKeys, rows, filterActive)) return null;
          if (!isInsideWestAfricaBoundary(properties)) return null;
          if (layerMode === "no2" && !isAffectedPweFeature(properties)) return null;
          if (layerMode === "population" && !isPopulationFeature(properties)) return null;
          return {
            html: getTooltipHtml(properties, metadata, rows),
            className: "target-map-tooltip"
          };
        }}
        layers={layers}
        onViewStateChange={({ viewState: nextViewState }) => {
          updateViewState(nextViewState as Partial<MapViewState>);
        }}
        viewState={viewState}
      >
        <MapLibreMap mapLib={maplibregl as any} mapStyle={MAP_STYLE as any} reuseMaps>
          <ScaleControl position="bottom-left" />
        </MapLibreMap>
      </DeckGL>
      <div className="map-zoom-controls" aria-label="Map zoom controls">
        <button type="button" aria-label="Zoom in" onClick={() => zoomMap(0.5)}>
          <Plus size={17} aria-hidden />
        </button>
        <button type="button" aria-label="Zoom out" onClick={() => zoomMap(-0.5)}>
          <Minus size={17} aria-hidden />
        </button>
      </div>
      <No2MapLegend
        layerMode={layerMode}
        log10ExposureRange={log10ExposureColorRange}
        populationRange={populationColorRange}
      />
    </div>
  );
}

function UnavailableMapPanel({ message }: { message: string }) {
  return (
    <div className="map-panel target-npwei-map-panel target-map-unavailable">
      <strong>NO2 population grid unavailable</strong>
      <span>{message}</span>
    </div>
  );
}

function No2MapLegend({
  layerMode,
  log10ExposureRange,
  populationRange
}: {
  layerMode: TargetMapLayerMode;
  log10ExposureRange: NumericRange;
  populationRange: NumericRange;
}) {
  const range = layerMode === "population" ? populationRange : log10ExposureRange;
  const title = layerMode === "population" ? "Population count" : "PWE = NO2 x Population, Log Scale";
  const middle = range.min + (range.max - range.min) / 2;

  return (
    <div className={layerMode === "population" ? "target-map-legend population" : "target-map-legend"} aria-hidden>
      <strong>{title}</strong>
      <i />
      <div className="target-map-legend-labels">
        <span className="target-map-legend-end target-map-legend-low">Low</span>
        <span className="target-map-legend-end target-map-legend-high">High</span>
        <span className="target-map-legend-value target-map-legend-min">{formatLegendValue(range.min, layerMode)}</span>
        <span className="target-map-legend-value target-map-legend-mid">{formatLegendValue(middle, layerMode)}</span>
        <span className="target-map-legend-value target-map-legend-max">{formatLegendValue(range.max, layerMode)}</span>
      </div>
    </div>
  );
}

function isVisibleFeature(
  properties: Partial<No2TileProperties> | Record<string, unknown>,
  visibleFeatureKeys: Set<string>,
  rows: CityNpweiRow[],
  filterActive: boolean
) {
  if (!filterActive) return true;
  if (rows.length === 0) return false;

  const country = typeof properties.country === "string" ? properties.country : "";
  const city = typeof properties.city === "string" ? properties.city : "";
  if (country && city) return visibleFeatureKeys.has(featureKey(country, city));
  if (country) return rows.some((row) => countryKey(row.country) === countryKey(country));

  return isGridFeatureNearRows(properties, rows);
}

function featureKey(country: string, city: string) {
  return `${country.trim().toLowerCase()}::${city.trim().toLowerCase()}`;
}

function countryKey(country: string) {
  return country.trim().toLowerCase();
}

function isGridFeatureNearRows(properties: Partial<No2TileProperties> | Record<string, unknown>, rows: CityNpweiRow[]) {
  const lon = Number(properties.lon);
  const lat = Number(properties.lat);
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return false;

  return rows.some((row) => getDistanceFromCityDegrees(lon, lat, row) <= getFilteredGridRadius(row));
}

function getDistanceFromCityDegrees(lon: number, lat: number, row: CityNpweiRow) {
  const latitudeScale = Math.max(0.25, Math.cos((((lat + row.lat) / 2) * Math.PI) / 180));
  const dx = (lon - row.lon) * latitudeScale;
  const dy = lat - row.lat;
  return Math.sqrt(dx * dx + dy * dy);
}

function getFilteredGridRadius(row: CityNpweiRow) {
  const scaledRadius = 0.58 + Math.sqrt(Math.max(0.1, row.urbanPop)) * 0.14;
  return Math.min(FILTERED_GRID_MAX_RADIUS_DEGREES, Math.max(FILTERED_GRID_MIN_RADIUS_DEGREES, scaledRadius));
}

function getFeatureFillColor(
  properties: No2TileProperties,
  layerMode: TargetMapLayerMode,
  visibleFeatureKeys: Set<string>,
  rows: CityNpweiRow[],
  filterActive: boolean,
  log10ExposureRange: NumericRange,
  populationRange: NumericRange
) {
  if (!isInsideWestAfricaBoundary(properties)) return [0, 0, 0, 0] as [number, number, number, number];
  if (!isVisibleFeature(properties, visibleFeatureKeys, rows, filterActive)) return [0, 0, 0, 0] as [number, number, number, number];
  if (layerMode === "population") {
    if (!isPopulationFeature(properties)) return [0, 0, 0, 0] as [number, number, number, number];
    return getPopulationColor(Number(properties.population_count ?? 0), populationRange, 218);
  }
  if (!isAffectedPweFeature(properties)) return [0, 0, 0, 0] as [number, number, number, number];
  return getLogExposureColor(Number(properties.log10_pixel_exposure ?? 0), log10ExposureRange, 226);
}

function isAffectedPweFeature(properties: Partial<No2TileProperties> | Record<string, unknown>) {
  const density = Number(properties.density_people_per_km2 ?? 0);
  const logExposure = Number(properties.log10_pixel_exposure ?? 0);
  const population = Number(properties.population_count ?? 0);

  return (
    Number.isFinite(density) &&
    Number.isFinite(logExposure) &&
    Number.isFinite(population) &&
    density >= AFFECTED_PWE_DENSITY_THRESHOLD &&
    logExposure > 0 &&
    population > 0
  );
}

function isPopulationFeature(properties: Partial<No2TileProperties> | Record<string, unknown>) {
  const density = Number(properties.density_people_per_km2 ?? 0);
  const population = Number(properties.population_count ?? 0);

  return (
    Number.isFinite(density) &&
    Number.isFinite(population) &&
    density >= AFFECTED_PWE_DENSITY_THRESHOLD &&
    population > 0
  );
}

function isInsideWestAfricaBoundary(properties: Partial<No2TileProperties> | Record<string, unknown>) {
  const lon = Number(properties.lon);
  const lat = Number(properties.lat);
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return false;

  return pointInGeoJsonFeatureCollection([lon, lat], westAfricaBoundary as any);
}

function pointInGeoJsonFeatureCollection(point: [number, number], collection: any) {
  return Boolean(
    collection.features?.some((feature: any) => {
      const geometry = feature.geometry;
      if (!geometry) return false;

      if (geometry.type === "Polygon") {
        return pointInPolygonWithHoles(point, geometry.coordinates);
      }

      if (geometry.type === "MultiPolygon") {
        return geometry.coordinates.some((polygon: [number, number][][]) => pointInPolygonWithHoles(point, polygon));
      }

      return false;
    })
  );
}

function pointInPolygonWithHoles(point: [number, number], polygon: [number, number][][]) {
  if (!polygon[0] || !pointInPolygon(point, polygon[0])) return false;
  return !polygon.slice(1).some((hole) => pointInPolygon(point, hole));
}

function pointInPolygon(point: [number, number], polygon: [number, number][]) {
  const [longitude, latitude] = point;
  let inside = false;

  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
    const [currentLongitude, currentLatitude] = polygon[index];
    const [previousLongitude, previousLatitude] = polygon[previous];
    const intersects =
      currentLatitude > latitude !== previousLatitude > latitude &&
      longitude <
        ((previousLongitude - currentLongitude) * (latitude - currentLatitude)) /
          (previousLatitude - currentLatitude) +
          currentLongitude;

    if (intersects) inside = !inside;
  }

  return inside;
}

function getTooltipHtml(properties: No2TileProperties, metadata: No2MapDisplayMetadata, rows: CityNpweiRow[]) {
  const season = properties.season ?? "Unknown season";
  const year = properties.year ?? "Unknown year";
  const locationLabel = getTooltipLocationLabel(properties, rows);
  const contextLabel = `${season} ${year}`;

  return [
    `<div class="target-map-tooltip-header">`,
    `<strong>${escapeHtml(locationLabel)}</strong>`,
    `<span>${escapeHtml(contextLabel)}</span>`,
    `</div>`,
    `<div class="target-map-tooltip-metrics">`,
    renderTooltipRow("NO₂ column", formatNo2ColumnHtml(Number(properties.no2_column_molec_cm2 ?? 0))),
    renderTooltipRow("Population", escapeHtml(formatWholeNumber(Number(properties.population_count ?? 0)))),
    renderTooltipRow("Pixel exposure", formatScientificHtml(Number(properties.pixel_exposure ?? 0), metadata.units.pixelExposure)),
    renderTooltipRow("Log exposure", escapeHtml(formatNumber(Number(properties.log10_pixel_exposure ?? 0), 2))),
    `</div>`,
    `<div class="target-map-tooltip-footer">PWE = NO₂ &times; population</div>`
  ].join("");
}

export function getTooltipLocationLabel(properties: No2TileProperties, rows: CityNpweiRow[]) {
  const city = properties.city?.trim();
  const country = properties.country?.trim();
  if (city && country) return `${city}, ${country}`;
  if (city) return city;
  if (country) return country;

  const nearestRow = getNearestCityRow(properties, rows);
  if (nearestRow) return `${nearestRow.name}, ${nearestRow.country}`;

  return "West Africa grid cell";
}

function getNearestCityRow(properties: No2TileProperties, rows: CityNpweiRow[]): CityNpweiRow | null {
  const lon = Number(properties.lon);
  const lat = Number(properties.lat);
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;

  let nearestRow: CityNpweiRow | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const row of rows) {
    const distance = getDistanceFromCityDegrees(lon, lat, row);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestRow = row;
    }
  }

  return nearestRow;
}

function renderTooltipRow(label: string, valueHtml: string) {
  return [
    `<div class="target-map-tooltip-row">`,
    `<span class="target-map-tooltip-label">${escapeHtml(label)}</span>`,
    `<span class="target-map-tooltip-value">${valueHtml}</span>`,
    `</div>`
  ].join("");
}

function getLogExposureColor(value: number, range: NumericRange, alpha: number): [number, number, number, number] {
  const stops: Array<[number, [number, number, number]]> = [
    [0, [5, 5, 8]],
    [0.16, [45, 0, 84]],
    [0.34, [96, 21, 126]],
    [0.52, [167, 47, 122]],
    [0.7, [226, 80, 84]],
    [0.86, [250, 151, 42]],
    [1, [252, 231, 37]]
  ];
  return interpolateStops(normalizeToUnit(value, range), stops, alpha);
}

function getPopulationColor(value: number, range: NumericRange, alpha: number): [number, number, number, number] {
  const stops: Array<[number, [number, number, number]]> = [
    [0, [224, 247, 250]],
    [0.18, [139, 213, 210]],
    [0.38, [48, 174, 183]],
    [0.62, [22, 116, 166]],
    [0.82, [30, 70, 148]],
    [1, [40, 31, 132]]
  ];
  return interpolateStops(normalizeToUnit(value, range), stops, alpha);
}

function interpolateStops(
  value: number,
  stops: Array<[number, [number, number, number]]>,
  alpha: number
): [number, number, number, number] {
  const clamped = Math.min(1, Math.max(0, value));
  for (let index = 0; index < stops.length - 1; index += 1) {
    const [fromValue, fromColor] = stops[index];
    const [toValue, toColor] = stops[index + 1];
    if (clamped >= fromValue && clamped <= toValue) {
      const ratio = (clamped - fromValue) / Math.max(0.000001, toValue - fromValue);
      return [
        Math.round(fromColor[0] + (toColor[0] - fromColor[0]) * ratio),
        Math.round(fromColor[1] + (toColor[1] - fromColor[1]) * ratio),
        Math.round(fromColor[2] + (toColor[2] - fromColor[2]) * ratio),
        alpha
      ];
    }
  }

  const lastColor = stops[stops.length - 1][1];
  return [lastColor[0], lastColor[1], lastColor[2], alpha];
}

function normalizeToUnit(value: number, range: NumericRange) {
  const span = range.max - range.min;
  if (!Number.isFinite(value) || span <= 0) return 0;
  return (value - range.min) / span;
}

function getClippedNumericRange(
  data: No2MapGridFeatureCollection,
  propertyName: keyof No2TileProperties,
  lowerPercentile: number,
  upperPercentile: number,
  includeFeature: (properties: Record<string, unknown>) => boolean = () => true
): NumericRange | null {
  const values = data.features
    .map((feature) => {
      if (!includeFeature(feature.properties ?? {})) return null;
      const value = feature.properties?.[propertyName];
      return typeof value === "number" && Number.isFinite(value) ? value : null;
    })
    .filter((value): value is number => value !== null)
    .sort((a, b) => a - b);

  if (values.length < 2) return null;

  const min = getQuantile(values, lowerPercentile);
  const max = getQuantile(values, upperPercentile);
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return null;

  return { min, max };
}

function getQuantile(sortedValues: number[], percentile: number) {
  const clampedPercentile = Math.min(1, Math.max(0, percentile));
  const position = (sortedValues.length - 1) * clampedPercentile;
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.ceil(position);
  const lowerValue = sortedValues[lowerIndex] ?? sortedValues[0];
  const upperValue = sortedValues[upperIndex] ?? sortedValues[sortedValues.length - 1];
  const ratio = position - lowerIndex;

  return lowerValue + (upperValue - lowerValue) * ratio;
}

function formatLegendValue(value: number, layerMode: TargetMapLayerMode) {
  if (layerMode === "population") return formatCompactNumber(value);
  return formatNumber(value, 1);
}

function formatScientificHtml(value: number, units: string) {
  const displayUnits = formatDisplayUnitsHtml(units);
  if (!Number.isFinite(value) || value <= 0) return `No data ${displayUnits}`;
  const [mantissa, exponent] = value.toExponential(2).split("e");
  return `${mantissa} <span class="target-map-tooltip-times">&times;</span> 10<sup>${Number(
    exponent
  )}</sup> <span class="target-map-tooltip-unit">${displayUnits}</span>`;
}

function formatDisplayUnitsHtml(units: string) {
  return escapeHtml(units).replaceAll("cm-2", "cm<sup>-2</sup>").replaceAll("cm^-2", "cm<sup>-2</sup>");
}

function formatNo2ColumnHtml(value: number) {
  const displayUnits = `<span class="target-map-tooltip-unit">${formatDisplayUnitsHtml(NO2_COLUMN_UNIT_LABEL)}</span>`;
  if (!Number.isFinite(value) || value <= 0) return `No data ${displayUnits}`;
  return `${escapeHtml(pweToColumn(value).toFixed(2))} ${displayUnits}`;
}

function formatWholeNumber(value: number) {
  if (!Number.isFinite(value)) return "No data";
  return Math.round(value).toLocaleString();
}

function formatCompactNumber(value: number) {
  if (!Number.isFinite(value)) return "No data";
  return Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function formatNumber(value: number, digits: number) {
  if (!Number.isFinite(value)) return "No data";
  return value.toFixed(digits);
}

function escapeHtml(value: string | number) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
