"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { ObservatoryFooter } from "@/components/ObservatoryFooter";

const routeTitles: Record<string, string> = {
  "/": "West Africa Exposure Intelligence",
  "/about": "About the CLeNE Exposure Observatory",
  "/cities": "City Exposure Rankings",
  "/contact": "Contact the CLeNE Team",
  "/health": "Health Impact Assessment",
  "/insights": "Exposure Insights",
  "/map": "Interactive Exposure Map",
  "/trends": "Seasonal Trends"
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const pageTitle = routeTitles[pathname] ?? "West Africa Exposure Intelligence";

  useEffect(() => {
    document.title = `${pageTitle} | CLeNE`;
  }, [pageTitle]);

  return (
    <>
      {children}
      <ObservatoryFooter variant="site" />
    </>
  );
}
