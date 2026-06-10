import { AboutPage } from "@/components/AboutPage";
import { createPageMetadata } from "@/app/metadata";

export const metadata = createPageMetadata({
  title: "About the CLeNE Exposure Observatory",
  description:
    "Learn how CLeNE combines TROPOMI NO2 observations, GPW population data, and NPWEI methods to assess urban exposure across West Africa.",
  path: "/about",
  keywords: ["CLeNE methodology", "NPWEI", "TROPOMI NO2", "GPW population"]
});

export default function AboutRoute() {
  return <AboutPage />;
}
