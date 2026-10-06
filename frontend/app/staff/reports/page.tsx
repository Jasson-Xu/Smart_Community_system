"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { StaffShell } from "../../_components/StaffShell";
import { apiFetch } from "../../_lib/api";
import { formatReportDate } from "../../_lib/reporting";
import type { StaffReportSummary, StaffUser } from "../../_lib/staff";

const statuses = [["SUBMITTED", "Submitted"], ["UNDER_REVIEW", "Under review"], ["ASSIGNED", "Assigned"], ["IN_PROGRESS", "In progress"], ["RESOLVED", "Resolved"], ["CLOSED", "Closed"]];
const priorities = ["Low", "Normal", "High", "Urgent"];

export default function StaffReportsPage() {
  const [reports, setReports] = useState<StaffReportSummary[] | null>(null);
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [sort, setSort] = useState("newest");
  const [message, setMessage] = useState("");
  const [signedOut, setSignedOut] = useState(false);

  const loadReports = useCallback(async (filters: { q: string; status: string; priority: string; assignedTo: string; sort: string }, signal?: AbortSignal) => {
    setReports(null);
    setMessage("");
    const params = new URLSearchParams();
    if (filters.q.trim()) params.set("q", filters.q.trim());
    if (filters.status) params.set("status", filters.status);
    if (filters.priority) params.set("priority", filters.priority);
    if (filters.assignedTo) params.set("assignedTo", filters.assignedTo);
    if (filters.sort !== "newest") params.set("sort", filters.sort);
    try {
      const response = await apiFetch(`/staff/reports${params.size ? `?${params}` : ""}`, { signal });
      if (response.status === 401) { setSignedOut(true); return; }
      if (response.status === 403) { setMessage("A staff or administrator account is required."); return; }
      if (!response.ok) { setMessage("The report queue could not be loaded."); return; }
      setReports(await response.json() as StaffReportSummary[]);
      window.history.replaceState(null, "", `/staff/reports${params.size ? `?${params}` : ""}`);
    } catch (error: unknown) {
      if (!(error instanceof DOMException && error.name === "AbortError")) setMessage("The reporting service is unavailable.");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams(window.location.search);
    const initial = {
      q: params.get("q") ?? "",
      status: statuses.some(([code]) => code === params.get("status")) ? params.get("status") ?? "" : "",
      priority: priorities.includes(params.get("priority") ?? "") ? params.get("priority") ?? "" : "",
      assignedTo: params.get("assignedTo") ?? "",
      sort: ["newest", "oldest", "priority", "status"].includes(params.get("sort") ?? "") ? params.get("sort")! : "newest",
    };
    setQuery(initial.q); setStatusFilter(initial.status); setPriorityFilter(initial.priority);
    setAssignedTo(initial.assignedTo); setSort(initial.sort);
    void loadReports(initial, controller.signal);
    apiFetch("/staff/users", { signal: controller.signal }).then(async response => {
      if (response.ok) setUsers(await response.json() as StaffUser[]);
    }).catch(() => undefined);
    return () => controller.abort();
  }, [loadReports]);

  function apply(event?: FormEvent) {
    event?.preventDefault();
    void loadReports({ q: query, status: statusFilter, priority: priorityFilter, assignedTo, sort });
  }

  function updateFilter(key: "status" | "priority" | "assignedTo" | "sort", value: string) {
    const next = { q: query, status: statusFilter, priority: priorityFilter, assignedTo, sort, [key]: value };
    if (key === "status") setStatusFilter(value);
    if (key === "priority") setPriorityFilter(value);
    if (key === "assignedTo") setAssignedTo(value);
    if (key === "sort") setSort(value);
    void loadReports(next);
  }

  return (
    <StaffShell eyebrow="Operational queue" title="All reports" description="Search, filter, prioritise, assign, and progress resident reports.">
      {signedOut ? <div className="empty-state"><h2>Sign in required</h2><p>Use a staff or administrator account to continue.</p><Link className="button button-primary" href="/login?next=/staff/reports">Sign in</Link></div> : <>
        <form className="staff-report-filters" onSubmit={apply}>
          <div className="search-control"><label htmlFor="staff-report-search">Search</label><div><input id="staff-report-search" value={query} maxLength={100} onChange={event => setQuery(event.target.value)} placeholder="Reference, location, or description" /><button className="button button-secondary" type="submit">Search</button></div></div>
          <div><label htmlFor="staff-status">Status</label><select id="staff-status" value={statusFilter} onChange={event => updateFilter("status", event.target.value)}><option value="">All statuses</option>{statuses.map(([code, name]) => <option value={code} key={code}>{name}</option>)}</select></div>
          <div><label htmlFor="staff-priority">Priority</label><select id="staff-priority" value={priorityFilter} onChange={event => updateFilter("priority", event.target.value)}><option value="">All priorities</option>{priorities.map(item => <option value={item} key={item}>{item}</option>)}</select></div>
          <div><label htmlFor="staff-assignee">Assignee</label><select id="staff-assignee" value={assignedTo} onChange={event => updateFilter("assignedTo", event.target.value)}><option value="">Anyone</option>{users.map(user => <option value={user.id} key={user.id}>{user.name}</option>)}</select></div>
          <div><label htmlFor="staff-sort">Sort</label><select id="staff-sort" value={sort} onChange={event => updateFilter("sort", event.target.value)}><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="priority">Priority</option><option value="status">Status</option></select></div>
        </form>
        {message ? <div className="empty-state"><h2>Queue unavailable</h2><p role="status">{message}</p></div> : reports === null ? <p className="page-status" role="status">Loading report queue...</p> : reports.length === 0 ? <div className="empty-state"><h2>No matching reports</h2><p>Adjust the search or filters to view other reports.</p></div> : <div className="reports-list">
          <div className="list-toolbar"><p>{reports.length} {reports.length === 1 ? "report" : "reports"}</p></div>
          {reports.map(report => <Link className="report-row staff-report-row" href={`/staff/reports/${report.reference}`} key={report.reference}>
            <span className="report-reference">{report.reference}</span>
            <span><strong>{report.category}</strong><small>{report.location}</small></span>
            <span><b className={`priority-pill priority-${report.priority.toLowerCase()}`}>{report.priority}</b><small>{report.assignedToName ?? "Unassigned"}</small></span>
            <span><b className="status-pill">{report.status}</b><small>{formatReportDate(report.submittedAt)}</small></span>
          </Link>)}
        </div>}
      </>}
    </StaffShell>
  );
}
