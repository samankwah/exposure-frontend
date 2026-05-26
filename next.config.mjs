/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@deck.gl/core",
    "@deck.gl/layers",
    "@deck.gl/react",
    "react-map-gl"
  ]
};

export default nextConfig;
