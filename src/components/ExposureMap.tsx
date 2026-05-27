"use client";

import { useEffect, useMemo, useState } from "react";
import DeckGL from "@deck.gl/react";
import {
  BitmapLayer,
  GeoJsonLayer,
  ScatterplotLayer,
  TextLayer,
} from "@deck.gl/layers";
import MapLibreMap, { ScaleControl } from "react-map-gl/maplibre";
import { Layers, Minus, Plus } from "lucide-react";
import { MapPanelSkeleton } from "@/components/Skeletons";
import type {
  City,
  Filters,
  FireActivityPoint,
  Hotspot,
  LayerKey,
} from "@/types/exposure";
import africaContourMap from "@/data/africaContourMap.json";
import abnMapBoundary from "@/data/abnMapBoundary.json";
import {
  CITIES,
  INTERPOLATION_CELL_DEGREES,
  NO2_COLUMN_UNIT_LABEL,
  getCitiesForCountry,
  getFireActivityPoints,
  getHotspots,
  getInterpolatedNo2Cells,
  toNo2ColumnValue,
} from "@/data/sampleData";

const MAP_STYLE = {
  version: 8,
  sources: {
    "carto-light": {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        "https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "&copy; CARTO",
    },
  },
  layers: [
    {
      id: "carto-light",
      type: "raster",
      source: "carto-light",
      paint: {
        "raster-opacity": 0.92,
        "raster-saturation": -0.2,
      },
    },
  ],
} as const;

const INITIAL_VIEW_STATE = {
  longitude: 6.5,
  latitude: 13.35,
  zoom: 4.02,
  minZoom: 2.5,
  maxZoom: 9,
  pitch: 0,
  bearing: 0,
};

const OVERVIEW_NO2_VIEW_STATE = {
  ...INITIAL_VIEW_STATE,
  longitude: -1.35,
  latitude: 11.8,
  zoom: 3.88,
};

const FIRE_ACTIVITY_VIEW_STATE = {
  ...INITIAL_VIEW_STATE,
  longitude: -1.4,
  latitude: 9.6,
  zoom: 3.25,
};

type MapViewState = typeof INITIAL_VIEW_STATE;

function normalizeMapViewState(viewState: Partial<MapViewState>): MapViewState {
  return {
    ...INITIAL_VIEW_STATE,
    ...viewState,
    minZoom: INITIAL_VIEW_STATE.minZoom,
    maxZoom: INITIAL_VIEW_STATE.maxZoom,
    pitch: viewState.pitch ?? 0,
    bearing: viewState.bearing ?? 0,
  };
}

const OVERVIEW_CITY_LABELS = new Set([
  "dakar",
  "bamako",
  "kano",
  "lagos",
  "abidjan",
  "accra",
  "conakry",
]);
type No2Surface =
  | ReturnType<typeof getInterpolatedNo2Cells>
  | { type: "FeatureCollection"; features: [] };
type No2Raster = {
  bounds: [number, number, number, number];
  canvas: HTMLCanvasElement | null;
  key: string;
};

const EMPTY_NO2_SURFACE: No2Surface = {
  type: "FeatureCollection",
  features: [],
};
const EMPTY_NO2_RASTER: No2Raster = {
  bounds: [-18.2, 3.4, 16.8, 25.3],
  canvas: null,
  key: "empty",
};
const NO2_SURFACE_CACHE = new Map<
  string,
  ReturnType<typeof getInterpolatedNo2Cells>
>();
const NO2_RASTER_CACHE = new Map<string, No2Raster>();
const MAX_NO2_CACHE_ENTRIES = 12;

type MapRegionLabel = {
  id: string;
  name: string;
  coordinates: [number, number];
};

const COUNTRY_LABELS: MapRegionLabel[] = [
  { id: "mauritania", name: "Mauritania", coordinates: [-10.5, 20.5] },
  { id: "mali", name: "Mali", coordinates: [-3.8, 20.4] },
  { id: "niger", name: "Niger", coordinates: [8.7, 18.4] },
  { id: "chad", name: "Chad", coordinates: [15.0, 15.0] },
  { id: "senegal", name: "Senegal", coordinates: [-14.4, 14.5] },
  { id: "gambia", name: "The Gambia", coordinates: [-15.45, 13.45] },
  { id: "guinea-bissau", name: "Guinea-Bissau", coordinates: [-14.65, 11.75] },
  { id: "guinea", name: "Guinea", coordinates: [-10.55, 10.35] },
  { id: "sierra-leone", name: "Sierra Leone", coordinates: [-11.75, 8.45] },
  { id: "liberia", name: "Liberia", coordinates: [-9.45, 6.45] },
  { id: "cote-divoire", name: "Cote d'Ivoire", coordinates: [-5.35, 7.55] },
  { id: "ghana", name: "Ghana", coordinates: [-1.05, 7.9] },
  { id: "togo", name: "Togo", coordinates: [0.9, 8.55] },
  { id: "benin", name: "Benin", coordinates: [2.4, 9.4] },
  { id: "burkina-faso", name: "Burkina Faso", coordinates: [-1.55, 12.55] },
  { id: "nigeria", name: "Nigeria", coordinates: [8.0, 9.35] },
];

export type ExposureMapProps = {
  filters: Filters;
  activeLayers: Record<LayerKey, boolean>;
  selectedCountryId: string;
  onSelectCountry: (countryId: string) => void;
  compact?: boolean;
  legend?: "layers" | "column" | "none";
  controls?: boolean;
  showLabels?: boolean;
};

export function ExposureMap({
  filters,
  activeLayers,
  compact = false,
  legend = "layers",
  controls = true,
  showLabels = true,
}: ExposureMapProps) {
  const [isClient, setIsClient] = useState(false);
  const [no2Data, setNo2Data] = useState<{
    surface: No2Surface;
    raster: No2Raster;
  }>({
    surface: EMPTY_NO2_SURFACE,
    raster: EMPTY_NO2_RASTER,
  });
  const hotspots = getHotspots(filters);
  const firePoints = getFireActivityPoints(filters);
  const no2CellSize = compact
    ? INTERPOLATION_CELL_DEGREES * 1.45
    : INTERPOLATION_CELL_DEGREES;
  const no2CacheKey = useMemo(
    () => getNo2CacheKey(filters, no2CellSize),
    [filters, no2CellSize],
  );
  const no2Surface = no2Data.surface;
  const no2Raster = no2Data.raster;
  const cities =
    filters.countryId === "all"
      ? CITIES
      : getCitiesForCountry(filters.countryId);
  const labelCities = compact
    ? cities.filter((city) => OVERVIEW_CITY_LABELS.has(city.id))
    : cities;
  const countryLabels = filters.countryId === "all" ? COUNTRY_LABELS : [];
  const initialViewState =
    compact && activeLayers.no2
      ? OVERVIEW_NO2_VIEW_STATE
      : compact && activeLayers.fire && !activeLayers.no2
        ? FIRE_ACTIVITY_VIEW_STATE
        : INITIAL_VIEW_STATE;
  const [viewState, setViewState] = useState<MapViewState>(() =>
    normalizeMapViewState(initialViewState),
  );

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    setViewState(normalizeMapViewState(initialViewState));
  }, [initialViewState]);

  useEffect(() => {
    if (!isClient || !activeLayers.no2) {
      setNo2Data((current) =>
        current.surface === EMPTY_NO2_SURFACE
          ? current
          : { surface: EMPTY_NO2_SURFACE, raster: EMPTY_NO2_RASTER },
      );
      return;
    }

    const cachedSurface = NO2_SURFACE_CACHE.get(no2CacheKey);
    const cachedRaster = NO2_RASTER_CACHE.get(no2CacheKey);

    if (cachedSurface && cachedRaster) {
      setNo2Data({ surface: cachedSurface, raster: cachedRaster });
      return;
    }

    let cancelled = false;
    const computeNo2Layer = () => {
      const surface =
        cachedSurface ?? getCachedNo2Surface(no2CacheKey, filters, no2CellSize);
      const raster = getCachedNo2Raster(no2CacheKey, surface, no2CellSize);

      if (!cancelled) {
        setNo2Data({ surface, raster });
      }
    };

    const idleWindow = window as Window & {
      requestIdleCallback?: (
        callback: IdleRequestCallback,
        options?: IdleRequestOptions,
      ) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    const idleHandle = idleWindow.requestIdleCallback
      ? idleWindow.requestIdleCallback(computeNo2Layer, { timeout: 450 })
      : window.setTimeout(computeNo2Layer, 32);

    return () => {
      cancelled = true;
      if (idleWindow.cancelIdleCallback && typeof idleHandle === "number") {
        idleWindow.cancelIdleCallback(idleHandle);
      } else {
        window.clearTimeout(idleHandle);
      }
    };
  }, [isClient, activeLayers.no2, no2CacheKey, no2CellSize, filters]);

  if (!isClient) {
    return <MapPanelSkeleton compact={compact} />;
  }

  const zoomMap = (step: number) => {
    setViewState((current) => ({
      ...current,
      zoom: Math.min(
        INITIAL_VIEW_STATE.maxZoom,
        Math.max(INITIAL_VIEW_STATE.minZoom, current.zoom + step),
      ),
    }));
  };

  const layers = [
    new GeoJsonLayer({
      id: "africa-contour-fill",
      data: africaContourMap as any,
      pickable: false,
      stroked: false,
      filled: true,
      getFillColor: [230, 239, 233, compact ? 18 : 24],
    }),
    activeLayers.no2 && no2Raster.canvas
      ? new BitmapLayer({
          id: "no2-interpolated-raster",
          bounds: no2Raster.bounds,
          image: no2Raster.canvas,
          opacity: compact ? 0.68 : 0.72,
          desaturate: 0,
        })
      : null,
    activeLayers.no2
      ? new GeoJsonLayer({
          id: "no2-interpolated-picking-grid",
          data: no2Surface as any,
          pickable: true,
          stroked: false,
          filled: true,
          opacity: 0,
          getFillColor: [0, 0, 0, 0],
          updateTriggers: {
            getFillColor: [
              filters.regionId,
              filters.countryId,
              filters.year,
              filters.month,
              filters.season,
            ],
          },
        })
      : null,
    activeLayers.no2
      ? new GeoJsonLayer({
          id: "country-boundary-halo",
          data: abnMapBoundary as any,
          pickable: false,
          stroked: true,
          filled: false,
          lineWidthUnits: "pixels",
          lineWidthMinPixels: compact ? 4 : 5,
          getLineColor: [255, 255, 255, compact ? 210 : 230],
        })
      : null,
    activeLayers.no2
      ? new GeoJsonLayer({
          id: "country-boundaries-overlay",
          data: abnMapBoundary as any,
          pickable: false,
          stroked: true,
          filled: false,
          lineWidthUnits: "pixels",
          lineWidthMinPixels: compact ? 2 : 2.6,
          getLineColor: [15, 45, 58, 245],
        })
      : null,
    new GeoJsonLayer({
      id: "africa-contour-halo",
      data: africaContourMap as any,
      pickable: false,
      stroked: true,
      filled: false,
      lineWidthUnits: "pixels",
      lineWidthMinPixels: compact ? 3 : 4,
      getLineColor: [255, 255, 255, compact ? 200 : 220],
    }),
    new GeoJsonLayer({
      id: "africa-contour-outline",
      data: africaContourMap as any,
      pickable: false,
      stroked: true,
      filled: false,
      lineWidthUnits: "pixels",
      lineWidthMinPixels: compact ? 1.4 : 1.8,
      getLineColor: [37, 68, 76, compact ? 220 : 235],
    }),
    activeLayers.fire
      ? new ScatterplotLayer<FireActivityPoint>({
          id: "fire-hotspots",
          data: firePoints,
          pickable: true,
          opacity: compact ? 0.82 : 0.86,
          stroked: !compact,
          lineWidthMinPixels: compact ? 0 : 1,
          radiusUnits: compact ? "pixels" : "meters",
          radiusMinPixels: compact ? 1 : 4,
          radiusMaxPixels: compact ? 4.6 : 24,
          getPosition: (point) => point.coordinates,
          getRadius: (point) =>
            compact
              ? Math.max(1.2, Math.min(4.6, point.frp / 42))
              : point.frp * 4700,
          getLineColor: [255, 236, 130, 230],
          getFillColor: (point) => getFireColor(point.frp, compact ? 205 : 196),
        })
      : null,
    activeLayers.population
      ? new ScatterplotLayer<Hotspot>({
          id: "population-exposure",
          data: hotspots,
          pickable: true,
          opacity: 0.58,
          stroked: true,
          lineWidthMinPixels: 1,
          radiusUnits: "meters",
          radiusMinPixels: 9,
          radiusMaxPixels: 44,
          getPosition: (hotspot) => hotspot.coordinates,
          getRadius: (hotspot) =>
            Math.max(50000, hotspot.populationExposure * 1150),
          getLineColor: [194, 255, 117, 190],
          getFillColor: [94, 233, 181, 95],
        })
      : null,
    showLabels && countryLabels.length > 0
      ? new TextLayer<MapRegionLabel>({
          id: "country-labels",
          data: countryLabels,
          getPosition: (label) => label.coordinates,
          getText: (label) => label.name,
          getSize: compact ? 13 : 12,
          getColor: [10, 30, 42, 235],
          getTextAnchor: "middle",
          getAlignmentBaseline: "center",
          outlineWidth: compact ? 2.4 : 2,
          outlineColor: [255, 255, 255, 210],
          fontWeight: 700,
          pickable: false,
        })
      : null,
    showLabels
      ? new ScatterplotLayer<City>({
          id: "city-markers",
          data: labelCities,
          pickable: false,
          radiusUnits: "pixels",
          radiusMinPixels: compact ? 3 : 2.8,
          radiusMaxPixels: compact ? 3 : 2.8,
          stroked: true,
          lineWidthMinPixels: 1,
          getPosition: (city) => city.coordinates,
          getRadius: 3,
          getFillColor: [255, 255, 255, 245],
          getLineColor: [19, 35, 45, 245],
        })
      : null,
    showLabels
      ? new TextLayer<City>({
          id: "city-labels",
          data: labelCities,
          getPosition: (city) => city.coordinates,
          getText: (city) => city.name,
          getSize: compact ? 11.5 : 11,
          getColor: [12, 32, 44, 245],
          getTextAnchor: "middle",
          getAlignmentBaseline: "bottom",
          getPixelOffset: [0, -7],
          outlineWidth: 2,
          outlineColor: [255, 255, 255, 220],
          fontWeight: 500,
          pickable: false,
        })
      : null,
  ].filter(Boolean);

  return (
    <div className={compact ? "map-panel compact" : "map-panel"}>
      <DeckGL
        controller
        getCursor={({ isDragging, isHovering }) =>
          isDragging ? "grabbing" : isHovering ? "pointer" : "grab"
        }
        getTooltip={({ object }) => {
          if (!object) return null;
          if ((object as FireActivityPoint).frp) {
            const point = object as FireActivityPoint;
            return {
              text: `${point.label}\nFRP ${point.frp} MW\nMonth ${point.month}`,
            };
          }
          if ((object as any).properties?.column) {
            const feature = object as any;
            return {
              text: `${feature.properties.countryName}\nInterpolated NO2 ${Number(feature.properties.column).toFixed(2)} ${NO2_COLUMN_UNIT_LABEL}\nResolution ${feature.properties.resolutionKm} km`,
            };
          }
          if ((object as Hotspot).coordinates) {
            const hotspot = object as Hotspot;
            return {
              text: `${hotspot.label}\nNO₂ ${toNo2ColumnValue(hotspot.no2, "hotspot")} ${NO2_COLUMN_UNIT_LABEL}\nFire intensity ${hotspot.fireIntensity}\nPopulation exposure ${hotspot.populationExposure}`,
            };
          }
          const feature = object as any;
          return {
            text: `${feature.properties.name}\nNO₂ ${toNo2ColumnValue(feature.properties.no2, "country")} ${NO2_COLUMN_UNIT_LABEL}\nExposure ${Number(feature.properties.exposure).toLocaleString()}`,
          };
        }}
        onViewStateChange={({ viewState: nextViewState }) => {
          setViewState(normalizeMapViewState(nextViewState as Partial<MapViewState>));
        }}
        viewState={viewState}
        layers={layers}
      >
        <MapLibreMap mapStyle={MAP_STYLE as any} reuseMaps>
          {controls ? (
            <ScaleControl
              position={legend === "column" ? "bottom-right" : "bottom-left"}
            />
          ) : null}
        </MapLibreMap>
      </DeckGL>
      {controls ? (
        <div className="map-zoom-controls" aria-label="Map zoom controls">
          <button type="button" aria-label="Zoom in" onClick={() => zoomMap(0.5)}>
            <Plus size={17} aria-hidden />
          </button>
          <button type="button" aria-label="Zoom out" onClick={() => zoomMap(-0.5)}>
            <Minus size={17} aria-hidden />
          </button>
        </div>
      ) : null}
      {legend === "column" ? (
        <>
          <button
            className="map-layer-button"
            type="button"
            aria-label="Layers"
          >
            <Layers size={18} aria-hidden />
          </button>
          <div className="column-map-legend" aria-hidden>
            <strong>
              NO{"\u2082"} Column ({NO2_COLUMN_UNIT_LABEL})
            </strong>
            <i />
            <div>
              <span>0</span>
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>6</span>
              <span>8</span>
              <span>&ge;10</span>
            </div>
          </div>
        </>
      ) : null}
      {legend === "layers" ? (
        <div className="map-legend" aria-hidden>
          <span>
            <i className="legend-no2" />
            NO{"\u2082"} plume
          </span>
          <span>
            <i className="legend-fire" />
            Fire
          </span>
          <span>
            <i className="legend-pop" />
            Exposure
          </span>
        </div>
      ) : null}
    </div>
  );
}

const NO2_COLOR_STOPS: Array<[number, [number, number, number]]> = [
  [0, [49, 56, 213]],
  [1, [35, 148, 227]],
  [2, [94, 211, 111]],
  [3, [255, 229, 92]],
  [4, [255, 178, 56]],
  [6, [244, 121, 30]],
  [8, [227, 36, 36]],
  [10, [199, 0, 38]],
];

const NO2_RASTER_PIXEL_SCALE = 4;

function getNo2Color(
  no2: number,
  alpha: number,
): [number, number, number, number] {
  const value = Math.max(0, Math.min(10, no2));
  const firstStop = NO2_COLOR_STOPS[0];
  const lastStop = NO2_COLOR_STOPS[NO2_COLOR_STOPS.length - 1];

  if (value <= firstStop[0])
    return [firstStop[1][0], firstStop[1][1], firstStop[1][2], alpha];
  if (value >= lastStop[0])
    return [lastStop[1][0], lastStop[1][1], lastStop[1][2], alpha];

  for (let index = 0; index < NO2_COLOR_STOPS.length - 1; index += 1) {
    const [fromValue, fromColor] = NO2_COLOR_STOPS[index];
    const [toValue, toColor] = NO2_COLOR_STOPS[index + 1];

    if (value >= fromValue && value <= toValue) {
      const ratio = (value - fromValue) / (toValue - fromValue);
      return [
        Math.round(fromColor[0] + (toColor[0] - fromColor[0]) * ratio),
        Math.round(fromColor[1] + (toColor[1] - fromColor[1]) * ratio),
        Math.round(fromColor[2] + (toColor[2] - fromColor[2]) * ratio),
        alpha,
      ];
    }
  }

  return [lastStop[1][0], lastStop[1][1], lastStop[1][2], alpha];
}

function getNo2CacheKey(filters: Filters, cellSize: number) {
  return [
    filters.regionId ?? "west-africa",
    filters.countryId,
    filters.cityId,
    filters.year,
    filters.month,
    filters.season,
    cellSize.toFixed(4),
  ].join(":");
}

function getCachedNo2Surface(
  cacheKey: string,
  filters: Filters,
  cellSize: number,
) {
  const cached = NO2_SURFACE_CACHE.get(cacheKey);
  if (cached) return cached;

  const surface = getInterpolatedNo2Cells(filters, cellSize);
  setBoundedCacheValue(NO2_SURFACE_CACHE, cacheKey, surface);
  return surface;
}

function getCachedNo2Raster(
  cacheKey: string,
  surface: ReturnType<typeof getInterpolatedNo2Cells>,
  cellSize: number,
) {
  const cached = NO2_RASTER_CACHE.get(cacheKey);
  if (cached) return cached;

  const raster = createNo2RasterCanvas(surface, cellSize);
  setBoundedCacheValue(NO2_RASTER_CACHE, cacheKey, raster);
  return raster;
}

function setBoundedCacheValue<T>(cache: Map<string, T>, key: string, value: T) {
  if (cache.size >= MAX_NO2_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }

  cache.set(key, value);
}

function createNo2RasterCanvas(
  featureCollection: any,
  cellSize = INTERPOLATION_CELL_DEGREES,
): {
  bounds: [number, number, number, number];
  canvas: HTMLCanvasElement | null;
  key: string;
} {
  const features = featureCollection.features ?? [];
  const coordinates = features.flatMap(
    (feature: any) => feature.geometry.coordinates[0] as [number, number][],
  );
  if (coordinates.length === 0) {
    return EMPTY_NO2_RASTER;
  }

  const west = Math.min(
    ...coordinates.map(([longitude]: [number, number]) => longitude),
  );
  const east = Math.max(
    ...coordinates.map(([longitude]: [number, number]) => longitude),
  );
  const south = Math.min(
    ...coordinates.map(([, latitude]: [number, number]) => latitude),
  );
  const north = Math.max(
    ...coordinates.map(([, latitude]: [number, number]) => latitude),
  );
  const gridWidth = Math.max(1, Math.ceil((east - west) / cellSize));
  const gridHeight = Math.max(1, Math.ceil((north - south) / cellSize));
  const width = gridWidth * NO2_RASTER_PIXEL_SCALE;
  const height = gridHeight * NO2_RASTER_PIXEL_SCALE;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    return {
      bounds: [west, south, east, north],
      canvas: null,
      key: "empty-context",
    };
  }

  context.imageSmoothingEnabled = false;
  features.forEach((feature: any) => {
    const polygon = feature.geometry.coordinates[0] as [number, number][];
    const longitudes = polygon.map(([longitude]) => longitude);
    const latitudes = polygon.map(([, latitude]) => latitude);
    const x = ((Math.min(...longitudes) - west) / (east - west)) * width;
    const y = ((north - Math.max(...latitudes)) / (north - south)) * height;
    const rectWidth = Math.max(
      NO2_RASTER_PIXEL_SCALE,
      ((Math.max(...longitudes) - Math.min(...longitudes)) / (east - west)) *
        width +
        0.35,
    );
    const rectHeight = Math.max(
      NO2_RASTER_PIXEL_SCALE,
      ((Math.max(...latitudes) - Math.min(...latitudes)) / (north - south)) *
        height +
        0.35,
    );
    context.fillStyle = getNo2Hex(Number(feature.properties.column ?? 0));
    context.fillRect(x, y, rectWidth, rectHeight);
  });

  return {
    bounds: [west, south, east, north],
    canvas,
    key: `${west}:${south}:${east}:${north}:${features.length}:${features[0]?.properties?.column ?? 0}:${features[features.length - 1]?.properties?.column ?? 0}`,
  };
}

function getNo2Hex(no2: number) {
  const [red, green, blue] = getNo2Color(no2, 255);
  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
}

function toHex(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)))
    .toString(16)
    .padStart(2, "0");
}

function getFireColor(
  frp: number,
  alpha: number,
): [number, number, number, number] {
  const scaled = Math.min(1, frp / 160);
  if (scaled > 0.78) return [195, 0, 35, alpha];
  if (scaled > 0.58) return [232, 68, 20, alpha];
  if (scaled > 0.36) return [255, 136, 28, alpha];
  return [255, 202, 74, alpha];
}
