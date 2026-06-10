import { CitiesPage } from "@/components/CitiesPage";
import { createPageMetadata } from "@/app/metadata";

export const metadata = createPageMetadata({
  title: "City Exposure Rankings",
  description:
    "Compare population-weighted NO2 exposure, NPWEI scores, risk tiers, and urban population burden across West African cities.",
  path: "/cities",
  keywords: ["NO2 city rankings", "NPWEI city scores", "West Africa cities", "urban exposure"]
});

export default function CitiesRoute() {
  return <CitiesPage />;
}
