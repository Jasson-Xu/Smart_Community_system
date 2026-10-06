"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ResidentShell } from "../../_components/ResidentShell";
import { apiFetch, errorMessage } from "../../_lib/api";
import { formatReportDate, type FeedbackState, type ReportComment, type ReportDetail } from "../../_lib/reporting";

export default function ReportDetailPage() {
  const params = useParams<{ reference: string }>();
  const reference = decodeURIComponent(params.reference ?? "").toUpperCase();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [comments, setComments] = useState<ReportComment[]>([]);
  const [feedbackState, setFeedbackState] = useState<FeedbackState | null>(null);
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [commentMessage, setCommentMessage] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [status, setStatus] = useState("Loading report...");
  const [signedOut, setSignedOut] = useState(false);

  useEffect(() => {
    if (!reference) return;
    const controller = new AbortController();
    Promise.all([
      apiFetch(`/reports/${encodeURIComponent(reference)}`, { signal: controller.signal }),
      apiFetch(`/reports/${encodeURIComponent(reference)}/comments`, { signal: controller.signal }),
      apiFetch(`/reports/${encodeURIComponent(reference)}/feedback`, { signal: controller.signal }),
    ]).then(async ([reportResponse, commentsResponse, feedbackResponse]) => {
      if (reportResponse.status === 401) { setSignedOut(true); return; }
      if (reportResponse.status === 404) { setStatus("This report was not found in your account."); return; }
      if (reportResponse.status === 403) { setStatus("Report details are available to resident accounts."); return; }
      if (!reportResponse.ok) { setStatus("The report could not be loaded."); return; }
      setReport(await reportResponse.json() as ReportDetail);
      if (commentsResponse.ok) setComments(await commentsResponse.json() as ReportComment[]);
      else setCommentMessage("Comments could not be loaded.");
      if (feedbackResponse.ok) setFeedbackState(await feedbackResponse.json() as FeedbackState);
      else setFeedbackMessage("Feedback could not be loaded.");
      setStatus("");
    }).catch((error: unknown) => {
      if (!(error instanceof DOMException && error.name === "AbortError")) setStatus("The reporting service is unavailable.");
    });
    return () => controller.abort();
  }, [reference]);

  async function addComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = commentBody.trim();
    if (body.length < 2 || body.length > 1000) {
      setCommentMessage("Enter a comment using 2 to 1,000 characters.");
      return;
    }
    setSubmittingComment(true);
    setCommentMessage("");
    try {
      const response = await apiFetch(`/reports/${encodeURIComponent(reference)}/comments`, {
        method: "POST", body: JSON.stringify({ body }),
      });
      if (response.status === 401) { setSignedOut(true); return; }
      if (!response.ok) { setCommentMessage(await errorMessage(response, "The comment could not be added.")); return; }
      const created = await response.json() as ReportComment;
      setComments(current => [...current, created]);
      setCommentBody("");
      setCommentMessage("Comment added.");
    } catch {
      setCommentMessage("The comment service is unavailable.");
    } finally {
      setSubmittingComment(false);
    }
  }

  async function submitFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittingFeedback(true);
    setFeedbackMessage("");
    try {
      const response = await apiFetch(`/reports/${encodeURIComponent(reference)}/feedback`, {
        method: "POST", body: JSON.stringify({ rating, comment: feedbackComment }),
      });
      if (!response.ok) { setFeedbackMessage(await errorMessage(response, "Feedback could not be submitted.")); return; }
      setFeedbackState({ eligible: true, feedback: await response.json() });
      setFeedbackMessage("Thank you for your feedback.");
    } catch { setFeedbackMessage("The feedback service is unavailable."); }
    finally { setSubmittingFeedback(false); }
  }

  return (
    <ResidentShell eyebrow="Report details" title={report?.reference ?? (reference || "Report")}
      description="Review the submitted information, status timeline, and conversation for this report.">
      {signedOut ? <div className="empty-state"><h2>Sign in required</h2><p>Sign in with the resident account that submitted this report.</p><Link className="button button-primary" href={`/login?next=${encodeURIComponent(`/reports/${reference}`)}`}>Sign in</Link></div> :
       !report ? <div className="empty-state"><p role="status">{status}</p><Link className="button button-secondary" href="/reports">Back to my reports</Link></div> :
       <div className="report-detail-grid">
         <div className="report-detail-main">
           <section className="report-detail-card">
             <div className="detail-title"><div><p className="eyebrow">{report.category}</p><h2>{report.location}</h2></div><span className="status-pill">{report.status}</span></div>
             <dl className="report-facts">
               <div><dt>Reference</dt><dd>{report.reference}</dd></div>
               <div><dt>Submitted</dt><dd>{formatReportDate(report.submittedAt)}</dd></div>
               <div><dt>Priority</dt><dd>{report.priority}</dd></div>
               <div><dt>Map coordinates</dt><dd>{report.latitude !== null && report.longitude !== null ? <a className="map-link" href={`https://www.google.com/maps/search/?api=1&query=${report.latitude},${report.longitude}`} target="_blank" rel="noreferrer">{report.latitude.toFixed(6)}, {report.longitude.toFixed(6)} ↗</a> : "Not selected"}</dd></div>
               <div className="fact-wide"><dt>Description</dt><dd>{report.description}</dd></div>
               <div className="fact-wide"><dt>Photographs</dt><dd>Photograph upload is deferred while Week 6 remains paused.</dd></div>
             </dl>
           </section>
           {feedbackState?.eligible && <section className="comments-card">
             <div className="comments-heading"><div><p className="eyebrow">Service experience</p><h2>Feedback</h2></div></div>
             {feedbackState.feedback ? <p>You rated this resolution {feedbackState.feedback.rating}/5 on {formatReportDate(feedbackState.feedback.submittedAt)}.{feedbackState.feedback.comment && <> “{feedbackState.feedback.comment}”</>}</p> :
               <form className="comment-form" onSubmit={submitFeedback}>
                 <label htmlFor="feedback-rating">How satisfied are you with the resolution?</label>
                 <select id="feedback-rating" value={rating} onChange={event => setRating(Number(event.target.value))}>{[5, 4, 3, 2, 1].map(value => <option key={value} value={value}>{value} / 5</option>)}</select>
                 <label htmlFor="feedback-comment">Comment (optional)</label>
                 <textarea id="feedback-comment" rows={3} maxLength={1000} value={feedbackComment} onChange={event => setFeedbackComment(event.target.value)} />
                 <button className="button button-primary" type="submit" disabled={submittingFeedback}>{submittingFeedback ? "Submitting..." : "Submit feedback"}</button>
               </form>}
             {feedbackMessage && <p role="status">{feedbackMessage}</p>}
           </section>}
           <section className="comments-card">
             <div className="comments-heading"><div><p className="eyebrow">Report conversation</p><h2>Comments</h2></div><span>{comments.length}</span></div>
             {comments.length === 0 ? <p className="comments-empty">No comments yet. Add context or an update for this report.</p> : <ol className="comments-list">{comments.map(comment => <li key={comment.id}><div><strong>{comment.authorName}</strong><time dateTime={comment.createdAt}>{formatReportDate(comment.createdAt)}</time></div><p>{comment.body}</p></li>)}</ol>}
             <form className="comment-form" onSubmit={addComment} noValidate>
               <label htmlFor="report-comment">Add a comment</label>
               <textarea id="report-comment" value={commentBody} onChange={event => { setCommentBody(event.target.value); setCommentMessage(""); }} maxLength={1000} rows={4} placeholder="Add relevant information or an update about this issue." />
               <div><small>{commentBody.length}/1000 characters</small><button className="button button-primary" type="submit" disabled={submittingComment}>{submittingComment ? "Adding..." : "Add comment"}</button></div>
               {commentMessage && <p className="auth-message" role="status">{commentMessage}</p>}
             </form>
           </section>
         </div>
         <aside className="history-card"><h2>Status timeline</h2><ol>{report.history.map((entry, index) => <li key={`${entry.changedAt}-${index}`}><span aria-hidden="true" /><div><strong>{entry.status}</strong><small>{formatReportDate(entry.changedAt)}</small>{entry.note && <p>{entry.note}</p>}</div></li>)}</ol></aside>
       </div>}
    </ResidentShell>
  );
}
