import { BrandedNavbar } from "@/components/BrandedNavbar";
import { ObservatoryProvider } from "@/components/ObservatoryContext";

export default function MapLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="branded-data-page branded-map-page">
      <BrandedNavbar />
      <section className="data-page-shell">
        <ObservatoryProvider>{children}</ObservatoryProvider>
      </section>
    </main>
  );
}
