import type { ReactNode } from "react";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  asideMessage?: string;
  homeHref?: string;
  homeLabel?: string;
  children: ReactNode;
};

export function AuthShell({ eyebrow, title, description, asideMessage, homeHref = "/", homeLabel = "Back to home", children }: AuthShellProps) {
  return (
    <main className="auth-page">
      <section className="auth-aside">
        <a className="auth-brand" href={homeHref} aria-label={homeHref === "/" ? "Smart Community home" : "Smart Community dashboard"}>
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span><strong>Smart Community</strong><small>Local issues, clearly managed</small></span>
        </a>
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
          <a className="auth-back" href={homeHref}>← {homeLabel}</a>
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
