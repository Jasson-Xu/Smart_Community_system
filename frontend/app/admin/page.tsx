"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "../_components/AdminShell";
import { apiFetch } from "../_lib/api";
import type { AdminDashboard } from "../_lib/admin";
import { formatReportDate } from "../_lib/reporting";

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [status, setStatus] = useState("Loading administration dashboard...");
  const [signedOut, setSignedOut] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    apiFetch("/admin/dashboard", { signal: controller.signal }).then(async response => {
      if (response.status === 401) { setSignedOut(true); return; }
      if (response.status === 403) { setStatus("An administrator account is required."); return; }
      if (!response.ok) { setStatus("The administration dashboard could not be loaded."); return; }
      setDashboard(await response.json() as AdminDashboard); setStatus("");
    }).catch((error: unknown) => {
      if (!(error instanceof DOMException && error.name === "AbortError")) setStatus("The administration service is unavailable.");
    });
    return () => controller.abort();
  }, []);

  return <AdminShell eyebrow="System governance" title="Administration"
    description="Manage access, report categories, approved settings, and traceable administrative activity.">
    {signedOut ? <div className="empty-state"><h2>Sign in required</h2><p>Use an administrator account to continue.</p><Link className="button button-primary" href="/login?next=/admin">Sign in</Link></div> : !dashboard ? <div className="empty-state"><p role="status">{status}</p><Link className="button button-secondary" href="/account">Return to account</Link></div> : <>
      <section className="dashboard-summary admin-summary" aria-label="Administration summary">
        <article className="summary-card summary-card-primary"><span>Active users</span><strong>{dashboard.activeUsers}</strong><small>{dashboard.totalUsers} accounts in total</small></article>
        <article className="summary-card"><span>Inactive users</span><strong>{dashboard.inactiveUsers}</strong><small>Accounts blocked from signing in</small></article>
        <article className="summary-card"><span>Active categories</span><strong>{dashboard.activeCategories}</strong><small>Available on the resident form</small></article>
      </section>
      <section className="dashboard-panel"><div className="panel-heading"><div><p className="eyebrow">Access</p><h2>Active users by role</h2></div><Link className="button button-primary" href="/admin/users">Manage users</Link></div><div className="status-count-grid">{dashboard.roleCounts.map(item => <div className="status-count" key={item.name}><strong>{item.count}</strong><span>{item.name}</span></div>)}</div></section>
      <section className="dashboard-panel"><div className="panel-heading"><div><p className="eyebrow">Traceability</p><h2>Recent administrative activity</h2></div><Link href="/admin/audit">View audit log →</Link></div>{dashboard.recentAudits.length === 0 ? <p className="comments-empty">No administrative changes have been recorded yet.</p> : <ul className="admin-audit-list">{dashboard.recentAudits.map(entry => <li key={entry.id}><strong>{entry.action}</strong><span>{entry.actorName} · {entry.entityType}</span><time>{formatReportDate(entry.createdAt)}</time></li>)}</ul>}</section>
    </>}
  </AdminShell>;
}
