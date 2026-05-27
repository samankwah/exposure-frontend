"use client";

import { Layers, Mail, ShieldCheck } from "lucide-react";

export function ObservatoryFooter() {
  return (
    <footer className="observatory-footer">
      <section>
        <Layers size={28} aria-hidden />
        <div>
          <h2>About the Data</h2>
          <p>Sentinel-5P TROPOMI Level-2 Tropospheric Column Density (OFFL) QA-filtered.</p>
        </div>
      </section>
      <section>
        <ShieldCheck size={28} aria-hidden />
        <h2>Important Note</h2>
        <p>Satellite NO{"\u2082"} column represents total atmospheric NO{"\u2082"} and is not a direct surface concentration.</p>
      </section>
      <section>
        <Mail size={28} aria-hidden />
        <h2>Contact</h2>
        <p>westafrica.no2.observatory@gmail.com</p>
      </section>
    </footer>
  );
}
