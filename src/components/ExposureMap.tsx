"use client";

import DeckGL from "@deck.gl/react";
import { GeoJsonLayer, ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import Map, { NavigationControl, ScaleControl } from "react-map-gl/maplibre";
import { Layers } from "lucide-react";
import type { PickingInfo } from "@deck.gl/core";
import type { City, Filters, Hotspot, LayerKey } from "@/types/exposure";
import {
  CITIES,
  NO2_COLUMN_UNIT_LABEL,
  getCitiesForCountry,
  getCountryFeatureCollection,
  getHotspots,
  toNo2ColumnValue
} from "@/data/sampleData";

const MAP_STYLE = {
  version: 8,
  sources: {
    "carto-light": {
      type: "raster",
      tiles: ["https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap contributors &copy; CARTO"
    }
  },
  layers: [
    {
      id: "carto-light",
      type: "raster",
      source: "carto-light",
      paint: {
        "raster-opacity": 0.92,
        "raster-saturation": -0.2
      }
    }
  ]
} as const;

const INITIAL_VIEW_STATE = {
  longitude: -1.8,
  latitude: 11.2,
  zoom: 3.55,
  minZoom: 2.5,
  maxZoom: 9,
  pitch: 0,
  bearing: 0
};

const OVERVIEW_CITY_LABELS = new Set(["dakar", "bamako", "kano", "lagos", "abidjan", "accra", "conakry"]);

export function ExposureMap({
  filters,
  activeLayers,
  selectedCountryId,
  onSelectCountry,
  compact = false,
  legend = "layers"
}: {
  filters: Filters;
  activeLayers: Record<LayerKey, boolean>;
  selectedCountryId: string;
  onSelectCountry: (countryId: string) => void;
  compact?: boolean;
  legend?: "layers" | "column" | "none";
}) {
  const hotspots = getHotspots(filters);
  const featureCollection = getCountryFeatureCollection(filters);
  const cities = filters.countryId === "all" ? CITIES : getCitiesForCountry(filters.countryId);
  const labelCities = compact ? cities.filter((city) => OVERVIEW_CITY_LABELS.has(city.id)) : cities;
  const showCountryPolygons = !compact;

  const layers = [
    activeLayers.no2
      ? new ScatterplotLayer<Hotspot>({
          id: "no2-column-haze",
          data: hotspots,
          pickable: false,
          opacity: compact ? 0.4 : 0.3,
          stroked: false,
          filled: true,
          radiusUnits: "meters",
          radiusMinPixels: compact ? 28 : 18,
          radiusMaxPixels: compact ? 112 : 72,
          getPosition: (hotspot) => hotspot.coordinates,
          getRadius: (hotspot) => hotspot.no2 * (compact ? 39000 : 25000),
          getFillColor: (hotspot) => getNo2Color(hotspot.no2, 88)
        })
      : null,
    showCountryPolygons
      ? new GeoJsonLayer({
          id: "country-polygons",
          data: featureCollection as any,
          pickable: true,
          stroked: true,
          filled: true,
          lineWidthMinPixels: 1,
          getLineColor: (feature: any) =>
            feature.properties.id === selectedCountryId ? [19, 84, 122, 235] : [76, 108, 122, 150],
          getFillColor: (feature: any) => {
            const no2 = Number(feature.properties.no2 ?? 0);
            const intensity = Math.min(1, no2 / 36);
            return [240 + intensity * 10, 236 - intensity * 98, 190 - intensity * 110, 72 + intensity * 42];
          },
          onClick: (info: PickingInfo) => {
            const id = (info.object as any)?.properties?.id;
            if (id) onSelectCountry(id);
          },
          updateTriggers: {
            getLineColor: [selectedCountryId],
            getFillColor: [filters.year, filters.month, filters.season]
          }
        })
      : null,
    activeLayers.no2
      ? new ScatterplotLayer<Hotspot>({
          id: "no2-heat",
          data: hotspots,
          pickable: true,
          opacity: compact ? 0.64 : 0.78,
          stroked: false,
          filled: true,
          radiusUnits: "meters",
          radiusMinPixels: compact ? 12 : 10,
          radiusMaxPixels: compact ? 44 : 58,
          getPosition: (hotspot) => hotspot.coordinates,
          getRadius: (hotspot) => hotspot.no2 * (compact ? 16500 : 14500),
          getFillColor: (hotspot) => getNo2Color(hotspot.no2, 150)
        })
      : null,
    activeLayers.fire
      ? new ScatterplotLayer<Hotspot>({
          id: "fire-hotspots",
          data: hotspots,
          pickable: true,
          opacity: 0.86,
          stroked: true,
          lineWidthMinPixels: 1,
          radiusUnits: "meters",
          radiusMinPixels: 5,
          radiusMaxPixels: 28,
          getPosition: (hotspot) => hotspot.coordinates,
          getRadius: (hotspot) => hotspot.fireIntensity * 5200,
          getLineColor: [255, 226, 115, 230],
          getFillColor: [255, 114, 67, 170]
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
          getRadius: (hotspot) => Math.max(50000, hotspot.populationExposure * 1150),
          getLineColor: [194, 255, 117, 190],
          getFillColor: [94, 233, 181, 95]
        })
      : null,
    new TextLayer<City>({
      id: "city-labels",
      data: labelCities,
      getPosition: (city) => city.coordinates,
      getText: (city) => city.name,
      getSize: compact ? 13 : 12,
      getColor: [18, 38, 52, 235],
      getTextAnchor: "middle",
      getAlignmentBaseline: "bottom",
      getPixelOffset: [0, -8],
      background: true,
      getBackgroundColor: [255, 255, 255, compact ? 230 : 205],
      backgroundPadding: [4, 2],
      pickable: false
    })
  ].filter(Boolean);

  return (
    <div className={compact ? "map-panel compact" : "map-panel"}>
      <DeckGL
        controller
        getCursor={({ isDragging, isHovering }) => (isDragging ? "grabbing" : isHovering ? "pointer" : "grab")}
        getTooltip={({ object }) => {
          if (!object) return null;
          if ((object as Hotspot).coordinates) {
            const hotspot = object as Hotspot;
            return {
              text: `${hotspot.label}\nNO₂ ${toNo2ColumnValue(hotspot.no2, "hotspot")} ${NO2_COLUMN_UNIT_LABEL}\nFire intensity ${hotspot.fireIntensity}\nPopulation exposure ${hotspot.populationExposure}`
            };
          }
          const feature = object as any;
          return {
            text: `${feature.properties.name}\nNO₂ ${toNo2ColumnValue(feature.properties.no2, "country")} ${NO2_COLUMN_UNIT_LABEL}\nExposure ${Number(feature.properties.exposure).toLocaleString()}`
          };
        }}
        initialViewState={INITIAL_VIEW_STATE}
        layers={layers}
      >
        <Map mapStyle={MAP_STYLE as any} reuseMaps>
          <NavigationControl position="top-left" showCompass={false} />
          <ScaleControl position={legend === "column" ? "bottom-right" : "bottom-left"} />
        </Map>
      </DeckGL>
      {legend === "column" ? (
        <>
          <button className="map-layer-button" type="button" aria-label="Layers">
            <Layers size={18} aria-hidden />
          </button>
          <div className="column-map-legend" aria-hidden>
            <strong>NO{"\u2082"} Column ({NO2_COLUMN_UNIT_LABEL})</strong>
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

function getNo2Color(no2: number, alpha: number): [number, number, number, number] {
  const scaled = Math.min(1, no2 / 36);
  if (scaled > 0.78) return [215, 25, 28, alpha];
  if (scaled > 0.58) return [245, 118, 30, alpha];
  if (scaled > 0.38) return [254, 226, 90, alpha];
  if (scaled > 0.24) return [96, 200, 111, alpha];
  return [38, 145, 226, alpha];
}
