"use client";

import Link from "next/link";
import { CloudSun, Database, ExternalLink, Mail, Map, ShieldCheck } from "lucide-react";
import { getCityRows, getWebDataYearRange } from "@/data/webData";
import { useBackendWebData } from "@/data/useWebData";

const platformLinks = [
  { href: "/", label: "Home" },
  { href: "/insights", label: "Insights" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" }
];

const explorerLinks = [
  { href: "/map", label: "Interactive Map" },
  { href: "/trends", label: "Trends" },
  { href: "/cities", label: "Cities" },
  { href: "/health", label: "Health" }
];

export function ObservatoryFooter({ variant = "app" }: { variant?: "app" | "site" }) {
  const currentYear = new Date().getFullYear();
  const { version: dataVersion } = useBackendWebData();
  void dataVersion;
  const yearRange = getWebDataYearRange();
  const cityCount = getCityRows("Annual").length;

  return (
    <footer className={`observatory-footer observatory-footer-${variant}`}>
      <div className="footer-main">
        <section className="footer-brand" aria-labelledby="footer-brand-title">
          <Link className="footer-brand-lockup" href="/" aria-label="CLeNE home">
            <span className="footer-brand-mark">
              <CloudSun size={24} aria-hidden />
            </span>
            <span>
              <strong id="footer-brand-title">CLeNE</strong>
              <small>City-Level NO{"\u2082"} Exposure Intelligence</small>
            </span>
          </Link>
          <p>
            Satellite-derived exposure intelligence for West African cities, built to support research, policy, and
            public-health decision making.
          </p>
          <div className="footer-badges" aria-label="Platform status and coverage">
            <span>Beta 1.0</span>
            <span>{yearRange}</span>
            <span>{cityCount} cities</span>
          </div>
        </section>

        <nav className="footer-nav" aria-labelledby="footer-platform-title">
          <h2 id="footer-platform-title">Platform</h2>
          <ul>
            {platformLinks.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="footer-nav footer-nav-wide" aria-labelledby="footer-explore-title">
          <h2 id="footer-explore-title">Explore Data</h2>
          <ul>
            {explorerLinks.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <section className="footer-disclosure" aria-labelledby="footer-data-title">
          <h2 id="footer-data-title">Data Basis</h2>
          <div className="footer-note">
            <Database size={18} aria-hidden />
            <p>Sentinel-5P TROPOMI NO{"\u2082"} columns, NASA Gridded Population 2020, and supporting boundary layers.</p>
          </div>
          <div className="footer-note">
            <ShieldCheck size={18} aria-hidden />
            <p>NO{"\u2082"} columns are not direct surface concentrations, clinical outcomes, or regulatory certification.</p>
          </div>
          <a className="footer-contact-link" href="mailto:cahl@knust.edu.gh">
            <Mail size={17} aria-hidden />
            <span>cahl@knust.edu.gh</span>
          </a>
        </section>
      </div>

      <div className="footer-bottom">
        <p>Copyright {currentYear} Climate and Health Research Lab, KNUST. All rights reserved.</p>
        <div>
          <span>
            <Map size={14} aria-hidden />
            West Africa
          </span>
          <a href="https://www.knust.edu.gh/" rel="noreferrer" target="_blank">
            <span>KNUST</span>
            <ExternalLink size={13} aria-hidden />
          </a>
        </div>
      </div>
    </footer>
  );
}
