"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StaffShell } from "../_components/StaffShell";
import { apiFetch } from "../_lib/api";
import { formatReportDate } from "../_lib/reporting";
import type { StaffDashboard } from "../_lib/staff";

export default function StaffDashboardPage() {
  const [dashboard, setDashboard] = useState<StaffDashboard | null>(null);
  const [status, setStatus] = useState("Loading operations dashboard...");
  const [signedOut, setSignedOut] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    apiFetch("/staff/dashboard", { signal: controller.signal }).then(async response => {
      if (response.status === 401) { setSignedOut(true); return; }
      if (response.status === 403) { setStatus("A staff or administrator account is required."); return; }
      if (!response.ok) { setStatus("The operations dashboard could not be loaded."); return; }
      setDashboard(await response.json() as StaffDashboard);
      setStatus("");
    }).catch((error: unknown) => {
      if (!(error instanceof DOMException && error.name === "AbortError")) setStatus("The reporting service is unavailable.");
    });
    return () => controller.abort();
  }, []);

  return (
    <StaffShell eyebrow="Council operations" title="Staff dashboard"
      description="Review incoming reports, operational workload, urgent issues, and assignments.">
      {signedOut ? <div className="empty-state"><h2>Sign in required</h2><p>Use a staff or administrator account to continue.</p><Link className="button button-primary" href="/login?next=/staff">Sign in</Link></div> :
       !dashboard ? <div className="empty-state"><p role="status">{status}</p><Link className="button button-secondary" href="/account">Return to account</Link></div> : <>
         <section className="dashboard-summary" aria-label="Operational report summary">
           <article className="summary-card summary-card-primary"><span>Open reports</span><strong>{dashboard.totalReports}</strong><small>All reports excluding closed cases</small></article>
           <article className="summary-card"><span>Unassigned</span><strong>{dashboard.unassignedReports}</strong><small>Open reports requiring an owner</small></article>
           <article className="summary-card summary-card-urgent"><span>Urgent</span><strong>{dashboard.urgentReports}</strong><small>Open reports marked for immediate attention</small></article>
         </section>
         <section className="dashboard-panel"><div className="panel-heading"><div><p className="eyebrow">Last 30 days</p><h2>Service activity</h2></div></div>
           <div className="status-count-grid"><div className="status-count"><strong>{dashboard.submittedLast30Days}</strong><span>Reports submitted</span></div><div className="status-count"><strong>{dashboard.resolvedLast30Days}</strong><span>Reports resolved</span></div></div>
         </section>
         <section className="dashboard-panel">
           <div className="panel-heading"><div><p className="eyebrow">Workflow</p><h2>Reports by status</h2></div><Link className="button button-primary" href="/staff/reports">Open report queue</Link></div>
           <div className="status-count-grid">{dashboard.statusCounts.map(item => <Link href={`/staff/reports?status=${encodeURIComponent(item.code)}`} className="status-count" key={item.code}><strong>{item.count}</strong><span>{item.name}</span></Link>)}</div>
         </section>
         <section className="dashboard-panel">
           <div className="panel-heading"><div><p className="eyebrow">Latest submissions</p><h2>Recent reports</h2></div><Link href="/staff/reports">View all reports →</Link></div>
           {dashboard.recentReports.length === 0 ? <p className="comments-empty">No reports have been submitted.</p> : <div className="reports-list">{dashboard.recentReports.map(report => <Link className="report-row staff-report-row" href={`/staff/reports/${report.reference}`} key={report.reference}>
             <span className="report-reference">{report.reference}</span>
             <span><strong>{report.category}</strong><small>{report.location}</small></span>
             <span><b className={`priority-pill priority-${report.priority.toLowerCase()}`}>{report.priority}</b><small>{report.assignedToName ?? "Unassigned"}</small></span>
             <span><b className="status-pill">{report.status}</b><small>{formatReportDate(report.submittedAt)}</small></span>
           </Link>)}</div>}
         </section>
       </>}
    </StaffShell>
  );
}
