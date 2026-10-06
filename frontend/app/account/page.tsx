"use client";

import { useEffect, useState } from "react";
import { AuthShell } from "../_components/AuthShell";
import { apiFetch } from "../_lib/api";

type Account = { id: string; name: string; email: string; role: string };

export default function AccountPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [status, setStatus] = useState("Loading account...");

  useEffect(() => {
    const controller = new AbortController();
    apiFetch("/auth/me", { signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) { setStatus("Please sign in to view your account."); return; }
        if (!response.ok) { setStatus("The account service is unavailable."); return; }
        setAccount(await response.json() as Account);
        setStatus("");
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError"))
          setStatus("The account service is unavailable.");
      });
    return () => controller.abort();
  }, []);

  return (
    <AuthShell eyebrow="Your account" title={account ? `Welcome, ${account.name}` : "Account"}
      description="Your secure Smart Community session.">
      <div className="logout-card">
        {account ? (
          <>
            <h2>Account details</h2>
            <p>Email: {account.email}</p>
            <p>Role: {account.role}</p>
            <p>Report submission and tracking will be connected in the next development stage.</p>
            <a className="button button-secondary" href="/logout">Sign out</a>
          </>
        ) : (
          <>
            <p role="status">{status}</p>
            <a className="button button-primary" href="/login">Sign in</a>
          </>
        )}
      </div>
    </AuthShell>
  );
}
