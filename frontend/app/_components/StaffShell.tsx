import type { ReactNode } from "react";

export function StaffShell({ eyebrow, title, description, children }: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="resident-page staff-page">
      <header className="resident-header">
        <a className="brand" href="/staff" aria-label="Smart Community staff dashboard">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span><strong>Smart Community</strong><small>Council operations</small></span>
        </a>
        <nav aria-label="Staff navigation">
          <a href="/staff">Dashboard</a>
          <a href="/staff/reports">All reports</a>
          <a href="/account">Account</a>
          <a href="/logout">Sign out</a>
        </nav>
      </header>
      <section className="resident-content staff-content">
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
