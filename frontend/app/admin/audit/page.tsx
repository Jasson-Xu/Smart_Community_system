"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminShell } from "../../_components/AdminShell";
import { apiFetch } from "../../_lib/api";
import type { AuditEntry } from "../../_lib/admin";
import { formatReportDate } from "../../_lib/reporting";

export default function AdminAuditPage() {
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  const [action, setAction] = useState(""); const [entityType, setEntityType] = useState(""); const [message, setMessage] = useState("");
  async function load() {
    const params = new URLSearchParams(); if (action.trim()) params.set("action", action.trim()); if (entityType.trim()) params.set("entityType", entityType.trim());
    setEntries(null); setMessage("");
    try {
      const response = await apiFetch(`/admin/audit-logs${params.size ? `?${params}` : ""}`);
      if (!response.ok) { setMessage(response.status === 403 ? "An administrator account is required." : "Audit records could not be loaded."); return; }
      setEntries(await response.json() as AuditEntry[]);
    } catch { setMessage("The administration service is unavailable."); }
  }
  useEffect(() => { void load(); }, []);
  function apply(event: FormEvent) { event.preventDefault(); void load(); }
  return <AdminShell eyebrow="Governance record" title="Audit log" description="Review append-only records for user access, category, and system-setting changes.">
    <form className="admin-filter-bar" onSubmit={apply}><div><label htmlFor="audit-action">Action</label><input id="audit-action" value={action} onChange={event => setAction(event.target.value)} placeholder="user.roles_updated" /></div><div><label htmlFor="audit-entity">Entity type</label><input id="audit-entity" value={entityType} onChange={event => setEntityType(event.target.value)} placeholder="user" /></div><button className="button button-secondary">Apply filters</button></form>
    {message ? <p className="operation-message" role="status">{message}</p> : entries === null ? <p className="page-status">Loading audit records...</p> : entries.length === 0 ? <div className="empty-state"><h2>No matching audit records</h2><p>Administrative changes will appear here.</p></div> : <div className="admin-audit-table">{entries.map(entry => <article key={entry.id}><div><strong>{entry.action}</strong><span>{entry.actorName}</span><time>{formatReportDate(entry.createdAt)}</time></div><p>{entry.entityType} · {entry.entityId}</p><code>{entry.details}</code></article>)}</div>}
  </AdminShell>;
}
