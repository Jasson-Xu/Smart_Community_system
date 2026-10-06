# Week 5 Issue Submission

## Goal

Replace the homepage report simulation with a complete, database-backed resident flow for structured community issue reports.

## Implemented

- Seeded active issue categories and the six planned lifecycle statuses through an EF Core migration.
- Added report records with resident ownership, category, address, optional Google Maps coordinates and Place ID, current status, submitted timestamp, and a unique human-readable reference.
- Added an immutable initial `Submitted` history entry in the same database save as each new report.
- Added public category lookup and resident-only create, list, and detail API endpoints.
- Added server validation for active category, description length, location length, coordinate pairs and valid latitude/longitude ranges.
- Added resident ownership checks that return 404 instead of exposing whether another resident's report exists.
- Replaced the homepage report preview with links to the authenticated report flow.
- Added a responsive report form with client validation, review step, success confirmation, resident report list, and report detail with status history.
- Added Google Maps JavaScript API place search, a draggable map marker, reverse-geocoded addresses, persisted coordinates, and a manual location fallback when the API key is unavailable.
- Preserved photograph upload as an explicit Week 6 feature.

## Requirement coverage

| Requirement | Week 5 result |
| --- | --- |
| FR-04 | Residents can create persisted community issue reports. |
| FR-05 | The form and API use active database categories. |
| FR-06 | Reports persist a description, address, coordinates, and Google Place ID when selected. |
| FR-08 | Client and server validate required data and length limits. |
| FR-09 | Every report receives a database-unique `SC-<year>-<token>` reference. |
| FR-10 | Residents can list and open their own submitted reports. |
| FR-11 | List and detail pages display the current status. |
| FR-16 | Submission creates the first immutable status-history entry. |

## Verification status

- API build: passed with zero warnings.
- EF migration consistency check: passed with no pending model changes.
- PostgreSQL migration: applied successfully to the local Docker database.
- Database-backed report smoke test: passed. It covered categories, authentication, invalid input and coordinates, Google Maps metadata persistence, two unique references, initial history, list and detail access, cross-resident isolation, and staff denial.
- Frontend production build and five rendered-route tests: passed on 6 October 2026.
- Frontend lint and TypeScript checks: passed on 6 October 2026.

Week 5 implementation and local verification are complete. Week 6 starts after the project owner confirms this result.

## Deferred to Week 6

Photograph selection, file validation, storage abstraction, private object storage, metadata, and authorised photograph retrieval are not part of this week.
