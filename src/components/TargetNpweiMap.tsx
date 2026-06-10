"use client";

import { useEffect, useState } from "react";
import DeckGL from "@deck.gl/react";
import { GeoJsonLayer } from "@deck.gl/layers";
import MapLibreMap, { ScaleControl } from "react-map-gl/maplibre";
import { Minus, Plus } from "lucide-react";
import { MapPanelSkeleton } from "@/components/Skeletons";
import abnMapBoundary from "@/data/abnMapBoundary.json";
import africaContourMap from "@/data/africaContourMap.json";
import type { CityNpweiRow, WebDataSeason } from "@/data/webData";

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
      id: "carto-light",
      type: "raster",
      source: "carto-light",
      paint: {
        "raster-opacity": 0.94,
        "raster-saturation": -0.22
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
type PixelFeature = {
  type: "Feature";
  properties: {
    city: string;
    country: string;
    column?: number;
    npwei: number;
    population: number;
    value: number;
  };
  geometry: {
    type: "Polygon";
    coordinates: Array<Array<[number, number]>>;
  };
};
type PixelFeatureCollection = {
  type: "FeatureCollection";
  features: PixelFeature[];
};

export type TargetMapLayerMode = "no2" | "population";

type PixelSource = {
  country: string;
  lat: number;
  lon: number;
  name: string;
  npwei: number;
  population: number;
  populationWeight: number;
  radius: number;
  value: number;
};

const SUPPLEMENTAL_EXPOSURE_SOURCES = [
  { name: "Conakry", country: "Guinea", lon: -13.68, lat: 9.64, npwei: 27, population: 2.05, radius: 1.18 },
  { name: "Freetown", country: "Sierra Leone", lon: -13.23, lat: 8.48, npwei: 25, population: 1.21, radius: 1.08 },
  { name: "Monrovia", country: "Liberia", lon: -10.8, lat: 6.31, npwei: 12, population: 1.67, radius: 0.86 },
  { name: "Bissau corridor", country: "Guinea-Bissau", lon: -15.1, lat: 11.85, npwei: 12, population: 0.6, radius: 0.72 },
  { name: "Niamey", country: "Niger", lon: 2.11, lat: 13.51, npwei: 18, population: 1.39, radius: 1.02 },
  { name: "Maroua corridor", country: "Cameroon", lon: 14.25, lat: 10.6, npwei: 20, population: 0.95, radius: 0.9 }
] as const;

export function TargetNpweiMap({
  rows,
  season,
  year,
  month,
  layerMode = "no2"
}: {
  rows: CityNpweiRow[];
  season: WebDataSeason;
  year: number;
  month: number;
  layerMode?: TargetMapLayerMode;
}) {
  const [isClient, setIsClient] = useState(false);
  const [surface, setSurface] = useState<PixelFeatureCollection | null>(null);
  const [viewState, setViewState] = useState<MapViewState>(INITIAL_VIEW_STATE);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    let canceled = false;
    setSurface(null);

    const timeoutId = window.setTimeout(() => {
      const nextSurface = getUrbanPixelSurface(rows, season, year, month, layerMode);
      if (!canceled) setSurface(nextSurface);
    }, 0);

    return () => {
      canceled = true;
      window.clearTimeout(timeoutId);
    };
  }, [isClient, layerMode, month, rows, season, year]);

  if (!isClient || !surface) return <MapPanelSkeleton />;

  const zoomMap = (step: number) => {
    setViewState((current) => ({
      ...current,
      zoom: Math.min(INITIAL_VIEW_STATE.maxZoom, Math.max(INITIAL_VIEW_STATE.minZoom, current.zoom + step))
    }));
  };

  const layers = [
    new GeoJsonLayer({
      id: "africa-contour-fill",
      data: africaContourMap as any,
      pickable: false,
      stroked: false,
      filled: true,
      getFillColor: [232, 238, 231, 20]
    }),
    new GeoJsonLayer({
      id: "africa-contour-outline",
      data: africaContourMap as any,
      pickable: false,
      stroked: true,
      filled: false,
      lineWidthUnits: "pixels",
      lineWidthMinPixels: 1,
      getLineColor: [115, 134, 150, 95]
    }),
    new GeoJsonLayer({
      id: "west-africa-boundary-fill",
      data: abnMapBoundary as any,
      pickable: false,
      stroked: false,
      filled: true,
      getFillColor: [255, 255, 255, 22]
    }),
    new GeoJsonLayer({
      id: `${layerMode}-urban-pixels`,
      data: surface as any,
      pickable: true,
      stroked: false,
      filled: true,
      opacity: layerMode === "population" ? 0.78 : 0.86,
      getFillColor: (feature: any) =>
        layerMode === "population"
          ? getPopulationColor(Number(feature.properties?.value ?? 0), 208)
          : getNpweiColor(Number(feature.properties?.value ?? 0), 214),
      updateTriggers: {
        getFillColor: [season, year, month, layerMode]
      }
    }),
    new GeoJsonLayer({
      id: "west-africa-boundary-halo",
      data: abnMapBoundary as any,
      pickable: false,
      stroked: true,
      filled: false,
      lineWidthUnits: "pixels",
      lineWidthMinPixels: 2.5,
      getLineColor: [255, 255, 255, 210]
    }),
    new GeoJsonLayer({
      id: "west-africa-boundary-outline",
      data: abnMapBoundary as any,
      pickable: false,
      stroked: true,
      filled: false,
      lineWidthUnits: "pixels",
      lineWidthMinPixels: 1.05,
      getLineColor: [71, 93, 116, 170]
    })
  ];

  return (
    <div className="map-panel target-npwei-map-panel">
      <DeckGL
        controller
        getCursor={({ isDragging, isHovering }) => (isDragging ? "grabbing" : isHovering ? "pointer" : "grab")}
        getTooltip={({ object }) => {
          const feature = object as PixelFeature | null;
          if (!feature) return null;
          const population = feature.properties.population.toFixed(2);
          const metric = layerMode === "population" ? `Urban population ${population}M` : `NPWEI ${Math.round(feature.properties.npwei)}/100`;
          return {
            text: `${feature.properties.city}, ${feature.properties.country}\n${metric}`
          };
        }}
        layers={layers}
        onViewStateChange={({ viewState: nextViewState }) => {
          setViewState({
            ...INITIAL_VIEW_STATE,
            ...(nextViewState as Partial<MapViewState>),
            minZoom: INITIAL_VIEW_STATE.minZoom,
            maxZoom: INITIAL_VIEW_STATE.maxZoom,
            pitch: 0,
            bearing: 0
          });
        }}
        viewState={viewState}
      >
        <MapLibreMap mapStyle={MAP_STYLE as any} reuseMaps>
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
    </div>
  );
}

function getUrbanPixelSurface(
  rows: CityNpweiRow[],
  season: WebDataSeason,
  year: number,
  month: number,
  layerMode: TargetMapLayerMode
): PixelFeatureCollection {
  if (layerMode === "no2") {
    return getSparseNo2PixelSurface(rows, season, year, month);
  }

  const features: PixelFeature[] = [];
  const selectedMonthBoost = getMonthBoost(month);
  const selectedSeasonBoost = season === "DJF" ? 1.08 : season === "JJA" ? 0.94 : 1;
  const yearBoost = 0.96 + Math.max(0, Math.min(4, year - 2020)) * 0.01;
  const valueBoost = selectedMonthBoost * selectedSeasonBoost * yearBoost;
  const cellSize = 0.12;
  const maxUrbanPop = Math.max(1, ...rows.map((city) => city.urbanPop));
  const sources = rows.map((city) => getPixelSource(city, valueBoost, maxUrbanPop, layerMode));
  const selectedCity = rows.length === 1 ? rows[0] : null;
  const bounds = selectedCity ? getCityBounds(selectedCity) : [-17.8, 4.45, 14.15, 15.95];

  for (let longitude = bounds[0]; longitude <= bounds[2]; longitude += cellSize) {
    for (let latitude = bounds[1]; latitude <= bounds[3]; latitude += cellSize) {
      const centroid: [number, number] = [round(longitude + cellSize / 2, 3), round(latitude + cellSize / 2, 3)];
      const influence = interpolateNpweiCell(centroid, sources);
      if (!influence) continue;
      if (!pointInGeoJsonFeatureCollection(centroid, abnMapBoundary as any)) continue;

      const seed = hashString(`${round(longitude, 2)}:${round(latitude, 2)}:${season}`);
      const maskNoise = deterministicNoise(seed, 1, 17);
      const textureNoise = deterministicNoise(seed, 2, 23);
      const threshold = selectedCity ? 0.17 : 0.25;
      if (influence.coverage < threshold + maskNoise * 0.16 && influence.value < 72) continue;

      const texture = (textureNoise - 0.5) * 13 + (maskNoise - 0.5) * 7;
      const hotspotLift = layerMode === "population" ? Math.min(16, Math.pow(influence.coverage, 1.08) * 15) : Math.min(24, Math.pow(influence.coverage, 1.18) * 22);
      const value = clamp(influence.value + hotspotLift + texture, 2, 100);
      const west = round(longitude, 3);
      const east = round(Math.min(longitude + cellSize, bounds[2]), 3);
      const south = round(latitude, 3);
      const north = round(Math.min(latitude + cellSize, bounds[3]), 3);

      features.push({
        type: "Feature",
        properties: {
          city: influence.city,
          country: influence.country,
          npwei: influence.npwei,
          population: influence.population,
          value
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [west, south],
              [east, south],
              [east, north],
              [west, north],
              [west, south]
            ]
          ]
        }
      });
    }
  }

  return {
    type: "FeatureCollection",
    features
  };
}

function getSparseNo2PixelSurface(rows: CityNpweiRow[], season: WebDataSeason, year: number, month: number): PixelFeatureCollection {
  const features: PixelFeature[] = [];
  const selectedCity = rows.length === 1;
  const cellSize = 0.12;
  const selectedMonthBoost = getMonthBoost(month);
  const selectedSeasonBoost = season === "DJF" ? 1.08 : season === "JJA" ? 0.94 : 1;
  const yearBoost = 0.96 + Math.max(0, Math.min(4, year - 2020)) * 0.01;
  const valueBoost = selectedMonthBoost * selectedSeasonBoost * yearBoost;
  const maxUrbanPop = Math.max(1, ...rows.map((city) => city.urbanPop));
  const sources = getNo2PixelSources(rows, valueBoost, maxUrbanPop);
  const bounds = selectedCity ? getNo2CityBounds(rows[0]) : getNo2RasterBounds(sources);

  for (let longitude = snapToGrid(bounds[0], cellSize); longitude <= bounds[2]; longitude += cellSize) {
    for (let latitude = snapToGrid(bounds[1], cellSize); latitude <= bounds[3]; latitude += cellSize) {
      const centroid: [number, number] = [round(longitude + cellSize / 2, 3), round(latitude + cellSize / 2, 3)];
      if (!pointInGeoJsonFeatureCollection(centroid, abnMapBoundary as any)) continue;

      const influence = interpolateExposureCell(centroid, sources, season);
      if (!influence) continue;

      const seed = hashString(`${round(longitude, 2)}:${round(latitude, 2)}:${influence.city}:${season}:${year}:${month}`);
      if (!shouldKeepExposurePixel(influence, centroid, seed, selectedCity)) continue;

      const textureNoise = deterministicNoise(seed, 2, 23);
      const edgeNoise = deterministicNoise(seed, 5, 47);
      const column = clamp(influence.column + (textureNoise - 0.5) * 0.74 + influence.coverage * 0.44, 0.1, 10.4);
      const texture = (textureNoise - 0.5) * 11 + (edgeNoise - 0.5) * 5;
      const value = clamp(influence.value + Math.pow(influence.coverage, 0.86) * 18 + texture, 2, 100);
      const westCell = round(longitude, 3);
      const eastCell = round(longitude + cellSize, 3);
      const southCell = round(latitude, 3);
      const northCell = round(latitude + cellSize, 3);

      features.push({
        type: "Feature",
        properties: {
          city: influence.city,
          column,
          country: influence.country,
          npwei: influence.npwei,
          population: influence.population,
          value
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [westCell, southCell],
              [eastCell, southCell],
              [eastCell, northCell],
              [westCell, northCell],
              [westCell, southCell]
            ]
          ]
        }
      });
    }
  }

  return {
    type: "FeatureCollection",
    features
  };
}

function getNo2PixelSources(rows: CityNpweiRow[], valueBoost: number, maxUrbanPop: number) {
  const rowSources = rows.map((city) => getPixelSource(city, valueBoost, maxUrbanPop, "no2"));
  if (rows.length === 1) return rowSources;

  const rowCountries = new Set(rows.map((row) => row.country));
  const isRegionalView = rows.length >= 12;
  const supplementalSources = SUPPLEMENTAL_EXPOSURE_SOURCES
    .filter((source) => isRegionalView || rowCountries.has(source.country))
    .map((source) => ({
      country: source.country,
      lat: source.lat,
      lon: source.lon,
      name: source.name,
      npwei: source.npwei,
      population: source.population,
      populationWeight: Math.sqrt(source.population),
      radius: source.radius,
      value: clamp(source.npwei * valueBoost, 1, 100)
    }));

  return rowSources.concat(supplementalSources);
}

function getPixelSource(city: CityNpweiRow, valueBoost: number, maxUrbanPop: number, layerMode: TargetMapLayerMode): PixelSource {
  const populationWeight = Math.sqrt(Math.max(0.1, city.urbanPop));
  const populationValue = Math.round((city.urbanPop / maxUrbanPop) * 100);
  const no2Radius = clamp(0.48 + populationWeight * 0.24 + city.npwei * 0.006, 0.74, 2.35);
  const populationRadius = 0.72 + populationWeight * 0.32 + populationValue * 0.006;

  return {
    country: city.country,
    lat: city.lat,
    lon: city.lon,
    name: city.name,
    npwei: city.npwei,
    population: city.urbanPop,
    populationWeight,
    radius: layerMode === "population" ? populationRadius : no2Radius,
    value: clamp(layerMode === "population" ? populationValue : city.npwei * valueBoost, 1, 100)
  };
}

function interpolateExposureCell(point: [number, number], sources: PixelSource[], season: WebDataSeason) {
  let coverage = 0;
  let weightedValue = 0;
  let weightedColumn = 0;
  let strongest = 0;
  let nearest = sources[0];
  const latitudeScale = Math.max(0.72, Math.cos((point[1] * Math.PI) / 180));

  for (const source of sources) {
    const dx = (point[0] - source.lon) * latitudeScale;
    const dy = (point[1] - source.lat) * 1.12;
    const angle = getPlumeAngle(source, season);
    const along = dx * Math.cos(angle) + dy * Math.sin(angle);
    const cross = -dx * Math.sin(angle) + dy * Math.cos(angle);
    const alongRadius = source.radius * (season === "DJF" ? 1.64 : season === "JJA" ? 1.42 : 1.5);
    const crossRadius = source.radius * (season === "JJA" ? 0.98 : 0.88);
    const normalizedDistance = Math.sqrt((along / alongRadius) ** 2 + (cross / crossRadius) ** 2);

    if (normalizedDistance > 2.02) continue;

    const decay = Math.exp(-normalizedDistance * normalizedDistance * 0.92);
    const weight = decay * source.populationWeight * (0.54 + source.value / 150);
    coverage += weight;
    weightedValue += source.value * weight;
    weightedColumn += (source.value / 11.5) * weight;

    if (weight > strongest) {
      strongest = weight;
      nearest = source;
    }
  }

  if (!nearest || coverage <= 0) return null;

  return {
    city: nearest.name,
    column: weightedColumn / coverage,
    country: nearest.country,
    coverage: Math.min(1.9, coverage / 4.4),
    npwei: nearest.npwei,
    population: nearest.population,
    value: weightedValue / coverage
  };
}

function shouldKeepExposurePixel(
  influence: NonNullable<ReturnType<typeof interpolateExposureCell>>,
  point: [number, number],
  seed: number,
  selectedCity: boolean
) {
  const maskNoise = deterministicNoise(seed, 1, 17);
  const holeNoise = deterministicNoise(seed, 3, 41);
  const edgeNoise = deterministicNoise(seed, 6, 59);
  const patchNoise =
    Math.sin(point[0] * 2.9 + point[1] * 1.7) * 0.5 +
    Math.cos(point[0] * 1.6 - point[1] * 2.35) * 0.34 +
    Math.sin(point[0] * 6.1 + point[1] * 3.2) * 0.16;
  const baseThreshold = selectedCity ? 0.08 : 0.13;
  const threshold = baseThreshold + maskNoise * 0.33 - Math.max(0, patchNoise) * 0.08;

  if (influence.coverage < threshold && influence.value < 70) return false;
  if (influence.coverage < 0.3 && edgeNoise < 0.55) return false;
  if (influence.coverage < 0.58 && patchNoise < -0.2) return false;
  if (influence.coverage < 0.86 && holeNoise < 0.14) return false;

  return true;
}

function getPlumeAngle(source: PixelSource, season: WebDataSeason) {
  const seed = hashString(`${source.name}:${source.country}:${season}`);
  const base = deterministicNoise(seed, 7, 71) * Math.PI;
  const seasonalTurn = season === "DJF" ? -0.36 : season === "JJA" ? 0.28 : 0;
  return base + seasonalTurn;
}

function getCityBounds(city: CityNpweiRow): [number, number, number, number] {
  const padding = 1.9 + Math.sqrt(Math.max(0.1, city.urbanPop)) * 0.28;
  return [city.lon - padding, city.lat - padding * 0.72, city.lon + padding, city.lat + padding * 0.72];
}

function getNo2CityBounds(city: CityNpweiRow): [number, number, number, number] {
  const padding = 1.55 + Math.sqrt(Math.max(0.1, city.urbanPop)) * 0.34;
  return [city.lon - padding, city.lat - padding * 0.78, city.lon + padding, city.lat + padding * 0.78];
}

function getNo2RasterBounds(sources: PixelSource[]): [number, number, number, number] {
  const longitudes = sources.map((source) => source.lon);
  const latitudes = sources.map((source) => source.lat);
  const west = Math.max(-18.2, Math.min(...longitudes) - 2.35);
  const east = Math.min(15.2, Math.max(...longitudes) + 1.8);
  const south = Math.max(4.0, Math.min(...latitudes) - 1.85);
  const north = Math.min(15.7, Math.max(...latitudes) + 1.65);

  return [west, south, east, north];
}

function interpolateNpweiCell(point: [number, number], sources: PixelSource[]) {
  let coverage = 0;
  let weightedValue = 0;
  let strongest = 0;
  let nearest = sources[0];
  const latitudeScale = Math.max(0.74, Math.cos((point[1] * Math.PI) / 180));

  for (const source of sources) {
    const dx = (point[0] - source.lon) * latitudeScale;
    const dy = (point[1] - source.lat) * 1.18;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > source.radius * 2.45) continue;

    const decay = Math.exp(-(distance * distance) / (2 * source.radius * source.radius));
    const weight = decay * source.populationWeight * (0.62 + source.value / 125);
    coverage += weight;
    weightedValue += source.value * weight;

    if (weight > strongest) {
      strongest = weight;
      nearest = source;
    }
  }

  if (!nearest || coverage <= 0) return null;

  return {
    city: nearest.name,
    country: nearest.country,
    coverage: Math.min(1.8, coverage / 4.2),
    npwei: nearest.npwei,
    population: nearest.population,
    value: weightedValue / coverage
  };
}

function pointInGeoJsonFeatureCollection(point: [number, number], collection: any) {
  return Boolean(
    collection.features?.some((feature: any) => {
      const geometry = feature.geometry;
      if (!geometry) return false;

      if (geometry.type === "Polygon") return pointInPolygonWithHoles(point, geometry.coordinates);
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

  for (let index = 0, previousIndex = polygon.length - 1; index < polygon.length; previousIndex = index, index += 1) {
    const [longitudeA, latitudeA] = polygon[index];
    const [longitudeB, latitudeB] = polygon[previousIndex];
    const intersects =
      latitudeA > latitude !== latitudeB > latitude &&
      longitude < ((longitudeB - longitudeA) * (latitude - latitudeA)) / (latitudeB - latitudeA) + longitudeA;

    if (intersects) inside = !inside;
  }

  return inside;
}

function getMonthBoost(month: number) {
  if (month <= 2 || month >= 11) return 1.08;
  if (month >= 6 && month <= 9) return 0.93;
  return 1;
}

function getNpweiColor(value: number, alpha: number): [number, number, number, number] {
  const stops: Array<[number, [number, number, number]]> = [
    [0, [82, 0, 168]],
    [25, [125, 30, 183]],
    [45, [191, 41, 151]],
    [62, [238, 95, 93]],
    [78, [249, 163, 41]],
    [100, [242, 229, 29]]
  ];
  const clamped = clamp(value, 0, 100);

  for (let index = 0; index < stops.length - 1; index += 1) {
    const [fromValue, fromColor] = stops[index];
    const [toValue, toColor] = stops[index + 1];
    if (clamped >= fromValue && clamped <= toValue) {
      const ratio = (clamped - fromValue) / (toValue - fromValue);
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

function getPopulationColor(value: number, alpha: number): [number, number, number, number] {
  const stops: Array<[number, [number, number, number]]> = [
    [0, [224, 247, 250]],
    [18, [139, 213, 210]],
    [38, [48, 174, 183]],
    [62, [22, 116, 166]],
    [82, [30, 70, 148]],
    [100, [40, 31, 132]]
  ];
  const clamped = clamp(value, 0, 100);

  for (let index = 0; index < stops.length - 1; index += 1) {
    const [fromValue, fromColor] = stops[index];
    const [toValue, toColor] = stops[index + 1];
    if (clamped >= fromValue && clamped <= toValue) {
      const ratio = (clamped - fromValue) / (toValue - fromValue);
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

function deterministicNoise(seed: number, index: number, salt: number) {
  const value = Math.sin(seed * 12.9898 + index * 78.233 + salt * 37.719) * 43758.5453;
  return value - Math.floor(value);
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash) + 1;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits = 3) {
  return Number(value.toFixed(digits));
}

function snapToGrid(value: number, cellSize: number) {
  return round(Math.floor(value / cellSize) * cellSize, 3);
}
