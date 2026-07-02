import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    webpackBuildWorker: false
  },
  outputFileTracingRoot: projectRoot,
  transpilePackages: [
    "@deck.gl/core",
    "@deck.gl/geo-layers",
    "@deck.gl/layers",
    "@deck.gl/react",
    "maplibre-gl",
    "react-map-gl"
  ]
};

export default nextConfig;
