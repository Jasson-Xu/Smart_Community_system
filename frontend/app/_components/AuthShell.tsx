import type { ReactNode } from "react";
import Link from "next/link";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  asideMessage?: string;
  children: ReactNode;
};

export function AuthShell({ eyebrow, title, description, asideMessage, children }: AuthShellProps) {
  return (
    <main className="auth-page">
      <section className="auth-aside">
        <Link className="auth-brand" href="/" aria-label="Smart Community home">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span><strong>Smart Community</strong><small>Local issues, clearly managed</small></span>
        </Link>
        {asideMessage ? (
          <div className="auth-aside-simple">
            <h2>{asideMessage}</h2>
          </div>
        ) : (
          <>
            <div className="auth-aside-copy">
              <p className="eyebrow">A clearer connection</p>
              <h2>Your reports stay connected to you.</h2>
              <p>An account lets residents submit issues, view their reports and status history, and stay connected to future updates.</p>
            </div>
            <ol className="auth-benefits">
              <li><span>01</span><div><strong>One private account</strong><small>Manage your reports from one place.</small></div></li>
              <li><span>02</span><div><strong>Visible progress</strong><small>See each step from review to resolution.</small></div></li>
              <li><span>03</span><div><strong>Privacy by design</strong><small>Only necessary information should be collected.</small></div></li>
            </ol>
            <p className="auth-prototype-label">Development prototype · Use synthetic data only</p>
          </>
        )}
      </section>

      <section className="auth-main">
        <div className="auth-panel">
          <Link className="auth-back" href="/">← Back to home</Link>
          <header>
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p>{description}</p>
          </header>
          {children}
        </div>
      </section>
    </main>
  );
}
