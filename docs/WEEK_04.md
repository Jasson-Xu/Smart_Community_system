# Week 4 Identity and Access

## Goal

Replace the existing account-page simulation with persisted resident accounts and authenticated browser sessions. Enforce role access in the API before report and administration features are added.

## Implemented

- ASP.NET Core API project with PostgreSQL and an EF Core identity migration.
- Resident registration with server validation, unique normalised email, and ASP.NET Core password hashing.
- Login and logout using an HttpOnly session cookie; current-account lookup loads the user from the database.
- Resident, Staff, and Administrator roles. Public registration can only create residents. Staff and administrator accounts require an operator-only bootstrap command.
- Role-protected staff and administrator session endpoints. The API rejects a session if its account is removed or its role changes.
- Credentialed CORS for the configured frontend origin, a required custom header on state-changing API requests, HTTPS-only cookies outside development, and a per-IP request limit on registration and login.
- Connected registration, login, logout, and account pages. The homepage report flow remains an explicit prototype until Week 5.
- Local PostgreSQL Compose configuration, a repeatable migration, and an HTTP authentication smoke test.
- Repeatable, Development-only resident, staff, and administrator demo account seeding for local review.

## Requirement coverage

| Proposal requirement | Week 4 implementation | Acceptance evidence |
| --- | --- | --- |
| FR-01 Resident account | `POST /api/v1/auth/register` and registration page | Successful registration persists an account; duplicate email returns 409; invalid input returns 400. |
| FR-02 Login and logout | Cookie-based login/logout and account page | `/auth/me` returns 401 before login, 200 after login, and 401 after logout. |
| FR-03 Role permissions | Role claims and API endpoint policies | A resident receives 403 from staff and administrator endpoints. |

## Verification status

- `dotnet build backend/SmartCommunity.Api/SmartCommunity.Api.csproj --no-restore`: passed on 6 October 2026, zero warnings.
- `npm test`: passed on 6 October 2026, four rendered-route tests.
- `npm run lint` and `npx tsc --noEmit`: passed on 6 October 2026.
- API process startup and `GET /health`: passed on 6 October 2026.
- Without a database, `GET /api/v1/auth/me` and `GET /api/v1/staff/me` returned 401, and `POST /api/v1/auth/logout` without the required header returned 403.
- PostgreSQL integration smoke test: passed on 6 October 2026 using the local Docker Desktop installation. The test covered registration, duplicate email rejection, session lookup, resident access denial on staff and administrator endpoints, request origin/header protection, logout, and a fresh login.
- Development demo accounts: seeded locally and verified through login plus role endpoints. Resident received 403 for staff/admin; Staff received 200/403; Administrator received 200/200.

Week 4 implementation and local verification are complete. Week 5 report submission starts after the project owner confirms this week's result.

## Next week

Week 5 adds categories, issue description and location, server-side validation, unique report references, and resident-owned report persistence. It will replace the homepage report simulation with the real submission flow.
