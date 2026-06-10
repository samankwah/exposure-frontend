import { MapExplorer } from "@/components/MapExplorer";
import { createPageMetadata } from "@/app/metadata";

export const metadata = createPageMetadata({
  title: "Interactive Exposure Map",
  description:
    "Explore population-weighted NO2 exposure pixels, city hotspots, and urban population layers across West Africa with the CLeNE interactive map.",
  path: "/map",
  keywords: ["NO2 exposure map", "West Africa map", "urban hotspots", "population weighted exposure"]
});

export default function MapPage() {
  return <MapExplorer />;
}
