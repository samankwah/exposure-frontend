import {
  AlertTriangle,
  Calculator,
  Database,
  Landmark,
  Mail,
  MapPinned,
  MessageCircle,
  Ruler,
  Send,
  Settings,
  Star,
  Target
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { BrandedNavbar } from "@/components/BrandedNavbar";

const platformBadges = ["Sentinel-5P TROPOMI", "NASA Gridded Population 2020", "2020-2024", "27 Cities", "15 Countries", "KNUST CAHL"];

const dataSources = [
  {
    dataset: "TROPOMI NO2 L3",
    period: "Jan 2020-Dec 2024",
    resolution: "0.01 degree",
    source: "ESA Sentinel-5P / NASA GES DISC",
    use: "NO2 column"
  },
  {
    dataset: "NASA Gridded Population",
    period: "2020 baseline",
    resolution: "0.1 degree",
    source: "NASA / Univ. of Southampton",
    use: "Urban weighting"
  },
  {
    dataset: "Country Boundaries",
    period: "Current",
    resolution: "Vector",
    source: "Natural Earth / geo-countries",
    use: "Masking & display"
  },
  {
    dataset: "Fire Radiative Power",
    period: "2020-2024",
    resolution: "375 m",
    source: "NASA FIRMS VIIRS",
    use: "Fire driver data"
  }
];

const aboutCards: Array<{ body: ReactNode; icon: LucideIcon; title: string }> = [
  {
    body:
      "This platform visualises satellite-derived NO2 column data to estimate urban population exposure across West Africa. It supports researchers, policymakers, and public health practitioners in identifying high-risk areas, seasonal patterns, and city-level burden.",
    icon: Target,
    title: "Purpose & Objectives"
  },
  {
    body: (
      <>
        Developed by the <strong>Climate and Health Research Lab (CAHL)</strong> at KNUST, Kumasi, Ghana. CAHL focuses on climate variability, air quality, and population health across sub-Saharan Africa.
        <br />
        <br />
        Contact: <a href="mailto:cahl@knust.edu.gh">cahl@knust.edu.gh</a>
      </>
    ),
    icon: Landmark,
    title: "Research Group"
  },
  {
    body: (
      <>
        <strong>The Normalised Population-Weighted Exposure Index (NPWEI):</strong>
        <code>PWE = {"\u03a3"}(population {"\u00d7"} NO{"\u2082"}) / {"\u03a3"}(population)</code>
        <span>Urban pixels {"\u2265"}50 people/km{"\u00b2"} only. Normalised 0-100:</span>
        <code>NPWEI = (PWE - min)/(max - min) {"\u00d7"} 100</code>
      </>
    ),
    icon: Ruler,
    title: "NPWEI Definition"
  },
  {
    body:
      "TROPOMI measures tropospheric NO2 columns, not surface concentrations. Results reflect relative exposure differences. Population figures are NASA Gridded Population 2020 estimates. No clinical health outcomes are implied.",
    icon: AlertTriangle,
    title: "Limitations & Disclaimer"
  }
];

const methodologySteps: Array<{ body: string; icon: LucideIcon; title: string }> = [
  {
    body: "Monthly TROPOMI NO2 L3 files downloaded Jan 2020-Dec 2024. NASA Gridded Population 2020 at 0.1 degree clipped to West Africa.",
    icon: Database,
    title: "Data Acquisition"
  },
  {
    body: "Only pixels >=50 people/km2 are included. Latitude-varying cell area is computed to support consistent urban masking.",
    icon: MapPinned,
    title: "Urban Masking"
  },
  {
    body: "NO2 is interpolated onto the population grid. Seasonal means are computed for DJF, JJA, Annual per city and country.",
    icon: Calculator,
    title: "PWE Computation"
  },
  {
    body: "Raw PWE is normalised 0-100 and exported as JSON plus georeferenced PNG tiles for Leaflet.",
    icon: Settings,
    title: "Normalisation"
  }
];

export function AboutPage() {
  return (
    <main className="branded-data-page about-page">
      <BrandedNavbar />

      <section className="data-page-shell about-dashboard-shell" aria-labelledby="about-title">
        <div className="data-page-inner about-dashboard-inner">
          <header className="about-hero-panel">
            <div>
              <span className="data-kicker">
                <i aria-hidden />
                About CLeNE
              </span>
              <h1 id="about-title">CLeNE - West Africa NO{"\u2082"} Exposure Intelligence Platform</h1>
              <p>
                An open-access satellite-derived dashboard tracking population-weighted NO{"\u2082"} exposure across West
                African urban centres from 2020 to 2024. Built by the Climate and Health Research Lab (CAHL) at KNUST,
                Kumasi, Ghana.
              </p>
              <div className="about-badge-row" aria-label="Platform coverage">
                {platformBadges.map((badge) => (
                  <span key={badge}>{badge}</span>
                ))}
              </div>
            </div>
          </header>

          <section className="about-card-grid" aria-label="About CLeNE">
            {aboutCards.map((card) => {
              const Icon = card.icon;
              return (
                <article className="about-info-card" key={card.title}>
                  <Icon size={24} aria-hidden />
                  <h2>{card.title}</h2>
                  <div>{card.body}</div>
                </article>
              );
            })}
          </section>

          <section className="about-method-panel" aria-labelledby="about-method-title">
            <header>
              <Settings size={14} aria-hidden />
              <h2 id="about-method-title">Processing Methodology</h2>
            </header>
            <div className="about-method-grid">
              {methodologySteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <article className="about-method-card" key={step.title}>
                    <span>{index + 1}</span>
                    <Icon size={20} aria-hidden />
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="about-data-panel" aria-labelledby="about-data-title">
            <header>
              <Database size={15} aria-hidden />
              <h2 id="about-data-title">Data Sources</h2>
            </header>
            <div className="about-data-table-wrap">
              <table className="about-data-table">
                <thead>
                  <tr>
                    <th>Dataset</th>
                    <th>Source</th>
                    <th>Resolution</th>
                    <th>Period</th>
                    <th>Use</th>
                  </tr>
                </thead>
                <tbody>
                  {dataSources.map((row) => (
                    <tr key={row.dataset}>
                      <th scope="row">{row.dataset}</th>
                      <td>{row.source}</td>
                      <td>{row.resolution}</td>
                      <td>{row.period}</td>
                      <td>{row.use}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="about-feedback-panel" aria-labelledby="about-feedback-title">
            <header>
              <MessageCircle size={15} aria-hidden />
              <div>
                <h2 id="about-feedback-title">Share Your Feedback</h2>
                <p>Help us improve this platform. Your comments are valuable to the research team at CAHL KNUST.</p>
              </div>
            </header>

            <form action="mailto:cahl@knust.edu.gh" encType="text/plain" method="post">
              <fieldset className="about-rating-field">
                <legend>How would you rate this platform?</legend>
                <div className="about-rating-row">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <label key={rating}>
                      <input name="rating" type="radio" value={rating} />
                      <Star size={28} aria-hidden />
                      <span>{rating} star</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="about-feedback-grid">
                <label>
                  <span>Your name (optional)</span>
                  <input name="name" placeholder="e.g. Dr. Amara Diallo" type="text" />
                </label>
                <label>
                  <span>Affiliation (optional)</span>
                  <input name="affiliation" placeholder="e.g. University of Ghana" type="text" />
                </label>
              </div>

              <fieldset className="about-audience-field">
                <legend>What best describes you?</legend>
                <div>
                  {["Researcher", "Policymaker", "Student", "Health Professional", "General Public"].map((item) => (
                    <label key={item}>
                      <input name="audience" type="radio" value={item} />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="about-comment-field">
                <span>Comments or suggestions</span>
                <textarea name="comments" placeholder="What did you find useful? What could be improved?" rows={4} />
              </label>

              <button type="submit">
                <Send size={14} aria-hidden />
                Submit Feedback
              </button>
              <p className="about-feedback-contact">
                <Mail size={13} aria-hidden />
                Feedback opens your email client and sends to cahl@knust.edu.gh.
              </p>
            </form>
          </section>
        </div>
      </section>
    </main>
  );
}
