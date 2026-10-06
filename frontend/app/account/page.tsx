"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
            {account.role === "Resident" ? <>
              <p>Create a new community report or review issues already submitted from this account.</p>
              <div className="logout-actions"><Link className="button button-primary" href="/dashboard">Dashboard</Link><Link className="button button-secondary" href="/reports/new">New report</Link><Link className="button button-secondary" href="/reports">My reports</Link></div>
            </> : account.role === "Administrator" ? <>
              <p>Manage users, roles, report categories, approved settings, and administrative audit records.</p>
              <div className="logout-actions"><Link className="button button-primary" href="/admin">Administration</Link><Link className="button button-secondary" href="/staff">Staff dashboard</Link></div>
            </> : <>
              <p>Open the council operations workspace to review, prioritise, assign, and progress community reports.</p>
              <div className="logout-actions"><Link className="button button-primary" href="/staff">Staff dashboard</Link><Link className="button button-secondary" href="/staff/reports">Report queue</Link></div>
            </>}
            <Link className="button button-secondary account-signout" href="/logout">Sign out</Link>
          </>
        ) : (
          <>
            <p role="status">{status}</p>
            <Link className="button button-primary" href="/login">Sign in</Link>
          </>
        )}
      </div>
    </AuthShell>
  );
}
