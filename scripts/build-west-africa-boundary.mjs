import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { TextDecoder } from "node:util";

const SHAPEFILE_NAME = "ne_50m_admin_0_countries";
const DEFAULT_SOURCE_DIR = "data/shapefiles/natural-earth-admin0-50m";
const DEFAULT_OUTPUT_PATH = "src/data/westAfricaBoundary.json";
const SOURCE_NAME = "Natural Earth Admin 0 Countries 1:50m";

const TARGET_COUNTRIES = [
  { id: "ben", iso3: "BEN", name: "Benin" },
  { id: "bfa", iso3: "BFA", name: "Burkina Faso" },
  { id: "civ", iso3: "CIV", name: "Cote d'Ivoire" },
  { id: "gmb", iso3: "GMB", name: "Gambia" },
  { id: "gha", iso3: "GHA", name: "Ghana" },
  { id: "gin", iso3: "GIN", name: "Guinea" },
  { id: "gnb", iso3: "GNB", name: "Guinea-Bissau" },
  { id: "lbr", iso3: "LBR", name: "Liberia" },
  { id: "mli", iso3: "MLI", name: "Mali" },
  { id: "mrt", iso3: "MRT", name: "Mauritania" },
  { id: "ner", iso3: "NER", name: "Niger" },
  { id: "nga", iso3: "NGA", name: "Nigeria" },
  { id: "sen", iso3: "SEN", name: "Senegal" },
  { id: "sle", iso3: "SLE", name: "Sierra Leone" },
  { id: "tgo", iso3: "TGO", name: "Togo" }
];

const [sourceDir = DEFAULT_SOURCE_DIR, outputPath = DEFAULT_OUTPUT_PATH] = process.argv.slice(2);
const targetByIso = new Map(TARGET_COUNTRIES.map((country, index) => [country.iso3, { ...country, index }]));

const geometries = readShapefile(resolve(sourceDir, `${SHAPEFILE_NAME}.shp`));
const records = readDbf(resolve(sourceDir, `${SHAPEFILE_NAME}.dbf`));

const features = geometries
  .map((geometry, index) => {
    const record = records[index];
    if (!record || record.deleted) return null;

    const iso3 = String(record.ISO_A3 || record.ADM0_A3 || record.SOV_A3 || "").trim().toUpperCase();
    const country = targetByIso.get(iso3);
    if (!country) return null;

    return {
      type: "Feature",
      properties: {
        id: country.id,
        iso3: country.iso3,
        name: country.name,
        source: SOURCE_NAME
      },
      geometry
    };
  })
  .filter(Boolean)
  .sort((left, right) => targetByIso.get(left.properties.iso3).index - targetByIso.get(right.properties.iso3).index);

const missing = TARGET_COUNTRIES.filter((country) => !features.some((feature) => feature.properties.iso3 === country.iso3));
if (missing.length > 0) {
  throw new Error(`Missing Natural Earth countries: ${missing.map((country) => country.iso3).join(", ")}`);
}

const collection = {
  type: "FeatureCollection",
  metadata: {
    source: SOURCE_NAME,
    sourceUrl: "https://naturalearth.s3.amazonaws.com/50m_cultural/ne_50m_admin_0_countries.zip",
    countryCount: features.length
  },
  features
};

writeFileSync(resolve(outputPath), `${JSON.stringify(collection)}\n`, "utf-8");
console.log(`Wrote ${features.length} West Africa country boundaries to ${outputPath}`);

function readShapefile(path) {
  const buffer = readFileSync(path);
  const shapeType = buffer.readInt32LE(32);

  if (![5, 15].includes(shapeType)) {
    throw new Error(`Unsupported shapefile type ${shapeType}. Expected polygon geometry.`);
  }

  const geometries = [];
  let offset = 100;

  while (offset + 8 <= buffer.length) {
    const recordNumber = buffer.readInt32BE(offset);
    const contentLength = buffer.readInt32BE(offset + 4) * 2;
    const contentOffset = offset + 8;
    const recordType = buffer.readInt32LE(contentOffset);

    if (recordType !== 0) {
      geometries.push(parsePolygonRecord(buffer, contentOffset, contentLength, recordNumber));
    }

    offset = contentOffset + contentLength;
  }

  return geometries;
}

function parsePolygonRecord(source, start, contentLength, recordNumber) {
  const numParts = source.readInt32LE(start + 36);
  const numPoints = source.readInt32LE(start + 40);
  const partsOffset = start + 44;
  const pointsOffset = partsOffset + numParts * 4;
  const contentEnd = start + contentLength;

  if (pointsOffset + numPoints * 16 > contentEnd) {
    throw new Error(`Record ${recordNumber} has invalid point data.`);
  }

  const parts = [];
  for (let index = 0; index < numParts; index += 1) {
    parts.push(source.readInt32LE(partsOffset + index * 4));
  }

  const points = [];
  for (let index = 0; index < numPoints; index += 1) {
    const pointOffset = pointsOffset + index * 16;
    points.push([round(source.readDoubleLE(pointOffset)), round(source.readDoubleLE(pointOffset + 8))]);
  }

  const rings = parts.map((startIndex, index) => {
    const endIndex = parts[index + 1] ?? points.length;
    return closeRing(points.slice(startIndex, endIndex));
  });

  return polygonRingsToGeometry(rings);
}

function polygonRingsToGeometry(rings) {
  const outers = [];
  const holes = [];

  rings.forEach((ring) => {
    const entry = { ring, area: signedArea(ring) };
    if (entry.area < 0) {
      outers.push({ ...entry, holes: [] });
    } else {
      holes.push(entry);
    }
  });

  if (outers.length === 0 && rings.length > 0) {
    const largest = rings
      .map((ring, index) => ({ ring, index, area: Math.abs(signedArea(ring)) }))
      .sort((left, right) => right.area - left.area)[0];
    outers.push({ ring: largest.ring, area: signedArea(largest.ring), holes: [] });
    holes.splice(largest.index, 1);
  }

  holes.forEach((hole) => {
    const point = firstUsablePoint(hole.ring);
    const container = outers.find((outer) => point && pointInRing(point, outer.ring));
    if (container) {
      container.holes.push(hole.ring);
    } else {
      outers.push({ ring: hole.ring, area: signedArea(hole.ring), holes: [] });
    }
  });

  const polygons = outers.map((outer) => [
    ensureCounterClockwise(outer.ring),
    ...outer.holes.map((hole) => ensureClockwise(hole))
  ]);

  return polygons.length === 1
    ? { type: "Polygon", coordinates: polygons[0] }
    : { type: "MultiPolygon", coordinates: polygons };
}

function readDbf(path) {
  const decoder = new TextDecoder("utf-8");
  const buffer = readFileSync(path);
  const recordCount = buffer.readUInt32LE(4);
  const headerLength = buffer.readUInt16LE(8);
  const recordLength = buffer.readUInt16LE(10);
  const fields = [];
  let offset = 32;

  while (offset < headerLength - 1 && buffer[offset] !== 0x0d) {
    const name = buffer
      .subarray(offset, offset + 11)
      .toString("ascii")
      .replace(/\0.*$/, "")
      .trim();
    fields.push({
      name,
      type: String.fromCharCode(buffer[offset + 11]),
      length: buffer[offset + 16],
      decimals: buffer[offset + 17]
    });
    offset += 32;
  }

  const records = [];
  for (let index = 0; index < recordCount; index += 1) {
    const recordOffset = headerLength + index * recordLength;
    const deleted = String.fromCharCode(buffer[recordOffset]) === "*";
    let fieldOffset = recordOffset + 1;
    const record = { deleted };

    fields.forEach((field) => {
      const valueBytes = buffer.subarray(fieldOffset, fieldOffset + field.length);
      const rawValue = decoder.decode(valueBytes).trim();
      record[field.name] = field.type === "N" && rawValue !== "" ? Number(rawValue) : rawValue;
      fieldOffset += field.length;
    });

    records.push(record);
  }

  return records;
}

function closeRing(ring) {
  if (ring.length === 0) return ring;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) return ring;
  return [...ring, first];
}

function signedArea(ring) {
  let area = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    const [x1, y1] = ring[index];
    const [x2, y2] = ring[index + 1];
    area += x1 * y2 - x2 * y1;
  }
  return area / 2;
}

function ensureCounterClockwise(ring) {
  return signedArea(ring) < 0 ? [...ring].reverse() : ring;
}

function ensureClockwise(ring) {
  return signedArea(ring) > 0 ? [...ring].reverse() : ring;
}

function firstUsablePoint(ring) {
  return ring.find(([longitude, latitude]) => Number.isFinite(longitude) && Number.isFinite(latitude));
}

function pointInRing(point, ring) {
  const [x, y] = point;
  let inside = false;

  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
    const [xi, yi] = ring[index];
    const [xj, yj] = ring[previous];
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }

  return inside;
}

function round(value) {
  return Number(value.toFixed(6));
}
