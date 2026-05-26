"use client";

import DeckGL from "@deck.gl/react";
import { GeoJsonLayer, ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import Map, { NavigationControl, ScaleControl } from "react-map-gl/maplibre";
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
  zoom: 3.5,
  minZoom: 2.5,
  maxZoom: 9,
  pitch: 26,
  bearing: 0
};

export function ExposureMap({
  filters,
  activeLayers,
  selectedCountryId,
  onSelectCountry,
  compact = false
}: {
  filters: Filters;
  activeLayers: Record<LayerKey, boolean>;
  selectedCountryId: string;
  onSelectCountry: (countryId: string) => void;
  compact?: boolean;
}) {
  const hotspots = getHotspots(filters);
  const featureCollection = getCountryFeatureCollection(filters);
  const cities = filters.countryId === "all" ? CITIES : getCitiesForCountry(filters.countryId);

  const layers = [
    new GeoJsonLayer({
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
        return [240 + intensity * 10, 236 - intensity * 98, 190 - intensity * 110, 118 + intensity * 58];
      },
      onClick: (info: PickingInfo) => {
        const id = (info.object as any)?.properties?.id;
        if (id) onSelectCountry(id);
      },
      updateTriggers: {
        getLineColor: [selectedCountryId],
        getFillColor: [filters.year, filters.month, filters.season]
      }
    }),
    activeLayers.no2
      ? new ScatterplotLayer<Hotspot>({
          id: "no2-heat",
          data: hotspots,
          pickable: true,
          opacity: 0.78,
          stroked: false,
          filled: true,
          radiusUnits: "meters",
          radiusMinPixels: 12,
          radiusMaxPixels: 66,
          getPosition: (hotspot) => hotspot.coordinates,
          getRadius: (hotspot) => hotspot.no2 * 14500,
          getFillColor: (hotspot) => {
            const scaled = Math.min(1, hotspot.no2 / 36);
            return [220 + scaled * 35, 80 + scaled * 80, 44, 92 + scaled * 72];
          }
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
      data: cities,
      getPosition: (city) => city.coordinates,
      getText: (city) => city.name,
      getSize: 12,
      getColor: [35, 52, 62, 230],
      getTextAnchor: "middle",
      getAlignmentBaseline: "bottom",
      getPixelOffset: [0, -8],
      background: true,
      getBackgroundColor: [255, 255, 255, 205],
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
          <ScaleControl position="bottom-left" />
        </Map>
      </DeckGL>
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
    </div>
  );
}
