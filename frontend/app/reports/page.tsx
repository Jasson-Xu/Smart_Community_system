"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ResidentShell } from "../_components/ResidentShell";
import { apiFetch } from "../_lib/api";
import { formatReportDate, type ReportSummary } from "../_lib/reporting";

const reportStatuses = [
  ["SUBMITTED", "Submitted"], ["UNDER_REVIEW", "Under review"], ["ASSIGNED", "Assigned"],
  ["IN_PROGRESS", "In progress"], ["RESOLVED", "Resolved"], ["CLOSED", "Closed"],
];

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportSummary[] | null>(null);
  const [signedOut, setSignedOut] = useState(false);
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState("newest");

  const loadReports = useCallback(async (nextStatus: string, nextSort: string, signal?: AbortSignal) => {
    setReports(null);
    setMessage("");
    const query = new URLSearchParams();
    if (nextStatus) query.set("status", nextStatus);
    if (nextSort !== "newest") query.set("sort", nextSort);
    try {
      const response = await apiFetch(`/reports${query.size ? `?${query}` : ""}`, { signal });
      if (response.status === 401) { setSignedOut(true); return; }
      if (response.status === 403) { setMessage("Reports are available to resident accounts."); return; }
      if (!response.ok) { setMessage("Reports could not be loaded."); return; }
      setReports(await response.json() as ReportSummary[]);
    } catch (error: unknown) {
      if (!(error instanceof DOMException && error.name === "AbortError"))
        setMessage("The reporting service is unavailable.");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams(window.location.search);
    const initialStatus = reportStatuses.some(([code]) => code === params.get("status")) ? params.get("status") ?? "" : "";
    const initialSort = ["newest", "oldest", "status"].includes(params.get("sort") ?? "") ? params.get("sort")! : "newest";
    setStatusFilter(initialStatus);
    setSort(initialSort);
    void loadReports(initialStatus, initialSort, controller.signal);
    return () => controller.abort();
  }, [loadReports]);

  function applyView(nextStatus: string, nextSort: string) {
    setStatusFilter(nextStatus);
    setSort(nextSort);
    const query = new URLSearchParams();
    if (nextStatus) query.set("status", nextStatus);
    if (nextSort !== "newest") query.set("sort", nextSort);
    window.history.replaceState(null, "", `/reports${query.size ? `?${query}` : ""}`);
    void loadReports(nextStatus, nextSort);
  }

  return (
    <ResidentShell eyebrow="Resident reports" title="My reports" description="Filter, sort, and open every issue submitted from this account.">
      {signedOut ? <div className="empty-state"><h2>Sign in required</h2><p>Sign in to see reports connected to your account.</p><Link className="button button-primary" href="/login?next=/reports">Sign in</Link></div> :
       message ? <div className="empty-state"><h2>Reports unavailable</h2><p role="status">{message}</p><Link className="button button-secondary" href="/dashboard">Return to dashboard</Link></div> : <div className="reports-list">
         <div className="report-controls">
           <div><label htmlFor="report-status-filter">Status</label><select id="report-status-filter" value={statusFilter} onChange={event => applyView(event.target.value, sort)}><option value="">All statuses</option>{reportStatuses.map(([code, name]) => <option value={code} key={code}>{name}</option>)}</select></div>
           <div><label htmlFor="report-sort">Sort</label><select id="report-sort" value={sort} onChange={event => applyView(statusFilter, event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="status">Status</option></select></div>
           <Link className="button button-primary" href="/reports/new">New report</Link>
         </div>
         {reports === null ? <p className="page-status" role="status">Loading your reports...</p> : reports.length === 0 ? <div className="empty-state"><h2>No matching reports</h2><p>{statusFilter ? "No reports currently have this status." : "When you submit an issue, its reference and status will appear here."}</p>{statusFilter ? <button className="button button-secondary" type="button" onClick={() => applyView("", sort)}>Clear filter</button> : <Link className="button button-primary" href="/reports/new">Create your first report</Link>}</div> : <>
           <div className="list-toolbar"><p>{reports.length} {reports.length === 1 ? "report" : "reports"}</p></div>
           {reports.map(report => <Link className="report-row" href={`/reports/${report.reference}`} key={report.reference}>
             <span className="report-reference">{report.reference}</span>
             <span><strong>{report.category}</strong><small>{report.location}</small></span>
             <span><b className="status-pill">{report.status}</b><small>{formatReportDate(report.submittedAt)}</small></span>
           </Link>)}</>}
       </div>}
    </ResidentShell>
  );
}
