import { describe, expect, it } from "vitest";
import africaContourMap from "../src/data/africaContourMap.json";
import westAfricaBoundary from "../src/data/westAfricaBoundary.json";

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

  it("loads the West Africa country boundary generated from Natural Earth", () => {
    const iso3Codes = westAfricaBoundary.features.map((feature) => feature.properties.iso3);

    expect(westAfricaBoundary.type).toBe("FeatureCollection");
    expect(westAfricaBoundary.features).toHaveLength(15);
    expect(iso3Codes).toContain("SEN");
    expect(iso3Codes).toContain("NGA");
    expect(iso3Codes).not.toContain("CMR");
    expect(westAfricaBoundary.features.every((feature) => feature.properties.source.includes("Natural Earth"))).toBe(true);
  });

  it("keeps the West Africa country boundary inside the app data region", () => {
    const bounds = getBounds(westAfricaBoundary.features.map((feature) => feature.geometry.coordinates));

    expect(bounds.west).toBeLessThanOrEqual(-17);
    expect(bounds.south).toBeLessThanOrEqual(4.5);
    expect(bounds.east).toBeLessThan(17);
    expect(bounds.north).toBeGreaterThanOrEqual(27);
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
