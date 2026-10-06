"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AdminShell } from "../../_components/AdminShell";
import { apiFetch, errorMessage } from "../../_lib/api";
import type { SystemSetting } from "../../_lib/admin";
import { formatReportDate } from "../../_lib/reporting";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSetting[] | null>(null);
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    try {
      const response = await apiFetch("/admin/settings");
      if (!response.ok) { setMessage(response.status === 403 ? "An administrator account is required." : "Settings could not be loaded."); return; }
      setSettings(await response.json() as SystemSetting[]);
    } catch { setMessage("The administration service is unavailable."); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  return <AdminShell eyebrow="Operational configuration" title="System settings" description="Manage the documented public settings approved for browser-based administration.">
    <div className="prototype-note"><strong>Non-sensitive values only</strong><span>Passwords, API keys, tokens, credentials, and connection strings must remain in protected environment configuration.</span></div>
    {message && <p className="operation-message" role="status">{message}</p>}
    {settings === null ? <p className="page-status">Loading settings...</p> : <div className="admin-settings-list">{settings.map(setting => <SettingCard key={setting.key} setting={setting} onUpdated={load} />)}</div>}
  </AdminShell>;
}

function SettingCard({ setting, onUpdated }: { setting: SystemSetting; onUpdated(): Promise<void> }) {
  const [value, setValue] = useState(setting.value); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const response = await apiFetch(`/admin/settings/${encodeURIComponent(setting.key)}`, { method: "PUT", body: JSON.stringify({ value }) });
      if (!response.ok) { setMessage(await errorMessage(response, "Setting could not be updated.")); return; }
      setMessage("Setting updated."); await onUpdated();
    } catch { setMessage("The administration service is unavailable."); } finally { setBusy(false); }
  }
  return <form className="admin-setting-card" onSubmit={save}><div><strong>{setting.key}</strong><span>{setting.description}</span></div>{setting.key === "reports.public_notice" ? <textarea value={value} onChange={event => setValue(event.target.value)} maxLength={1000} rows={4} /> : <input type={setting.key === "service.contact_email" ? "email" : "text"} value={value} onChange={event => setValue(event.target.value)} maxLength={1000} />}<div className="admin-setting-footer"><small>{setting.version > 0 ? `Version ${setting.version} · ${setting.updatedAt ? formatReportDate(setting.updatedAt) : "not updated"}` : "Not configured"}</small><button className="button button-secondary" disabled={busy}>Save setting</button></div>{message && <p className="auth-message" role="status">{message}</p>}</form>;
}
