"use client";

import { useState } from "react";
import { AuthShell } from "../_components/AuthShell";
import { apiFetch } from "../_lib/api";

export default function LogoutPage() {
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function signOut() {
    setBusy(true);
    setMessage("");
    try {
      const response = await apiFetch("/auth/logout", { method: "POST" });
      if (response.ok || response.status === 401) setConfirmed(true);
      else setMessage("Sign out failed. Please try again.");
    } catch {
      setMessage("The account service is unavailable. Please try again later.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell eyebrow="Account session" title={confirmed ? "You are signed out" : "Ready to sign out?"} description={confirmed ? "Your session on this device has ended." : "Signing out will end the secure session on this device."}>
      <div className="logout-card">
        <span className="logout-mark" aria-hidden="true">{confirmed ? "✓" : "↗"}</span>
        {confirmed ? (
          <>
            <h2>Session ended</h2>
            <p>You can sign in again whenever you need to view your account.</p>
            <a className="button button-primary" href="/">Return to homepage</a>
          </>
        ) : (
          <>
            <h2>Confirm sign out</h2>
            <p>Your account will remain available when you sign in again.</p>
            <div className="logout-actions">
              <button className="button button-dark" type="button" onClick={signOut} disabled={busy}>{busy ? "Signing out..." : "Confirm sign out"}</button>
              <a className="button button-secondary" href="/">Keep browsing</a>
            </div>
            {message && <p role="status">{message}</p>}
          </>
        )}
      </div>
      <p className="auth-switch">Need to use another account? <a href="/login">Go to sign in</a></p>
    </AuthShell>
  );
}
