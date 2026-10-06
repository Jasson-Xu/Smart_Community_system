# 12-Week Delivery Roadmap

This roadmap prioritises a secure, demonstrable core workflow for an individual project. Dates and scope should be refined through the product backlog as evidence emerges.

Each week ends with a review of the implemented code, documentation, and verification results. Work on the following week begins after the project owner confirms the current week's result. The project owner handles Git commits and pushes.

> **Current progress:** Week 4 implementation and local verification are complete, awaiting project-owner confirmation. The registration, login, logout, and account pages call the ASP.NET Core API. PostgreSQL-backed accounts, password hashing, cookie sessions, and role-protected endpoints passed a live database smoke test.

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
