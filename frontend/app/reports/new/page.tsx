"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ResidentShell } from "../../_components/ResidentShell";
import { GoogleLocationPicker, type LocationSelection } from "../../_components/GoogleLocationPicker";
import { apiFetch, errorMessage } from "../../_lib/api";
import type { Category, ReportDetail } from "../../_lib/reporting";

type FormErrors = { categoryId?: string; description?: string; location?: string };

export default function NewReportPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [googlePlaceId, setGooglePlaceId] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [state, setState] = useState<"loading" | "error" | "signed-out" | "wrong-role" | "edit" | "review" | "submitting" | "success">("loading");
  const [message, setMessage] = useState("");
  const [created, setCreated] = useState<ReportDetail | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([apiFetch("/auth/me", { signal: controller.signal }), apiFetch("/categories", { signal: controller.signal })])
      .then(async ([accountResponse, categoriesResponse]) => {
        if (accountResponse.status === 401) { setState("signed-out"); return; }
        if (!accountResponse.ok || !categoriesResponse.ok) { setMessage("The reporting service is unavailable."); setState("error"); return; }
        const account = await accountResponse.json() as { role: string };
        if (account.role !== "Resident") { setState("wrong-role"); return; }
        const loadedCategories = await categoriesResponse.json() as Category[];
        setCategories(loadedCategories);
        const requestedSlug = new URLSearchParams(window.location.search).get("category");
        const requestedCategory = loadedCategories.find(category => category.slug === requestedSlug);
        if (requestedCategory) setCategoryId(requestedCategory.id);
        setState("edit");
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError"))
          { setMessage("The reporting service is unavailable."); setState("error"); }
      });
    return () => controller.abort();
  }, []);

  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: FormErrors = {};
    if (!categoryId) nextErrors.categoryId = "Select an issue category.";
    if (description.trim().length < 20 || description.trim().length > 2000)
      nextErrors.description = "Describe the issue using 20 to 2,000 characters.";
    if (location.trim().length < 3 || location.trim().length > 300)
      nextErrors.location = "Enter a location using 3 to 300 characters.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) setState("review");
  }

  function updateLocation(selection: LocationSelection) {
    setLocation(selection.address);
    setLatitude(selection.latitude);
    setLongitude(selection.longitude);
    setGooglePlaceId(selection.googlePlaceId);
    setErrors(current => ({ ...current, location: undefined }));
  }

  async function submitReport() {
    setState("submitting");
    setMessage("");
    try {
      const response = await apiFetch("/reports", {
        method: "POST", body: JSON.stringify({ categoryId, description: description.trim(), location: location.trim(), latitude, longitude, googlePlaceId }),
      });
      if (!response.ok) {
        if (response.status === 401) { setState("signed-out"); return; }
        const body = await response.clone().json().catch(() => null) as { errors?: FormErrors } | null;
        if (body?.errors) setErrors(Object.fromEntries(Object.entries(body.errors).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])));
        setMessage(await errorMessage(response, "The report could not be submitted."));
        setState("edit");
        return;
      }
      setCreated(await response.json() as ReportDetail);
      setState("success");
    } catch {
      setMessage("The reporting service is unavailable. Please try again.");
      setState("review");
    }
  }

  const selectedCategory = categories.find(category => category.id === categoryId);
  return (
    <ResidentShell eyebrow="New community report" title="Tell us what needs attention"
      description="Provide the details council staff need to understand and route the issue.">
      {state === "loading" && <p className="page-status" role="status">Loading the secure report form...</p>}
      {state === "error" && <div className="empty-state"><h2>Report form unavailable</h2><p role="status">{message}</p><Link className="button button-secondary" href="/account">Return to account</Link></div>}
      {state === "signed-out" && <div className="empty-state"><h2>Sign in required</h2><p>Your account keeps reports private and connected to you.</p><Link className="button button-primary" href="/login?next=/reports/new">Sign in</Link></div>}
      {state === "wrong-role" && <div className="empty-state"><h2>Resident account required</h2><p>Issue submission is available to resident accounts.</p><Link className="button button-secondary" href="/account">Return to account</Link></div>}
      {state === "edit" && (
        <form className="resident-form" onSubmit={review} noValidate>
          <div className="prototype-note"><strong>Development service</strong><span>Use synthetic information only. Photograph upload will be added in Week 6.</span></div>
          <label htmlFor="report-category">Issue category</label>
          <select id="report-category" value={categoryId} onChange={event => setCategoryId(event.target.value)} aria-invalid={Boolean(errors.categoryId)}>
            <option value="">Select a category</option>
            {categories.map(category => <option value={category.id} key={category.id}>{category.name}</option>)}
          </select>
          {selectedCategory && <p className="field-help">{selectedCategory.description}</p>}
          {errors.categoryId && <p className="field-error">{errors.categoryId}</p>}

          <GoogleLocationPicker value={location} latitude={latitude} longitude={longitude} invalid={Boolean(errors.location)} onChange={updateLocation} />
          <p className="field-help">Do not include a private residential address unless it is necessary to identify the issue.</p>
          {errors.location && <p className="field-error">{errors.location}</p>}

          <label htmlFor="report-description">What happened?</label>
          <textarea id="report-description" value={description} onChange={event => setDescription(event.target.value)} maxLength={2000} rows={7} placeholder="Describe the issue, when you noticed it, and any immediate access or safety concern." aria-invalid={Boolean(errors.description)} />
          <p className="field-help">{description.length}/2000 characters</p>
          {errors.description && <p className="field-error">{errors.description}</p>}
          {message && <p className="auth-message" role="status">{message}</p>}
          <button className="button button-primary" type="submit">Review report <span aria-hidden="true">→</span></button>
        </form>
      )}
      {(state === "review" || state === "submitting") && (
        <section className="review-card">
          <p className="eyebrow">Review before submission</p>
          <dl className="report-facts">
            <div><dt>Category</dt><dd>{selectedCategory?.name}</dd></div>
            <div><dt>Location</dt><dd>{location.trim()}</dd></div>
            <div><dt>Map coordinates</dt><dd>{latitude !== null && longitude !== null ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` : "No map point selected"}</dd></div>
            <div><dt>Description</dt><dd>{description.trim()}</dd></div>
            <div><dt>Photographs</dt><dd>Available in Week 6</dd></div>
          </dl>
          {message && <p className="auth-message" role="status">{message}</p>}
          <div className="form-actions">
            <button className="button button-secondary" type="button" onClick={() => setState("edit")} disabled={state === "submitting"}>Edit details</button>
            <button className="button button-primary" type="button" onClick={submitReport} disabled={state === "submitting"}>{state === "submitting" ? "Submitting..." : "Submit report"}</button>
          </div>
        </section>
      )}
      {state === "success" && created && (
        <section className="success-panel">
          <span aria-hidden="true">✓</span>
          <p className="eyebrow">Report submitted</p>
          <h2>{created.reference}</h2>
          <p>Your report is saved with the status <strong>{created.status}</strong>.</p>
          <div className="form-actions">
            <Link className="button button-primary" href={`/reports/${created.reference}`}>View report</Link>
            <Link className="button button-secondary" href="/reports">All my reports</Link>
          </div>
        </section>
      )}
    </ResidentShell>
  );
}
