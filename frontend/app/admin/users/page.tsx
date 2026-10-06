"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AdminShell } from "../../_components/AdminShell";
import { apiFetch, errorMessage } from "../../_lib/api";
import type { AdminRole, AdminUser } from "../../_lib/admin";
import { formatReportDate } from "../../_lib/reporting";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [message, setMessage] = useState("");

  const loadUsers = useCallback(async () => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (roleFilter) params.set("role", roleFilter);
    if (activeFilter) params.set("active", activeFilter);
    setUsers(null); setMessage("");
    try {
      const response = await apiFetch(`/admin/users${params.size ? `?${params}` : ""}`);
      if (!response.ok) { setMessage(response.status === 403 ? "An administrator account is required." : "Users could not be loaded."); return; }
      setUsers(await response.json() as AdminUser[]);
    } catch { setMessage("The administration service is unavailable."); }
  }, [activeFilter, query, roleFilter]);

  useEffect(() => {
    void loadUsers();
    apiFetch("/admin/roles").then(async response => { if (response.ok) setRoles(await response.json() as AdminRole[]); }).catch(() => undefined);
  }, [loadUsers]);

  return <AdminShell eyebrow="Identity administration" title="Users and roles"
    description="Search accounts, control access, and assign the roles used by API authorisation.">
    <form className="admin-filter-bar" onSubmit={(event) => { event.preventDefault(); void loadUsers(); }}>
      <div><label htmlFor="admin-user-search">Search</label><input id="admin-user-search" value={query} onChange={event => setQuery(event.target.value)} maxLength={100} placeholder="Name or email" /></div>
      <div><label htmlFor="admin-role-filter">Role</label><select id="admin-role-filter" value={roleFilter} onChange={event => setRoleFilter(event.target.value)}><option value="">All roles</option>{roles.map(role => <option key={role.name}>{role.name}</option>)}</select></div>
      <div><label htmlFor="admin-active-filter">Account status</label><select id="admin-active-filter" value={activeFilter} onChange={event => setActiveFilter(event.target.value)}><option value="">All accounts</option><option value="true">Active</option><option value="false">Inactive</option></select></div>
      <button className="button button-secondary" type="submit">Apply filters</button>
    </form>
    {message ? <div className="empty-state"><p role="status">{message}</p><a className="button button-secondary" href="/admin">Dashboard</a></div> : users === null ? <p className="page-status" role="status">Loading users...</p> : <div className="admin-user-list">{users.map(user => <UserCard key={user.id} user={user} availableRoles={roles} onUpdated={loadUsers} />)}</div>}
  </AdminShell>;
}

function UserCard({ user, availableRoles, onUpdated }: { user: AdminUser; availableRoles: AdminRole[]; onUpdated(): Promise<void> }) {
  const [selectedRoles, setSelectedRoles] = useState(user.roles);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function saveRoles() {
    setBusy(true); setMessage("");
    try {
      const response = await apiFetch(`/admin/users/${user.id}/roles`, { method: "PUT", body: JSON.stringify({ roles: selectedRoles }) });
      if (!response.ok) { setMessage(await errorMessage(response, "Roles could not be updated.")); return; }
      setMessage("Roles updated. Existing sessions will be revalidated."); await onUpdated();
    } catch { setMessage("The administration service is unavailable."); } finally { setBusy(false); }
  }

  async function toggleStatus() {
    setBusy(true); setMessage("");
    try {
      const response = await apiFetch(`/admin/users/${user.id}/status`, { method: "PATCH", body: JSON.stringify({ isActive: !user.isActive }) });
      if (!response.ok) { setMessage(await errorMessage(response, "Account status could not be updated.")); return; }
      setMessage(user.isActive ? "Account deactivated." : "Account activated."); await onUpdated();
    } catch { setMessage("The administration service is unavailable."); } finally { setBusy(false); }
  }

  function changeRole(role: string, checked: boolean) {
    setSelectedRoles(current => checked ? [...new Set([...current, role])] : current.filter(item => item !== role));
  }

  return <article className={`admin-user-card ${user.isActive ? "" : "is-inactive"}`}>
    <div className="admin-user-identity"><div><strong>{user.name}</strong><span>{user.email}</span></div><b>{user.isActive ? "Active" : "Inactive"}</b></div>
    <small>Created {formatReportDate(user.createdAt)}</small>
    <fieldset><legend>Roles</legend>{availableRoles.map(role => <label key={role.name}><input type="checkbox" checked={selectedRoles.includes(role.name)} onChange={event => changeRole(role.name, event.target.checked)} /> <span><strong>{role.name}</strong><small>{role.description}</small></span></label>)}</fieldset>
    <div className="admin-row-actions"><button className="button button-secondary" type="button" onClick={saveRoles} disabled={busy}>Save roles</button><button className="button button-secondary" type="button" onClick={toggleStatus} disabled={busy}>{user.isActive ? "Deactivate" : "Activate"}</button></div>
    {message && <p className="auth-message" role="status">{message}</p>}
  </article>;
}
