import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const [inputPath, outputPath, idPrefix = "boundary"] = process.argv.slice(2);

if (!inputPath || !outputPath) {
  throw new Error("Usage: node scripts/convert-shp-to-geojson.mjs <input.shp> <output.json> [id-prefix]");
}

const buffer = readFileSync(resolve(inputPath));
const shapeType = buffer.readInt32LE(32);

if (![3, 5, 13, 15].includes(shapeType)) {
  throw new Error(`Unsupported shapefile type ${shapeType}. Expected polyline or polygon geometry.`);
}

const records = [];
let offset = 100;

while (offset + 8 <= buffer.length) {
  const recordNumber = buffer.readInt32BE(offset);
  const contentLength = buffer.readInt32BE(offset + 4) * 2;
  const contentOffset = offset + 8;
  const recordType = buffer.readInt32LE(contentOffset);

  if (recordType !== 0) {
    records.push(parseRecord(buffer, contentOffset, contentLength, recordNumber));
  }

  offset = contentOffset + contentLength;
}

const collection = {
  type: "FeatureCollection",
  features: records.map((geometry, index) => ({
    type: "Feature",
    properties: {
      id: `${idPrefix}-${index + 1}`
    },
    geometry
  }))
};

writeFileSync(resolve(outputPath), `${JSON.stringify(collection)}\n`);

function parseRecord(source, start, contentLength, recordNumber) {
  const recordType = source.readInt32LE(start);
  const hasZ = recordType === 13 || recordType === 15;
  const geometryType = recordType === 5 || recordType === 15 ? "Polygon" : "LineString";
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

  if (hasZ) {
    // Z and M ranges follow the XY points. MapLibre only needs longitude/latitude.
  }

  const coordinates = parts.map((startIndex, index) => {
    const endIndex = parts[index + 1] ?? points.length;
    return points.slice(startIndex, endIndex);
  });

  if (geometryType === "LineString") {
    return coordinates.length === 1
      ? { type: "LineString", coordinates: coordinates[0] }
      : { type: "MultiLineString", coordinates };
  }

  return coordinates.length === 1
    ? { type: "Polygon", coordinates }
    : { type: "MultiPolygon", coordinates: coordinates.map((ring) => [ring]) };
}

function round(value) {
  return Number(value.toFixed(6));
}
