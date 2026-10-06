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

  const homeHref = account?.role === "Resident" ? "/dashboard" :
    account?.role === "Administrator" ? "/admin" : account ? "/staff" : "/";

  return (
    <AuthShell eyebrow="Your account" title={account ? `Welcome, ${account.name}` : "Account"}
      description="Your secure Smart Community session." homeHref={homeHref}
      homeLabel={account ? "Back to dashboard" : "Back to home"}>
      <div className="logout-card">
        {account ? (
          <>
            <h2>Account details</h2>
            <p>Email: {account.email}</p>
            <p>Role: {account.role}</p>
            {account.role === "Resident" ? <>
              <p>Create a new community report or review issues already submitted from this account.</p>
              <div className="logout-actions"><a className="button button-primary" href="/dashboard">Dashboard</a><a className="button button-secondary" href="/reports/new">New report</a><a className="button button-secondary" href="/reports">My reports</a></div>
            </> : account.role === "Administrator" ? <>
              <p>Manage users, roles, report categories, approved settings, and administrative audit records.</p>
              <div className="logout-actions"><a className="button button-primary" href="/admin">Administration</a><a className="button button-secondary" href="/staff">Staff dashboard</a></div>
            </> : <>
              <p>Open the council operations workspace to review, prioritise, assign, and progress community reports.</p>
              <div className="logout-actions"><a className="button button-primary" href="/staff">Staff dashboard</a><a className="button button-secondary" href="/staff/reports">Report queue</a></div>
            </>}
            <a className="button button-secondary account-signout" href="/logout">Sign out</a>
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
