# Smart Community API

The API provides PostgreSQL-backed accounts, resident issue reporting, dashboards, comments, and staff workflow operations. Public registration always creates a resident account. Staff and administrator accounts can only be provisioned by an operator with database access.

## Local setup

Prerequisites: .NET 10 SDK, Docker with Compose, and Node.js 22.13 or later for the frontend. Use synthetic account details only.

1. Copy the repository's `.env.example` to `.env` and replace the local PostgreSQL password. The `.env` file is ignored by Git.
2. From the repository root, run `docker compose up -d postgres` and wait until the container is healthy.
3. Set the API connection string in your shell. In PowerShell:

   ```powershell
   $env:ConnectionStrings__Default = 'Host=localhost;Port=5432;Database=smartcommunity;Username=smartcommunity;Password=<your local password>'
   ```

4. Run the migration and start the API:

   ```powershell
   dotnet ef database update --project backend/SmartCommunity.Api
   dotnet run --project backend/SmartCommunity.Api --launch-profile http
   ```

   The development API listens on `http://localhost:5079`. Set `Frontend__Origin` if the frontend uses a different origin from `http://localhost:3000`.
   Development cookie-protection keys are stored in the ignored `.docker-data/data-protection-keys/` directory so local sessions survive an API restart. Protect and back up the key ring appropriately before production deployment.
5. In a second shell, copy `frontend/.env.example` to `frontend/.env.local`, then run `npm ci` and `npm run dev` in `frontend/`.

## Endpoints

| Method | Path | Access | Result |
| --- | --- | --- | --- |
| GET | `/health` | Public | API process health |
| POST | `/api/v1/auth/register` | Public | Create resident and sign in |
| POST | `/api/v1/auth/login` | Public | Sign in |
| POST | `/api/v1/auth/logout` | Public | End browser session |
| GET | `/api/v1/auth/me` | Signed in | Current account |
| GET | `/api/v1/staff/me` | Staff or administrator | Role check |
| GET | `/api/v1/admin/me` | Administrator | Role check |
| GET | `/api/v1/categories` | Public | Active issue categories |
| POST | `/api/v1/reports` | Resident | Create a report, optional map coordinates/Place ID, and its initial status history |
| GET | `/api/v1/reports` | Resident | List reports owned by the current resident |
| GET | `/api/v1/reports/{reference}` | Resident | Get one owned report and its status history |
| GET | `/api/v1/resident/dashboard` | Resident | Get status totals and five recent reports |
| GET | `/api/v1/reports/{reference}/comments` | Resident | List comments on an owned report |
| POST | `/api/v1/reports/{reference}/comments` | Resident | Add a validated comment to an owned report |
| GET | `/api/v1/staff/dashboard` | Staff or administrator | Open-report totals and recent reports; Closed reports are excluded from the total |
| GET | `/api/v1/staff/users` | Staff or administrator | Accounts available for assignment |
| GET | `/api/v1/staff/reports` | Staff or administrator | Search, filter, and sort all reports |
| GET | `/api/v1/staff/reports/{reference}` | Staff or administrator | Operational report detail and histories |
| PATCH | `/api/v1/staff/reports/{reference}/priority` | Staff or administrator | Set Low, Normal, High, or Urgent priority |
| POST | `/api/v1/staff/reports/{reference}/assignments` | Staff or administrator | Add an assignment history entry |
| POST | `/api/v1/staff/reports/{reference}/status` | Staff or administrator | Apply the next permitted status transition |
| POST | `/api/v1/staff/reports/{reference}/comments` | Staff or administrator | Reply in the resident conversation |
| POST | `/api/v1/staff/reports/{reference}/duplicates` | Staff or administrator | Record a potential duplicate for review |

The browser sends credentials with requests. POST requests must include `X-Requested-With: XMLHttpRequest`; browser requests with an `Origin` header must match `Frontend:Origin`. The API accepts credentialed CORS requests only from that origin. Registration and login are limited to ten requests per minute per client IP. Cookies are HttpOnly and secure in non-development environments. Production must place the frontend and API on the same site and use HTTPS.

## Provisioning staff and administrators

After the migration, supply `Bootstrap__Name`, `Bootstrap__Email`, `Bootstrap__Password`, and `Bootstrap__Role` as environment variables. The role must be `Staff` or `Administrator`. In PowerShell, read the password without placing it in shell history: `$env:Bootstrap__Password = [System.Net.NetworkCredential]::new('', (Read-Host 'Bootstrap password' -AsSecureString)).Password`. Then run:

```powershell
dotnet run --project backend/SmartCommunity.Api --launch-profile http -- --bootstrap-role
```

The command creates one account and refuses to modify an existing one. Clear the bootstrap environment variables afterward. Do not put passwords in command arguments, committed files, or shell history. User and role management through the API is planned for Week 9.

## Local demo accounts

After applying the migration, run `pwsh -File scripts/seed-demo-accounts.ps1` from the repository root. This explicit, Development-only command creates or refreshes three synthetic accounts:

| Role | Email | Password |
| --- | --- | --- |
| Resident | `resident.demo@example.test` | `DemoPass123!` |
| Staff | `staff.demo@example.test` | `DemoPass123!` |
| Administrator | `admin.demo@example.test` | `DemoPass123!` |

The local login page also displays these credentials. All three roles currently reach the account page; staff and administrator dashboards are planned for later weeks. The seed command refuses to run outside Development.

## Verification

Run `dotnet build backend/SmartCommunity.Api`, `pwsh -File scripts/smoke-auth.ps1`, and `pwsh -File scripts/smoke-reports.ps1` after the database and API are running. The report test creates synthetic residents and reports, then verifies report validation, dashboard totals, filtering, comments, ownership, and role restrictions.

The API does not yet implement photograph storage, notifications, account recovery, or administrative management. Those remain scheduled or deferred to later work.
