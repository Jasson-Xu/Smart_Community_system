# Smart Community Frontend

The resident-facing website for the Smart Community System. This first implementation provides:

- a responsive civic-service homepage;
- an interactive issue-reporting prototype;
- a report-tracking preview;
- registration, login, and logout flows connected to the ASP.NET Core API;
- an authenticated account page;
- issue categories, status examples, and community metrics;
- public privacy and security information; and
- production-build and rendered-route tests.

All displayed reports and statistics are illustrative. Account data is stored by the API in local PostgreSQL when the backend is running. Report submission, report tracking, and production photograph storage are not connected yet. Use synthetic data only.

## Requirements

- Node.js 22.13 or later
- npm

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Copy `.env.example` to `.env.local` to set `NEXT_PUBLIC_API_BASE_URL`. Start the PostgreSQL database and API first using the [backend guide](../backend/README.md).

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
- `app/_lib/api.ts` — credentialed API requests
- `app/globals.css` — design system, responsive layout, and accessibility states
- `public/og.png` — site-specific social preview card
- `tests/` — rendered HTML and design-token checks

The backend now uses ASP.NET Core Web API and PostgreSQL for identity. Browser sessions use an HttpOnly cookie issued by the API. No D1, R2, or persistent browser token storage is used.
