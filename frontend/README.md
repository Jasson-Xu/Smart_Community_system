# Smart Community Frontend

The resident-facing website for the Smart Community System. This first implementation provides:

- a responsive civic-service homepage;
- an interactive issue-reporting prototype;
- a report-tracking preview;
- registration, login, and logout interface flows with client-side validation;
- issue categories, status examples, and community metrics;
- public privacy and security information; and
- production-build and rendered-route tests.

All displayed reports and statistics are illustrative. Authentication pages do not create accounts or sessions. The frontend does not yet connect to the ASP.NET Core API, PostgreSQL, or production storage.

## Requirements

- Node.js 22.13 or later
- npm

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

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
- `app/globals.css` — design system, responsive layout, and accessibility states
- `public/og.png` — site-specific social preview card
- `tests/` — rendered HTML and design-token checks

The production backend remains planned as ASP.NET Core Web API with PostgreSQL. No D1, R2, application-owned authentication, or persistent browser storage is enabled in this frontend stage.
