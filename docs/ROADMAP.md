# 12-Week Delivery Roadmap

This roadmap prioritises a secure, demonstrable core workflow for an individual project. Dates and scope should be refined through the product backlog as evidence emerges.

Each week ends with a review of the implemented code, documentation, and verification results. Work on the following week begins after the project owner confirms the current week's result. The project owner handles Git commits and pushes.

> **Current progress:** Week 8 implementation and local verification are complete, awaiting project-owner confirmation. Staff and administrators can search and filter the operational queue, set priority, preserve assignment history, progress reports through validated status transitions, reply to residents, and record potential duplicates. Week 6 photograph handling remains deferred.

| Week | Focus | Expected outcome |
| --- | --- | --- |
| 1 | Proposal and requirements | Confirm scope, stakeholders, requirements, risks, and success measures. |
| 2 | UX and technical design | Complete personas, primary journeys, wireframes, architecture, and initial data model. |
| 3 | Repository and environments | Maintain the existing React frontend; add ASP.NET Core, local PostgreSQL Compose configuration, migrations, and repeatable checks. |
| 4 | Identity and access | Connect account pages to the API; verify registration, login/logout, password hashing, cookie sessions, role protection, and database persistence. |
| 5 | Issue submission | Implement categories, descriptions, locations, validation, and unique references. |
| 6 | Photograph handling | Implement safe upload validation, storage abstraction, metadata, and authorised retrieval. |
| 7 | Resident experience | Implement resident dashboard, report detail, history, and comments. |
| 8 | Staff operations | Implement search, filters, duplicate review, priority, assignment, and workflow status changes. |
| 9 | Administration | Implement user/role management, category and basic content management, non-secret settings, and audit records. |
| 10 | Notifications and insight | Implement status notifications, feedback, and basic dashboard statistics. |
| 11 | Quality and deployment | Complete accessibility, security, integration, and performance checks; prepare AWS deployment. |
| 12 | Evaluation and handover | Resolve critical defects, complete documentation, demonstrate the prototype, and evaluate outcomes. |

## Delivery priorities

1. Secure authentication and role enforcement.
2. Complete resident-to-staff report workflow.
3. Traceable status history and safe photograph handling.
4. Accessible resident and staff interfaces.
5. Notifications, feedback, and operational statistics.

Optional functions should be deferred before any essential privacy, security, accessibility, or workflow requirement is weakened.

## Week 4 acceptance gate

- With PostgreSQL running, apply the identity migration and create a synthetic resident account through the frontend.
- Confirm that the account persists, a fresh login works, `/api/v1/auth/me` requires a session, and logout ends it.
- Confirm a resident receives HTTP 403 from both staff and administrator endpoints, and unsafe requests without the required header receive HTTP 403.
- Run `dotnet build`, `npm test`, `npm run lint`, and the [authentication smoke test](../scripts/smoke-auth.ps1).
- Review the [Week 4 implementation notes](WEEK_04.md) and confirm the week before starting Week 5.

## Week 5 acceptance gate

- Apply the Week 5 migration and confirm the default categories and report lifecycle statuses exist.
- Submit a synthetic report through the resident form and confirm its unique reference, `Submitted` status, and initial history record.
- Confirm client and server validation reject incomplete reports.
- Confirm one resident cannot read another resident's report and staff accounts cannot use resident report endpoints.
- Run `dotnet build`, `npm test`, `npm run lint`, TypeScript checking, and `scripts/smoke-reports.ps1`.
- Review the [Week 5 implementation notes](WEEK_05.md) and confirm the week before starting Week 6.

## Week 7 acceptance gate

- Confirm the resident dashboard totals match reports stored for the signed-in account.
- Filter reports by status and sort them by newest, oldest, or workflow status.
- Add a valid comment to an owned report and confirm it appears in chronological order.
- Confirm invalid comments are rejected and another resident receives 404 for the report conversation.
- Run the API build, frontend TypeScript check, and the focused report smoke test.
- Review the [Week 7 implementation notes](WEEK_07.md) and confirm the week before starting Week 8.

## Week 8 acceptance gate

- Confirm Resident accounts receive 403 from staff operations endpoints while Staff and Administrator roles are authorised.
- Search and filter the report queue, then set a report priority and assign it to a staff account.
- Confirm invalid status jumps are rejected and valid transitions create immutable history entries.
- Add a staff reply and confirm it appears in the resident report conversation.
- Record a potential duplicate and confirm neither report is deleted or merged automatically.
- Run the API build, frontend TypeScript check, and focused staff workflow smoke test.
- Review the [Week 8 implementation notes](WEEK_08.md) and confirm the week before starting Week 9.
