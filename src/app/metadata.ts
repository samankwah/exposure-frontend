import type { Metadata } from "next";

const SITE_NAME = "CLeNE";
const SITE_TITLE = "West Africa Exposure Intelligence | CLeNE";
const SITE_DESCRIPTION =
  "Explore population-weighted NO2 exposure, city risk rankings, seasonal trends, and health impact intelligence for West Africa.";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://clene.no2-exposure.app";

type PageMetadataOptions = {
  description: string;
  keywords?: string[];
  noIndex?: boolean;
  path: string;
  title: string;
};

export const rootMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "CLeNE",
    "NO2 exposure",
    "West Africa air quality",
    "TROPOMI NO2",
    "population weighted exposure",
    "urban health risk",
    "NPWEI"
  ],
  authors: [{ name: "CLeNE Research Team" }],
  creator: "CLeNE",
  publisher: "CLeNE",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  }
};

export function createPageMetadata({
  description,
  keywords = [],
  noIndex = false,
  path,
  title
}: PageMetadataOptions): Metadata {
  const canonicalPath = path.startsWith("/") ? path : `/${path}`;
  const fullTitle = `${title} | ${SITE_NAME}`;

  return {
    title: {
      absolute: fullTitle
    },
    description,
    keywords: [
      ...keywords,
      "CLeNE",
      "NO2 exposure",
      "West Africa",
      "air quality intelligence"
    ],
    alternates: {
      canonical: canonicalPath
    },
    openGraph: {
      type: "website",
      url: canonicalPath,
      siteName: SITE_NAME,
      title: fullTitle,
      description
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false
          }
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1
          }
        }
  };
}
