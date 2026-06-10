import { HealthPage } from "@/components/HealthPage";
import { createPageMetadata } from "@/app/metadata";

export const metadata = createPageMetadata({
  title: "Health Impact Assessment",
  description:
    "Assess NO2 exposure health burden, high-risk urban populations, seasonal risk patterns, and public health insights across West Africa.",
  path: "/health",
  keywords: ["NO2 health impact", "urban health risk", "air pollution health", "West Africa exposure"]
});

export default function HealthRoute() {
  return <HealthPage />;
}
