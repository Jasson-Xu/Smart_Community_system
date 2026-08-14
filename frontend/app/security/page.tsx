export default function SecurityPage() {
  return (
    <main className="policy-page">
      <a className="policy-back" href="/">← Smart Community</a>
      <header>
        <p className="eyebrow">Responsible development</p>
        <h1>Security is part of the service.</h1>
        <p>The system is being designed so identity, permissions, uploaded photographs, and report history are protected at every boundary.</p>
      </header>
      <section className="policy-notice security-notice">
        <strong>Report vulnerabilities privately</strong>
        <p>Never publish credentials, personal information, or exploit details in a public issue. Use the repository&apos;s private vulnerability reporting channel when available.</p>
      </section>
      <div className="policy-content">
        <section><h2>Access control</h2><p>Authentication identifies the user, while API-enforced role permissions determine whether resident, staff, or administrative actions are allowed.</p></section>
        <section><h2>Secure data handling</h2><p>Production traffic must use HTTPS. Password hashing, protected configuration, parameterised data access, and least-privilege cloud permissions are required.</p></section>
        <section><h2>Photograph safety</h2><p>Uploads must be restricted by file type and size, inspected before use, stored with private permissions, and accessed through authorised, time-limited links where appropriate.</p></section>
        <section><h2>Safe development</h2><p>Developers must use synthetic test data, keep secrets out of Git, review dependencies, and avoid logging tokens, private locations, or unnecessary personal information.</p></section>
      </div>
      <footer className="policy-footer"><a href="/">Return to the homepage</a><span>Latest development version</span></footer>
    </main>
  );
}
