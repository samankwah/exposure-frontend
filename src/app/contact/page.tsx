import { ContactPage } from "@/components/ContactPage";
import { createPageMetadata } from "@/app/metadata";

export const metadata = createPageMetadata({
  title: "Contact the CLeNE Team",
  description:
    "Contact the CLeNE team for NO2 exposure data questions, methodology support, collaboration, and West Africa air quality research enquiries.",
  path: "/contact",
  keywords: ["contact CLeNE", "NO2 research support", "air quality collaboration"]
});

export default function ContactRoute() {
  return <ContactPage />;
}
