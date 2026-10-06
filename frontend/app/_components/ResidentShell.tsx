import type { ReactNode } from "react";

export function ResidentShell({ eyebrow, title, description, children }: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="resident-page">
      <header className="resident-header">
        <a className="brand" href="/dashboard" aria-label="Smart Community resident dashboard">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span><strong>Smart Community</strong><small>Resident service</small></span>
        </a>
        <nav aria-label="Resident navigation">
          <a href="/dashboard">Dashboard</a>
          <a href="/reports">My reports</a>
          <a href="/notifications">Notifications</a>
          <a href="/reports/new">New report</a>
          <a href="/account">Account</a>
          <a href="/logout">Sign out</a>
        </nav>
      </header>
      <section className="resident-content">
        <div className="resident-heading">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {children}
      </section>
    </main>
  );
}
