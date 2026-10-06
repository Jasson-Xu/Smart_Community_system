"use client";

import { useEffect, useState } from "react";
import { ResidentShell } from "../_components/ResidentShell";
import { apiFetch } from "../_lib/api";
import { formatReportDate, type ResidentDashboard } from "../_lib/reporting";

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<ResidentDashboard | null>(null);
  const [status, setStatus] = useState("Loading your dashboard...");
  const [signedOut, setSignedOut] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    apiFetch("/resident/dashboard", { signal: controller.signal }).then(async response => {
      if (response.status === 401) { setSignedOut(true); return; }
      if (response.status === 403) { setStatus("The resident dashboard is available to resident accounts."); return; }
      if (!response.ok) { setStatus("Your dashboard could not be loaded."); return; }
      setDashboard(await response.json() as ResidentDashboard);
      setStatus("");
    }).catch((error: unknown) => {
      if (!(error instanceof DOMException && error.name === "AbortError"))
        setStatus("The reporting service is unavailable.");
    });
    return () => controller.abort();
  }, []);

  const activeReports = dashboard?.statusCounts
    .filter(item => item.code !== "RESOLVED" && item.code !== "CLOSED")
    .reduce((total, item) => total + item.count, 0) ?? 0;

  return (
    <ResidentShell eyebrow="Resident dashboard" title="Your community reports"
      description="See your report activity, current status totals, and most recent submissions.">
      {signedOut ? <div className="empty-state"><h2>Sign in required</h2><p>Sign in to open your resident dashboard.</p><a className="button button-primary" href="/login?next=/dashboard">Sign in</a></div> :
       !dashboard ? <div className="empty-state"><p role="status">{status}</p><a className="button button-secondary" href="/account">Return to account</a></div> : <>
         <section className="dashboard-summary" aria-label="Report summary">
           <article className="summary-card summary-card-primary"><span>Total reports</span><strong>{dashboard.totalReports}</strong><small>Submitted from this account</small></article>
           <article className="summary-card"><span>Active reports</span><strong>{activeReports}</strong><small>Still moving through council review</small></article>
           <article className="summary-card"><span>Completed</span><strong>{dashboard.statusCounts.filter(item => item.code === "RESOLVED" || item.code === "CLOSED").reduce((total, item) => total + item.count, 0)}</strong><small>Resolved or closed</small></article>
         </section>
         <section className="dashboard-panel">
           <div className="panel-heading"><div><p className="eyebrow">Your updates</p><h2>Notifications and feedback</h2></div><a href="/notifications">View notifications →</a></div>
           <p><strong>{dashboard.unreadNotifications}</strong> unread status updates · <strong>{dashboard.feedbackPending}</strong> completed reports awaiting feedback</p>
           {dashboard.feedbackPending > 0 && <a href="/reports">Review completed reports →</a>}
         </section>
         <section className="dashboard-panel">
           <div className="panel-heading"><div><p className="eyebrow">Current workload</p><h2>Reports by status</h2></div><a className="button button-primary" href="/reports/new">New report</a></div>
           <div className="status-count-grid">
             {dashboard.statusCounts.map(item => <a href={`/reports?status=${encodeURIComponent(item.code)}`} className="status-count" key={item.code}><strong>{item.count}</strong><span>{item.name}</span></a>)}
           </div>
         </section>
         <section className="dashboard-panel">
           <div className="panel-heading"><div><p className="eyebrow">Latest activity</p><h2>Recent reports</h2></div><a href="/reports">View all reports →</a></div>
           {dashboard.recentReports.length === 0 ? <div className="dashboard-empty"><p>No reports have been submitted from this account.</p><a className="button button-primary" href="/reports/new">Create your first report</a></div> :
             <div className="reports-list compact-report-list">{dashboard.recentReports.map(report => <a className="report-row" href={`/reports/${report.reference}`} key={report.reference}>
               <span className="report-reference">{report.reference}</span>
               <span><strong>{report.category}</strong><small>{report.location}</small></span>
               <span><b className="status-pill">{report.status}</b><small>{formatReportDate(report.submittedAt)}</small></span>
             </a>)}</div>}
         </section>
       </>}
    </ResidentShell>
  );
}
