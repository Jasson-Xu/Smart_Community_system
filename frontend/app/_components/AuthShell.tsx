import type { ReactNode } from "react";

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
        <a className="auth-brand" href="/" aria-label="Smart Community home">
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
              <p>An account will let residents follow progress, receive important updates, add relevant comments, and keep a history of submitted issues.</p>
            </div>
            <ol className="auth-benefits">
              <li><span>01</span><div><strong>One private account</strong><small>Manage your reports from one place.</small></div></li>
              <li><span>02</span><div><strong>Visible progress</strong><small>See each step from review to resolution.</small></div></li>
              <li><span>03</span><div><strong>Privacy by design</strong><small>Only necessary information should be collected.</small></div></li>
            </ol>
            <p className="auth-prototype-label">Frontend prototype · No account data is stored</p>
          </>
        )}
      </section>

      <section className="auth-main">
        <div className="auth-panel">
          <a className="auth-back" href="/">← Back to home</a>
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
