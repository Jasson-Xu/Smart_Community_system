import type { ReactNode } from "react";
import Link from "next/link";

export function AdminShell({ eyebrow, title, description, children }: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="resident-page admin-page">
      <header className="resident-header admin-header">
        <Link className="brand" href="/admin" aria-label="Smart Community administration">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span><strong>Smart Community</strong><small>Administration</small></span>
        </Link>
        <nav aria-label="Administrator navigation">
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/users">Users</Link>
          <Link href="/admin/categories">Categories</Link>
          <Link href="/admin/settings">Settings</Link>
          <Link href="/admin/audit">Audit</Link>
          <Link href="/account">Account</Link>
        </nav>
      </header>
      <section className="resident-content admin-content">
        <div className="resident-heading"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>
        {children}
      </section>
    </main>
  );
}
