# Smart Community Frontend

The resident-facing website for the Smart Community System. This first implementation provides:

- a responsive civic-service homepage;
- an interactive issue-reporting prototype;
- a report-tracking preview;
- registration, login, and logout flows connected to the ASP.NET Core API;
- an authenticated account page;
- resident report submission with review and confirmation;
- Google Maps place search and map-pin selection with a manual location fallback;
- a resident dashboard with status totals and recent reports;
- resident-owned report filtering, detail timelines, and comments;
- a staff operations dashboard and searchable report queue;
- staff priority, assignment, status, reply, and duplicate-review controls;
- administrator dashboards and user, role, category, setting, and audit management;
- issue categories, status examples, and community metrics;
- public privacy and security information; and
- production-build and rendered-route tests.

Homepage community metrics and recent-progress examples remain illustrative. Account and resident report data are stored by the API in local PostgreSQL when the backend is running. Photograph storage is not connected yet. Use synthetic data only.

## Requirements

- Node.js 22.13 or later
- npm

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_API_BASE_URL` to the local API URL;
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to a browser key with Maps JavaScript API, Places API (New), and Geocoding API enabled.

Restrict the Google key to the website origins that run this frontend, such as `http://localhost:3000/*` during local development, and restrict its API access to Maps JavaScript API, Places API (New), and Geocoding API. Restart `npm run dev` after changing `.env.local`. The report form keeps manual location entry available when no key is configured or Maps cannot load.

Start the PostgreSQL database and API first using the [backend guide](../backend/README.md).

## Verification

```bash
npm run build
npm test
```

## Project structure

- `app/page.tsx` — resident homepage and prototype interactions
- `app/privacy/page.tsx` — public privacy summary
- `app/security/page.tsx` — public security summary
- `app/register/page.tsx` — resident registration form and validation
- `app/login/page.tsx` — login form and validation
- `app/logout/page.tsx` — logout confirmation states
- `app/account/page.tsx` — authenticated account session
- `app/reports/new/page.tsx` — validated report form, review, and submission
- `app/dashboard/page.tsx` — resident totals, status breakdown, and recent reports
- `app/_components/GoogleLocationPicker.tsx` — Google place search, map marker, and manual fallback
- `app/reports/page.tsx` — filtered and sorted current-resident report list
- `app/reports/[reference]/page.tsx` — owned report detail, status timeline, and comments
- `app/staff/page.tsx` — staff operational totals and recent reports
- `app/staff/reports/page.tsx` — searchable and filterable council report queue
- `app/staff/reports/[reference]/page.tsx` — staff workflow and report review controls
- `app/admin/page.tsx` — administration summary and recent audit activity
- `app/admin/users/page.tsx` — account activation and multi-role management
- `app/admin/categories/page.tsx` — issue category creation, editing, ordering, and activation
- `app/admin/settings/page.tsx` — approved non-secret operational settings
- `app/admin/audit/page.tsx` — filterable administrative audit records
- `app/_lib/api.ts` — credentialed API requests
- `app/globals.css` — design system, responsive layout, and accessibility states
- `public/og.png` — site-specific social preview card
- `tests/` — rendered HTML and design-token checks

The backend now uses ASP.NET Core Web API and PostgreSQL for identity. Browser sessions use an HttpOnly cookie issued by the API. No D1, R2, or persistent browser token storage is used.
