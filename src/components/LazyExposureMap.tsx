"use client";

import dynamic from "next/dynamic";
import { MapPanelSkeleton } from "@/components/Skeletons";
import type { ExposureMapProps } from "@/components/ExposureMap";

const DeferredExposureMap = dynamic<ExposureMapProps>(
  () => import("@/components/ExposureMap").then((module) => module.ExposureMap),
  {
    ssr: false,
    loading: () => <MapPanelSkeleton />
  }
);

const DeferredCompactExposureMap = dynamic<ExposureMapProps>(
  () => import("@/components/ExposureMap").then((module) => module.ExposureMap),
  {
    ssr: false,
    loading: () => <MapPanelSkeleton compact />
  }
);

export function LazyExposureMap(props: ExposureMapProps) {
  const MapComponent = props.compact ? DeferredCompactExposureMap : DeferredExposureMap;
  return <MapComponent {...props} />;
}
