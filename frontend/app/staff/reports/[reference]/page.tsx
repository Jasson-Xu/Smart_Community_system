"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { StaffShell } from "../../../_components/StaffShell";
import { apiFetch, errorMessage } from "../../../_lib/api";
import { formatReportDate } from "../../../_lib/reporting";
import type { Assignment, DuplicateReview, StaffComment, StaffReportDetail, StaffUser } from "../../../_lib/staff";

const priorities = ["Low", "Normal", "High", "Urgent"];
const nextStatuses: Record<string, { code: string; label: string }> = {
  SUBMITTED: { code: "UNDER_REVIEW", label: "Start review" },
  UNDER_REVIEW: { code: "ASSIGNED", label: "Mark assigned" },
  ASSIGNED: { code: "IN_PROGRESS", label: "Start work" },
  IN_PROGRESS: { code: "RESOLVED", label: "Mark resolved" },
  RESOLVED: { code: "CLOSED", label: "Close report" },
};

export default function StaffReportDetailPage() {
  const params = useParams<{ reference: string }>();
  const reference = decodeURIComponent(params.reference ?? "").toUpperCase();
  const [report, setReport] = useState<StaffReportDetail | null>(null);
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [status, setStatus] = useState("Loading report...");
  const [signedOut, setSignedOut] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [priority, setPriority] = useState("Normal");
  const [assigneeId, setAssigneeId] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [duplicateReference, setDuplicateReference] = useState("");
  const [duplicateNote, setDuplicateNote] = useState("");
  const [busy, setBusy] = useState(false);

  const loadReport = useCallback(async (signal?: AbortSignal) => {
    const response = await apiFetch(`/staff/reports/${encodeURIComponent(reference)}`, { signal });
    if (response.status === 401) { setSignedOut(true); return; }
    if (response.status === 404) { setStatus("This report was not found."); return; }
    if (response.status === 403) { setStatus("A staff or administrator account is required."); return; }
    if (!response.ok) { setStatus("The report could not be loaded."); return; }
    const loaded = await response.json() as StaffReportDetail;
    setReport(loaded);
    setPriority(loaded.priority);
    setAssigneeId(loaded.currentAssignment?.assignedToUserId ?? "");
    setStatus("");
  }, [reference]);

  useEffect(() => {
    if (!reference) return;
    const controller = new AbortController();
    void loadReport(controller.signal).catch(() => setStatus("The reporting service is unavailable."));
    apiFetch("/staff/users", { signal: controller.signal }).then(async response => {
      if (response.ok) setUsers(await response.json() as StaffUser[]);
    }).catch(() => undefined);
    return () => controller.abort();
  }, [loadReport, reference]);

  async function runAction(request: () => Promise<Response>, success: string) {
    setBusy(true); setActionMessage("");
    try {
      const response = await request();
      if (!response.ok) { setActionMessage(await errorMessage(response, "The update could not be saved.")); return false; }
      await loadReport();
      setActionMessage(success);
      return true;
    } catch {
      setActionMessage("The reporting service is unavailable.");
      return false;
    } finally { setBusy(false); }
  }

  async function savePriority(event: FormEvent) {
    event.preventDefault();
    await runAction(() => apiFetch(`/staff/reports/${encodeURIComponent(reference)}/priority`, { method: "PATCH", body: JSON.stringify({ priority }) }), "Priority updated.");
  }

  async function assign(event: FormEvent) {
    event.preventDefault();
    if (!assigneeId) { setActionMessage("Select a staff member."); return; }
    await runAction(() => apiFetch(`/staff/reports/${encodeURIComponent(reference)}/assignments`, { method: "POST", body: JSON.stringify({ assignedToUserId: assigneeId }) }), "Assignment saved.");
  }

  async function progressStatus(event: FormEvent) {
    event.preventDefault();
    if (!report || !nextStatuses[report.statusCode]) return;
    const saved = await runAction(() => apiFetch(`/staff/reports/${encodeURIComponent(reference)}/status`, {
      method: "POST", body: JSON.stringify({ statusCode: nextStatuses[report.statusCode].code, note: statusNote.trim() || null }),
    }), "Status updated.");
    if (saved) setStatusNote("");
  }

  async function addComment(event: FormEvent) {
    event.preventDefault();
    const saved = await runAction(() => apiFetch(`/staff/reports/${encodeURIComponent(reference)}/comments`, { method: "POST", body: JSON.stringify({ body: commentBody.trim() }) }), "Reply added.");
    if (saved) setCommentBody("");
  }

  async function markDuplicate(event: FormEvent) {
    event.preventDefault();
    const saved = await runAction(() => apiFetch(`/staff/reports/${encodeURIComponent(reference)}/duplicates`, {
      method: "POST", body: JSON.stringify({ potentialDuplicateReference: duplicateReference.trim(), note: duplicateNote.trim() || null }),
    }), "Potential duplicate recorded.");
    if (saved) { setDuplicateReference(""); setDuplicateNote(""); }
  }

  const nextStatus = report ? nextStatuses[report.statusCode] : undefined;
  return (
    <StaffShell eyebrow="Report operations" title={report?.reference ?? reference}
      description="Review resident information, assign ownership, progress workflow, and maintain a traceable record.">
      {signedOut ? <div className="empty-state"><h2>Sign in required</h2><p>Use a staff or administrator account to continue.</p><Link className="button button-primary" href={`/login?next=${encodeURIComponent(`/staff/reports/${reference}`)}`}>Sign in</Link></div> : !report ? <div className="empty-state"><p role="status">{status}</p><Link className="button button-secondary" href="/staff/reports">Back to report queue</Link></div> : <>
        {actionMessage && <p className="operation-message" role="status">{actionMessage}</p>}
        <div className="staff-detail-layout">
          <div className="staff-detail-main">
            <section className="report-detail-card">
              <div className="detail-title"><div><p className="eyebrow">{report.category}</p><h2>{report.location}</h2></div><div className="detail-badges"><span className={`priority-pill priority-${report.priority.toLowerCase()}`}>{report.priority}</span><span className="status-pill">{report.status}</span></div></div>
              <dl className="report-facts">
                <div><dt>Resident</dt><dd>{report.residentName}<br />{report.residentEmail}</dd></div>
                <div><dt>Submitted</dt><dd>{formatReportDate(report.submittedAt)}</dd></div>
                <div><dt>Current assignee</dt><dd>{report.currentAssignment?.assignedToName ?? "Unassigned"}</dd></div>
                <div><dt>Map coordinates</dt><dd>{report.latitude !== null && report.longitude !== null ? <a className="map-link" href={`https://www.google.com/maps/search/?api=1&query=${report.latitude},${report.longitude}`} target="_blank" rel="noreferrer">Open location ↗</a> : "Not selected"}</dd></div>
                <div className="fact-wide"><dt>Description</dt><dd>{report.description}</dd></div>
              </dl>
            </section>
            <section className="operations-card">
              <div><p className="eyebrow">Workflow controls</p><h2>Manage report</h2></div>
              <div className="operation-grid">
                <form onSubmit={savePriority}><label htmlFor="report-priority">Priority</label><select id="report-priority" value={priority} onChange={event => setPriority(event.target.value)}>{priorities.map(item => <option key={item}>{item}</option>)}</select><button className="button button-secondary" disabled={busy}>Save priority</button></form>
                <form onSubmit={assign}><label htmlFor="report-assignee">Assign to</label><select id="report-assignee" value={assigneeId} onChange={event => setAssigneeId(event.target.value)}><option value="">Select staff member</option>{users.map(user => <option value={user.id} key={user.id}>{user.name} · {user.role}</option>)}</select><button className="button button-secondary" disabled={busy}>Save assignment</button></form>
              </div>
              {nextStatus ? <form className="status-action" onSubmit={progressStatus}><label htmlFor="status-note">Progress report to {nextStatus.label.replace(/^\w/, value => value.toLowerCase())}</label><textarea id="status-note" value={statusNote} onChange={event => setStatusNote(event.target.value)} maxLength={500} rows={3} placeholder="Optional public status note" /><button className="button button-primary" disabled={busy}>{nextStatus.label}</button></form> : <p className="comments-empty">This report has reached the end of the current workflow.</p>}
            </section>
            <StaffComments comments={report.comments} body={commentBody} busy={busy} onBodyChange={setCommentBody} onSubmit={addComment} />
            <section className="operations-card">
              <div><p className="eyebrow">Duplicate review</p><h2>Potential duplicates</h2></div>
              {report.duplicates.length > 0 && <ul className="operation-history">{report.duplicates.map(item => <DuplicateItem key={item.id} item={item} />)}</ul>}
              <form className="duplicate-form" onSubmit={markDuplicate}><label htmlFor="duplicate-reference">Related report reference</label><input id="duplicate-reference" value={duplicateReference} onChange={event => setDuplicateReference(event.target.value)} placeholder="SC-2026-..." required /><label htmlFor="duplicate-note">Review note</label><textarea id="duplicate-note" value={duplicateNote} onChange={event => setDuplicateNote(event.target.value)} maxLength={500} rows={3} /><button className="button button-secondary" disabled={busy}>Record potential duplicate</button></form>
            </section>
          </div>
          <aside className="staff-detail-side">
            <section className="history-card"><h2>Status history</h2><ol>{report.history.map((entry, index) => <li key={`${entry.changedAt}-${index}`}><span aria-hidden="true" /><div><strong>{entry.status}</strong><small>{formatReportDate(entry.changedAt)} · {entry.changedByName}</small>{entry.note && <p>{entry.note}</p>}</div></li>)}</ol></section>
            <section className="history-card"><h2>Assignment history</h2>{report.assignments.length === 0 ? <p className="comments-empty">Not assigned yet.</p> : <ul className="operation-history">{report.assignments.map(item => <AssignmentItem key={item.id} item={item} />)}</ul>}</section>
          </aside>
        </div>
      </>}
    </StaffShell>
  );
}

function StaffComments({ comments, body, busy, onBodyChange, onSubmit }: { comments: StaffComment[]; body: string; busy: boolean; onBodyChange(value: string): void; onSubmit(event: FormEvent): void }) {
  return <section className="comments-card"><div className="comments-heading"><div><p className="eyebrow">Resident conversation</p><h2>Comments</h2></div><span>{comments.length}</span></div>{comments.length === 0 ? <p className="comments-empty">No comments yet.</p> : <ol className="comments-list">{comments.map(comment => <li key={comment.id}><div><strong>{comment.authorName} · {comment.authorRole}</strong><time>{formatReportDate(comment.createdAt)}</time></div><p>{comment.body}</p></li>)}</ol>}<form className="comment-form" onSubmit={onSubmit}><label htmlFor="staff-comment">Reply to resident</label><textarea id="staff-comment" value={body} onChange={event => onBodyChange(event.target.value)} minLength={2} maxLength={1000} rows={4} required /><div><small>{body.length}/1000 characters</small><button className="button button-primary" disabled={busy}>Add reply</button></div></form></section>;
}

function AssignmentItem({ item }: { item: Assignment }) {
  return <li><strong>{item.assignedToName}</strong><small>{formatReportDate(item.assignedAt)} · assigned by {item.assignedByName}</small></li>;
}

function DuplicateItem({ item }: { item: DuplicateReview }) {
  return <li><Link href={`/staff/reports/${item.potentialDuplicateReference}`}>{item.potentialDuplicateReference}</Link><small>{formatReportDate(item.createdAt)} · {item.markedByName}</small>{item.note && <p>{item.note}</p>}</li>;
}
