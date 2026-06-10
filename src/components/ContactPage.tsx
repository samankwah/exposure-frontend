import { ExternalLink, Mail, MapPin, Send } from "lucide-react";
import { BrandedNavbar } from "@/components/BrandedNavbar";

const inquiryTypes = [
  "Research collaboration",
  "Data or methods question",
  "Policy or public health use",
  "Technical issue",
  "Media or briefing request"
];

export function ContactPage() {
  return (
    <main className="branded-data-page contact-page">
      <BrandedNavbar />

      <section className="data-page-shell contact-dashboard-shell" aria-labelledby="contact-title">
        <div className="data-page-inner contact-dashboard-inner">
          <header className="contact-hero-panel">
            <span className="data-kicker">
              <i aria-hidden />
              Contact
            </span>
            <h1 id="contact-title">Contact the CLeNE Research Team</h1>
            <p>Questions about data, methodology, partnerships, or technical issues can be sent directly to CAHL.</p>
          </header>

          <section className="contact-layout" aria-label="Contact form and details">
            <article className="contact-form-panel">
              <header>
                <h2>Send a Message</h2>
                <p>Your email client will open with the message details.</p>
              </header>

              <form action="mailto:cahl@knust.edu.gh" encType="text/plain" method="post">
                <div className="contact-form-grid">
                  <label>
                    <span>Name</span>
                    <input name="name" placeholder="Your name" required type="text" />
                  </label>
                  <label>
                    <span>Email</span>
                    <input name="email" placeholder="you@example.org" required type="email" />
                  </label>
                </div>

                <div className="contact-form-grid">
                  <label>
                    <span>Organisation</span>
                    <input name="organisation" placeholder="Institution or organisation" type="text" />
                  </label>
                  <label>
                    <span>Inquiry Type</span>
                    <select name="inquiryType" defaultValue="">
                      <option disabled value="">
                        Select one
                      </option>
                      {inquiryTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label>
                  <span>Subject</span>
                  <input name="subject" placeholder="Brief subject" required type="text" />
                </label>

                <label className="contact-message-field">
                  <span>Message</span>
                  <textarea name="message" placeholder="How can the CLeNE team help?" required rows={7} />
                </label>

                <button type="submit">
                  <Send size={14} aria-hidden />
                  Send Email
                </button>
              </form>
            </article>

            <aside className="contact-info-panel" aria-label="Contact details">
              <div>
                <h2>Contact Details</h2>
                <p>Climate and Health Research Lab, KNUST.</p>
              </div>

              <a className="contact-info-link" href="mailto:cahl@knust.edu.gh">
                <Mail size={17} aria-hidden />
                <span>
                  <strong>Email</strong>
                  cahl@knust.edu.gh
                </span>
              </a>

              <a className="contact-info-link" href="https://www.knust.edu.gh/">
                <MapPin size={17} aria-hidden />
                <span>
                  <strong>Location</strong>
                  Kumasi, Ghana
                </span>
                <ExternalLink size={13} aria-hidden />
              </a>

              <div className="contact-note">
                <h3>For faster response</h3>
                <p>Include the page, city or country, season, and intended use when relevant.</p>
              </div>
            </aside>
          </section>
        </div>
      </section>
    </main>
  );
}
