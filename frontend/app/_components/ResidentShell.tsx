import type { ReactNode } from "react";
import Link from "next/link";

export function ResidentShell({ eyebrow, title, description, children }: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="resident-page">
      <header className="resident-header">
        <Link className="brand" href="/" aria-label="Smart Community home">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span><strong>Smart Community</strong><small>Resident service</small></span>
        </Link>
        <nav aria-label="Resident navigation">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/reports">My reports</Link>
          <Link href="/reports/new">New report</Link>
          <Link href="/account">Account</Link>
          <Link href="/logout">Sign out</Link>
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
