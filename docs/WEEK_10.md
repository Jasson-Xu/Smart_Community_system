# Week 10 — Notifications, feedback, and insight

## Delivered

- A staff status transition creates an in-app notification for the report's resident in the same database save as the status history entry. The notification links to the report and tracks when the resident reads it.
- Residents can view their latest 50 notifications and mark their own notifications as read. An unknown or another resident's notification returns 404.
- A resident can submit one 1–5 rating and optional 1,000-character comment when an owned report is Resolved or Closed. A unique report index prevents duplicate feedback, including concurrent submissions.
- The resident dashboard shows unread notifications and completed reports awaiting feedback. The staff dashboard shows submissions and resolution events from the last 30 days.
- The EF Core migration `Week10NotificationsFeedback` creates `report_notifications` and `report_feedback`.

## API

| Method | Route | Result |
| --- | --- | --- |
| GET | `/api/v1/resident/notifications` | Latest 50 own status updates. |
| PATCH | `/api/v1/resident/notifications/{id}/read` | Mark own update as read. |
| GET | `/api/v1/reports/{reference}/feedback` | Feedback eligibility and existing response for own report. |
| POST | `/api/v1/reports/{reference}/feedback` | Submit one rating on an owned completed report. |

## Notes

- Notifications are in-app only and begin with status changes made after this migration; historical changes are not backfilled.
- Resolution activity counts the transition to Resolved within 30 days. It is independent of the current status, so subsequently closed reports remain included in that historical measure.
- Week 6 photograph upload remains deferred by the project owner.
