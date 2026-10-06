"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AdminShell } from "../../_components/AdminShell";
import { apiFetch, errorMessage } from "../../_lib/api";
import type { AdminCategory } from "../../_lib/admin";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[] | null>(null);
  const [message, setMessage] = useState("");
  const [slug, setSlug] = useState(""); const [name, setName] = useState("");
  const [description, setDescription] = useState(""); const [sortOrder, setSortOrder] = useState("50");

  const load = useCallback(async () => {
    try {
      const response = await apiFetch("/admin/categories");
      if (!response.ok) { setMessage(response.status === 403 ? "An administrator account is required." : "Categories could not be loaded."); return; }
      setCategories(await response.json() as AdminCategory[]);
    } catch { setMessage("The administration service is unavailable."); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function createCategory(event: FormEvent) {
    event.preventDefault(); setMessage("");
    try {
      const response = await apiFetch("/admin/categories", { method: "POST", body: JSON.stringify({ slug, name, description, sortOrder: Number(sortOrder), isActive: true }) });
      if (!response.ok) { setMessage(await errorMessage(response, "Category could not be created.")); return; }
      setSlug(""); setName(""); setDescription(""); setSortOrder("50"); setMessage("Category created."); await load();
    } catch { setMessage("The administration service is unavailable."); }
  }

  return <AdminShell eyebrow="Report configuration" title="Issue categories" description="Control the categories available on the resident report form without deleting historical links.">
    <section className="admin-create-card"><div><p className="eyebrow">New category</p><h2>Add an issue category</h2></div><form className="admin-category-form" onSubmit={createCategory}><label htmlFor="category-slug">Slug</label><input id="category-slug" value={slug} onChange={event => setSlug(event.target.value.toLowerCase())} placeholder="tree-maintenance" required /><label htmlFor="category-name">Name</label><input id="category-name" value={name} onChange={event => setName(event.target.value)} required /><label htmlFor="category-description">Description</label><textarea id="category-description" value={description} onChange={event => setDescription(event.target.value)} maxLength={240} rows={3} required /><label htmlFor="category-order">Sort order</label><input id="category-order" type="number" min={0} max={10000} value={sortOrder} onChange={event => setSortOrder(event.target.value)} required /><button className="button button-primary">Create category</button></form>{message && <p className="auth-message" role="status">{message}</p>}</section>
    {categories === null ? <p className="page-status">Loading categories...</p> : <div className="admin-category-list">{categories.map(category => <CategoryCard key={category.id} category={category} onUpdated={load} />)}</div>}
  </AdminShell>;
}

function CategoryCard({ category, onUpdated }: { category: AdminCategory; onUpdated(): Promise<void> }) {
  const [name, setName] = useState(category.name); const [description, setDescription] = useState(category.description);
  const [sortOrder, setSortOrder] = useState(String(category.sortOrder)); const [isActive, setIsActive] = useState(category.isActive);
  const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const response = await apiFetch(`/admin/categories/${category.id}`, { method: "PATCH", body: JSON.stringify({ name, description, sortOrder: Number(sortOrder), isActive }) });
      if (!response.ok) { setMessage(await errorMessage(response, "Category could not be updated.")); return; }
      setMessage("Category updated."); await onUpdated();
    } catch { setMessage("The administration service is unavailable."); } finally { setBusy(false); }
  }
  return <form className={`admin-category-card ${isActive ? "" : "is-inactive"}`} onSubmit={save}><div className="category-admin-heading"><div><strong>{category.slug}</strong><small>{category.reportCount} linked reports</small></div><label><input type="checkbox" checked={isActive} onChange={event => setIsActive(event.target.checked)} /> Active</label></div><label>Name<input value={name} onChange={event => setName(event.target.value)} required /></label><label>Description<textarea value={description} onChange={event => setDescription(event.target.value)} maxLength={240} rows={3} required /></label><label>Sort order<input type="number" min={0} max={10000} value={sortOrder} onChange={event => setSortOrder(event.target.value)} required /></label><button className="button button-secondary" disabled={busy}>Save changes</button>{message && <p className="auth-message" role="status">{message}</p>}</form>;
}
