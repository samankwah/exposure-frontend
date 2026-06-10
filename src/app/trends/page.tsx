import { TrendsPage } from "@/components/TrendsPage";
import { createPageMetadata } from "@/app/metadata";

export const metadata = createPageMetadata({
  title: "Seasonal Trends",
  description:
    "Track annual, monthly, DJF, and JJA NO2 exposure trends for West African countries and cities using CLeNE analytics.",
  path: "/trends",
  keywords: ["NO2 trends", "seasonal air quality", "DJF NO2", "JJA NO2", "West Africa trends"]
});

export default function TrendsRoute() {
  return <TrendsPage />;
}
