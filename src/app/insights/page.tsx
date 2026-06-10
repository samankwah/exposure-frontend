import { InsightsDetailPage } from "@/components/InsightsDetailPage";
import { createPageMetadata } from "@/app/metadata";

export const metadata = createPageMetadata({
  title: "Exposure Insights",
  description:
    "Read CLeNE insights on TROPOMI NO2 patterns, dry-season exposure, urban hotspots, and policy-relevant air quality findings.",
  path: "/insights",
  keywords: ["NO2 insights", "air quality research", "TROPOMI insights", "West Africa policy"]
});

export default function InsightsRoute() {
  return <InsightsDetailPage />;
}
