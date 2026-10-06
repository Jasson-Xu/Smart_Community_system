import type { ReactNode } from "react";
import Link from "next/link";

export function StaffShell({ eyebrow, title, description, children }: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="resident-page staff-page">
      <header className="resident-header">
        <Link className="brand" href="/staff" aria-label="Smart Community staff dashboard">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span><strong>Smart Community</strong><small>Council operations</small></span>
        </Link>
        <nav aria-label="Staff navigation">
          <Link href="/staff">Dashboard</Link>
          <Link href="/staff/reports">All reports</Link>
          <Link href="/account">Account</Link>
          <Link href="/logout">Sign out</Link>
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
