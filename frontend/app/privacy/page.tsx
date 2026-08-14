export default function PrivacyPage() {
  return (
    <main className="policy-page">
      <a className="policy-back" href="/">← Smart Community</a>
      <header>
        <p className="eyebrow">Public information</p>
        <h1>Privacy at Smart Community</h1>
        <p>This academic prototype is designed to minimise collection and protect the details residents share when reporting a local issue.</p>
      </header>
      <section className="policy-notice">
        <strong>Prototype only</strong>
        <p>No production service operator or privacy contact has been appointed. Do not submit real personal information until those details and an operational retention schedule are published.</p>
      </section>
      <div className="policy-content">
        <section><h2>Information the service may use</h2><p>Account details, report descriptions, locations, photographs, comments, status activity, feedback, and security logs may be needed to provide and protect the reporting service.</p></section>
        <section><h2>How it supports your report</h2><p>Information is used to validate, route, assign, resolve, and communicate about community reports. Personal information must not be sold or used for unrelated advertising.</p></section>
        <section><h2>Public visibility</h2><p>Personal account details must not appear publicly. Precise locations, photographs, and descriptions should be generalised or withheld when they could identify a person, home, vehicle, or sensitive place.</p></section>
        <section><h2>Storage and service providers</h2><p>The proposed architecture uses Amazon EC2, RDS for PostgreSQL, and S3. A real operator must confirm the hosting region, access controls, contracts, and cross-border disclosure requirements before launch.</p></section>
        <section><h2>Retention and your choices</h2><p>Production retention periods are not yet defined. A deployed service must provide private ways to request access, correction, or deletion where applicable and retain information only for a documented purpose.</p></section>
        <section><h2>Questions or incidents</h2><p>Do not post personal information in a public GitHub issue. A private privacy contact and incident-response process must be published before the prototype accepts real reports.</p></section>
      </div>
      <footer className="policy-footer"><a href="/">Return to the homepage</a><span>Effective 14 August 2026</span></footer>
    </main>
  );
}
