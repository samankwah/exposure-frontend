const ESRI_CANVAS_SERVICE_ROOT = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas";
const ESRI_ATTRIBUTION =
  "Tiles &copy; <a href=\"https://www.esri.com/\">Esri</a> &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors, and the GIS user community &middot; Place names <a href=\"https://www.geonames.org/\">GeoNames</a> (CC BY 4.0)";

export type EsriCanvasBasemap = "World_Light_Gray" | "World_Dark_Gray";

// Esri's public tiles work without a key; set NEXT_PUBLIC_ESRI_API_KEY to send an
// ArcGIS Location Platform token for production traffic.
function buildEsriTileUrl(service: string) {
  const token = process.env.NEXT_PUBLIC_ESRI_API_KEY;
  const url = `${ESRI_CANVAS_SERVICE_ROOT}/${service}/MapServer/tile/{z}/{y}/{x}`;
  return token ? `${url}?token=${encodeURIComponent(token)}` : url;
}

// MapLibre style with an Esri Canvas base layer and its matching reference
// (country and city labels) layer drawn on top.
export function buildEsriMapStyle(basemap: EsriCanvasBasemap, backgroundColor: string) {
  return {
    version: 8,
    sources: {
      "esri-base": {
        type: "raster",
        tiles: [buildEsriTileUrl(`${basemap}_Base`)],
        tileSize: 256,
        maxzoom: 16,
        attribution: ESRI_ATTRIBUTION
      },
      "esri-reference": {
        type: "raster",
        tiles: [buildEsriTileUrl(`${basemap}_Reference`)],
        tileSize: 256,
        maxzoom: 16
      }
    },
    layers: [
      {
        id: "local-background",
        type: "background",
        paint: {
          "background-color": backgroundColor
        }
      },
      {
        id: "esri-base",
        type: "raster",
        source: "esri-base"
      },
      {
        id: "esri-reference",
        type: "raster",
        source: "esri-reference"
      }
    ]
  } as const;
}
