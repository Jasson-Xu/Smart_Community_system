# Week 8 Staff Operations

## Goal

Provide authorised council staff with a traceable operational workflow for reviewing, prioritising, assigning, progressing, and discussing resident reports.

## Implemented

- Added a staff and administrator dashboard where open, unassigned, urgent, and priority totals exclude Closed cases; the per-status view retains Closed for historical visibility.
- Added a searchable report queue with status, priority, assignee, and sort controls.
- Added Low, Normal, High, and Urgent report priority with API and database validation.
- Added immutable assignment history, including assignee, assigning operator, and timestamp.
- Enforced the lifecycle `Submitted → Under Review → Assigned → In Progress → Resolved → Closed`.
- Required an assignment before a report can enter Assigned status.
- Added staff replies to the existing resident conversation.
- Added potential duplicate records that preserve both reports for human review.
- Added staff report detail with resident contact, map link, status history, assignment history, comments, and duplicate records.
- Allowed Administrator accounts to use the staff workspace while Resident accounts receive 403.

## Requirement coverage

| Requirement | Week 8 result |
| --- | --- |
| FR-12 | Staff can search and filter the full report queue. |
| FR-13 | Staff can set a validated report priority. |
| FR-14 | Staff can assign reports while preserving assignment history. |
| FR-15 | Staff can apply only the next permitted workflow status. |
| FR-16 | Every accepted status transition creates a history entry with actor, time, and note. |
| FR-17 | Staff replies appear in the resident report conversation. |
| FR-24 | Staff can record potential duplicates without discarding submissions. |

## Verification status

- API build: passed with zero warnings.
- Frontend TypeScript check: passed.
- PostgreSQL migration: applied successfully to the local Docker database.
- Focused staff workflow smoke test: passed for role protection, dashboard data, search and filters, priority, assignment, invalid and valid status transitions, staff replies, duplicate review, and resident-visible updates.

Week 8 implementation and local verification are complete. Week 9 starts after the project owner confirms this result.

## Deferred work

- Photograph handling remains deferred from Week 6.
- User, role, category, setting, and audit administration begin in Week 9.
