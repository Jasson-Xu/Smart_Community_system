# Week 7 Resident Experience

## Goal

Give signed-in residents one place to understand their report activity and continue a secure conversation about each owned report.

Week 6 photograph handling was deferred by the project owner and remains in the backlog.

## Implemented

- Added a PostgreSQL-backed resident dashboard with total, active, completed, per-status, and recent-report views.
- Added server-side report filtering by lifecycle status and sorting by newest, oldest, or workflow status.
- Added the `comments` table with report and author foreign keys, chronological indexing, a 1,000-character limit, and immutable timestamps.
- Added resident-only comment list and create endpoints with report ownership checks.
- Return 404 when a resident attempts to access another resident's report conversation.
- Added Dashboard navigation, responsive summary cards, report controls, a status timeline, and report comments.
- Updated the account page to link to the resident dashboard.

## Requirement coverage

| Requirement | Week 7 result |
| --- | --- |
| FR-10 | Residents can browse, filter, sort, and open their submitted reports. |
| FR-11 | Dashboard, list, and detail views display current report status. |
| FR-16 | Report details render the chronological status history. |
| FR-17 | Residents can add and read comments on reports they own. |

## Verification status

- API build: passed with zero warnings.
- Frontend TypeScript check: passed.
- PostgreSQL migration: applied successfully to the local Docker database.
- Focused report smoke test: passed for dashboard totals, filtering and sorting, valid and invalid comments, chronological retrieval, cross-resident isolation, and role restrictions.

Week 7 implementation and local verification are complete. Week 8 starts after the project owner confirms this result.

## Deferred work

- Photograph handling remains deferred from Week 6.
- Staff comment participation and staff workflow controls begin in Week 8.
