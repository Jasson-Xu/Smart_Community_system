"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ResidentShell } from "../_components/ResidentShell";
import { apiFetch } from "../_lib/api";
import { formatReportDate, type ReportNotification } from "../_lib/reporting";

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<ReportNotification[]>([]);
  const [status, setStatus] = useState("Loading notifications...");

  useEffect(() => {
    const controller = new AbortController();
    apiFetch("/resident/notifications", { signal: controller.signal }).then(async response => {
      if (!response.ok) { setStatus(response.status === 401 ? "Sign in to see your notifications." : "Notifications could not be loaded."); return; }
      setItems(await response.json() as ReportNotification[]);
      setStatus("");
    }).catch((error: unknown) => {
      if (!(error instanceof DOMException && error.name === "AbortError")) setStatus("The notification service is unavailable.");
    });
    return () => controller.abort();
  }, []);

  async function markRead(item: ReportNotification) {
    if (item.readAt) return;
    const response = await apiFetch(`/resident/notifications/${item.id}/read`, { method: "PATCH" });
    if (!response.ok) { setStatus("The notification could not be marked as read."); return; }
    const result = await response.json() as { readAt: string };
    setItems(current => current.map(value => value.id === item.id ? { ...value, readAt: result.readAt } : value));
  }

  async function openReport(item: ReportNotification) {
    try { await markRead(item); } catch { setStatus("The notification could not be marked as read."); }
    router.push(`/reports/${item.reference}`);
  }

  return <ResidentShell eyebrow="Report updates" title="Notifications" description="Status changes for reports you submitted.">
    {status && <p role="status">{status}</p>}
    {!status && items.length === 0 && <div className="empty-state"><p>No status updates yet.</p><Link href="/reports">View my reports</Link></div>}
    <div className="reports-list">{items.map(item => <div className="report-row" key={item.id}>
      <span className="report-reference">{item.reference}</span>
      <span><strong>{item.readAt ? "Status updated" : "New status update"}</strong><small>Now {item.status}</small></span>
      <span><small>{formatReportDate(item.createdAt)}</small><button className="button button-secondary" onClick={() => { void openReport(item); }}>View report →</button></span>
      {!item.readAt && <button className="button button-secondary" onClick={() => { void markRead(item).catch(() => setStatus("The notification could not be marked as read.")); }}>Mark read</button>}
    </div>)}</div>
  </ResidentShell>;
}
