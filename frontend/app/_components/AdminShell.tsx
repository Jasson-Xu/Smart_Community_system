import type { ReactNode } from "react";

export function AdminShell({ eyebrow, title, description, children }: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="resident-page admin-page">
      <header className="resident-header admin-header">
        <a className="brand" href="/admin" aria-label="Smart Community administration">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span><strong>Smart Community</strong><small>Administration</small></span>
        </a>
        <nav aria-label="Administrator navigation">
          <a href="/admin">Dashboard</a>
          <a href="/admin/users">Users</a>
          <a href="/admin/categories">Categories</a>
          <a href="/admin/settings">Settings</a>
          <a href="/admin/audit">Audit</a>
          <a href="/account">Account</a>
        </nav>
      </header>
      <section className="resident-content admin-content">
        <div className="resident-heading"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>
        {children}
      </section>
    </main>
  );
}
