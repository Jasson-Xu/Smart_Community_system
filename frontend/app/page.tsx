"use client";

import { FormEvent, useState } from "react";

const categories = [
  { name: "Roads & footpaths", detail: "Potholes, cracks and access hazards", mark: "RF" },
  { name: "Street lighting", detail: "Faulty or damaged public lighting", mark: "SL" },
  { name: "Waste & dumping", detail: "Illegal dumping and overflowing bins", mark: "WD" },
  { name: "Parks & facilities", detail: "Playgrounds, signs and shared spaces", mark: "PF" },
];

const updates = [
  { reference: "SC-1042", issue: "Damaged footpath", area: "Oak Street", status: "In progress" },
  { reference: "SC-1038", issue: "Broken streetlight", area: "Riverside Walk", status: "Assigned" },
  { reference: "SC-1029", issue: "Illegal dumping", area: "Market Lane", status: "Resolved" },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [trackingReference, setTrackingReference] = useState("");
  const [trackingMessage, setTrackingMessage] = useState("");

  function openReport() {
    setSubmitted(false);
    setReportOpen(true);
  }

  function submitDemoReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  function trackDemoReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const reference = trackingReference.trim().toUpperCase();
    setTrackingMessage(
      reference
        ? `${reference} is ready for tracking when the secure API is connected.`
        : "Enter the reference number from your confirmation message.",
    );
  }

  return (
    <main>
      <div className="prototype-banner" role="status">
        <span>Prototype preview</span>
        <p>Demonstration data only — please do not submit personal information.</p>
      </div>

      <header className="site-header">
        <a className="brand" href="#top" aria-label="Smart Community home">
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>
            <strong>Smart Community</strong>
            <small>Local issues, clearly managed</small>
          </span>
        </a>

        <nav className={menuOpen ? "primary-nav open" : "primary-nav"} aria-label="Primary navigation">
          <a href="#services" onClick={() => setMenuOpen(false)}>Report issues</a>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
          <a href="#community" onClick={() => setMenuOpen(false)}>Community</a>
          <a className="text-button" href="/login">Sign in</a>
        </nav>

        <button
          className="menu-button"
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
        </button>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Your neighbourhood, looked after</p>
          <h1>A simpler way to make local issues visible.</h1>
          <p className="hero-intro">
            Report a problem in minutes, follow every update, and help council teams respond with the right information from the start.
          </p>
        <div className="hero-actions">
            <button className="button button-primary" type="button" onClick={openReport}>
              Report an issue <span aria-hidden="true">→</span>
            </button>
            <a className="button button-secondary" href="#track">Track a report</a>
          </div>
          <p className="account-prompt">Want to keep all your reports together? <a href="/register">Create a resident account</a></p>
          <div className="hero-assurance" aria-label="Service highlights">
            <span>Accessible on any device</span>
            <span>Clear status updates</span>
            <span>Privacy by design</span>
          </div>
        </div>

        <div className="hero-visual" aria-label="Example issue progress">
          <div className="map-grid" aria-hidden="true">
            <span className="route route-one" />
            <span className="route route-two" />
            <span className="map-pin pin-one"><i>1</i></span>
            <span className="map-pin pin-two"><i>2</i></span>
            <span className="map-pin pin-three"><i>3</i></span>
          </div>
          <article className="progress-card">
            <div className="progress-card-head">
              <span className="reference">SC-1042</span>
              <span className="status-pill">In progress</span>
            </div>
            <h2>Damaged footpath</h2>
            <p>Oak Street · reported today</p>
            <ol className="timeline">
              <li className="complete"><span>Report received</span><small>9:12 am</small></li>
              <li className="complete"><span>Reviewed by council</span><small>10:35 am</small></li>
              <li className="current"><span>Repair team assigned</span><small>In progress</small></li>
              <li><span>Issue resolved</span><small>Next step</small></li>
            </ol>
          </article>
          <div className="response-note">
            <strong>24 hrs</strong>
            <span>average first response</span>
          </div>
        </div>
      </section>

      <section className="category-section" id="services">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Start with the issue</p>
            <h2>What would you like to report?</h2>
          </div>
          <button className="link-button" type="button" onClick={openReport}>View all categories →</button>
        </div>
        <div className="category-grid">
          {categories.map((category) => (
            <button className="category-card" type="button" key={category.name} onClick={openReport}>
              <span className="category-mark" aria-hidden="true">{category.mark}</span>
              <span>
                <strong>{category.name}</strong>
                <small>{category.detail}</small>
              </span>
              <b aria-hidden="true">↗</b>
            </button>
          ))}
        </div>
      </section>

      <section className="steps-section" id="how-it-works">
        <div className="steps-intro">
          <p className="eyebrow">Designed to be straightforward</p>
          <h2>Three steps from concern to action.</h2>
          <p>Each report creates a clear, shared record so residents and council teams know what happens next.</p>
        </div>
        <div className="steps-list">
          <article>
            <span>01</span>
            <div><h3>Tell us what happened</h3><p>Choose a category and add the details, location, and an optional photograph.</p></div>
          </article>
          <article>
            <span>02</span>
            <div><h3>We route it correctly</h3><p>Council staff validate, prioritise, and assign your report to the right team.</p></div>
          </article>
          <article>
            <span>03</span>
            <div><h3>Follow the progress</h3><p>Use your reference number to see updates from submission through resolution.</p></div>
          </article>
        </div>
      </section>

      <section className="community-section" id="community">
        <div className="community-stats">
          <p className="eyebrow">Community pulse</p>
          <h2>Better information helps local teams act sooner.</h2>
          <p className="preview-label">Illustrative prototype metrics</p>
          <div className="stat-grid">
            <div><strong>86%</strong><span>resolved within target</span></div>
            <div><strong>4.7/5</strong><span>resident feedback</span></div>
            <div><strong>128</strong><span>issues updated this month</span></div>
          </div>
        </div>
        <div className="updates-panel">
          <div className="panel-heading">
            <div><span className="live-dot" /> Recent progress</div>
            <small>Preview data</small>
          </div>
          {updates.map((update) => (
            <article className="update-row" key={update.reference}>
              <span className="update-reference">{update.reference}</span>
              <div><strong>{update.issue}</strong><small>{update.area}</small></div>
              <span className={`update-status ${update.status.toLowerCase().replace(" ", "-")}`}>{update.status}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="track-section" id="track">
        <div>
          <p className="eyebrow">Already submitted?</p>
          <h2>Check your report status.</h2>
          <p>Enter the reference number from your confirmation message.</p>
        </div>
        <form className="track-form" onSubmit={trackDemoReport} noValidate>
          <label htmlFor="tracking-reference">Report reference</label>
          <div>
            <input
              id="tracking-reference"
              value={trackingReference}
              onChange={(event) => setTrackingReference(event.target.value)}
              placeholder="e.g. SC-1042"
            />
            <button className="button button-dark" type="submit">Check status</button>
          </div>
          {trackingMessage && <p className="form-message" role="status">{trackingMessage}</p>}
        </form>
      </section>

      <footer>
        <div className="footer-brand">
          <strong>Smart Community</strong>
          <span>Local issues, clearly managed.</span>
        </div>
        <div className="footer-links">
          <a href="#services">Report an issue</a>
          <a href="#how-it-works">How it works</a>
          <a href="/privacy">Privacy</a>
          <a href="/security">Security</a>
          <a href="/login">Account</a>
        </div>
        <p>Academic prototype · SDG 11: Sustainable Cities and Communities</p>
      </footer>

      {reportOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setReportOpen(false)}>
          <section
            className="report-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="modal-close" type="button" aria-label="Close report form" onClick={() => setReportOpen(false)}>×</button>
            {!submitted ? (
              <>
                <p className="eyebrow">New community report</p>
                <h2 id="report-title">What needs attention?</h2>
                <p className="modal-note">Prototype only. Do not enter personal information or submit a real issue.</p>
                <form className="report-form" onSubmit={submitDemoReport}>
                  <label>Issue category<select required defaultValue=""><option value="" disabled>Select a category</option>{categories.map((category) => <option key={category.name}>{category.name}</option>)}</select></label>
                  <label>Location<input required placeholder="Street or public place" /></label>
                  <label>What happened?<textarea required rows={4} placeholder="Describe the issue and any immediate safety concern" /></label>
                  <button className="button button-primary" type="submit">Review report <span aria-hidden="true">→</span></button>
                </form>
              </>
            ) : (
              <div className="success-state">
                <span aria-hidden="true">✓</span>
                <p className="eyebrow">Prototype complete</p>
                <h2 id="report-title">The reporting flow is ready for the API.</h2>
                <p>No information was saved. The next build stage will connect validation, authentication, and secure persistence.</p>
                <button className="button button-dark" type="button" onClick={() => setReportOpen(false)}>Return home</button>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
