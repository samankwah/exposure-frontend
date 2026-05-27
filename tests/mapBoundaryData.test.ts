import { describe, expect, it } from "vitest";
import africaContourMap from "../src/data/africaContourMap.json";

describe("map boundary data", () => {
  it("loads the Africa contour converted from the shapefile", () => {
    expect(africaContourMap.type).toBe("FeatureCollection");
    expect(africaContourMap.features).toHaveLength(1);
    expect(africaContourMap.features[0].geometry.type).toBe("MultiPolygon");
  });

  it("keeps the shapefile in WGS84 longitude and latitude bounds", () => {
    const bounds = getBounds(africaContourMap.features[0].geometry.coordinates);

    expect(bounds.west).toBeLessThanOrEqual(-25);
    expect(bounds.south).toBeLessThanOrEqual(-34);
    expect(bounds.east).toBeGreaterThanOrEqual(63);
    expect(bounds.north).toBeGreaterThanOrEqual(37);
  });
});

function getBounds(coordinates: unknown): { west: number; south: number; east: number; north: number } {
  const bounds = {
    west: Infinity,
    south: Infinity,
    east: -Infinity,
    north: -Infinity
  };

  scanCoordinates(coordinates, bounds);
  return bounds;
}

function scanCoordinates(
  coordinates: unknown,
  bounds: { west: number; south: number; east: number; north: number }
) {
  if (!Array.isArray(coordinates) || coordinates.length === 0) {
    return;
  }

  if (typeof coordinates[0] === "number" && typeof coordinates[1] === "number") {
    const [longitude, latitude] = coordinates as [number, number];
    bounds.west = Math.min(bounds.west, longitude);
    bounds.south = Math.min(bounds.south, latitude);
    bounds.east = Math.max(bounds.east, longitude);
    bounds.north = Math.max(bounds.north, latitude);
    return;
  }

  coordinates.forEach((child) => scanCoordinates(child, bounds));
}
