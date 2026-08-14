"use client";

import { useState } from "react";
import { AuthShell } from "../_components/AuthShell";

export default function LogoutPage() {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <AuthShell eyebrow="Account session" title={confirmed ? "Signed-out state complete" : "Ready to sign out?"} description={confirmed ? "The interface is ready to clear a real session when the API is connected." : "Signing out will eventually end the secure session on this device."}>
      <div className="logout-card">
        <span className="logout-mark" aria-hidden="true">{confirmed ? "✓" : "↗"}</span>
        {confirmed ? (
          <>
            <h2>No session was changed</h2>
            <p>This frontend-only demonstration does not currently hold an authenticated session or account information.</p>
            <a className="button button-primary" href="/">Return to homepage</a>
          </>
        ) : (
          <>
            <h2>Frontend confirmation</h2>
            <p>This demonstrates the confirmation step only. No authentication cookie, token, or server session exists yet.</p>
            <div className="logout-actions">
              <button className="button button-dark" type="button" onClick={() => setConfirmed(true)}>Confirm sign out</button>
              <a className="button button-secondary" href="/">Keep browsing</a>
            </div>
          </>
        )}
      </div>
      <p className="auth-switch">Need to use another account? <a href="/login">Go to sign in</a></p>
    </AuthShell>
  );
}
