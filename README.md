# Smart Community System

A secure, accessible web platform for residents to report community issues and for council teams to manage them from submission through resolution.

The system supports concerns affecting public infrastructure, environmental quality, accessibility, and community safety, including potholes, broken streetlights, damaged footpaths, illegal dumping, and similar local hazards. It contributes to **United Nations Sustainable Development Goal 11: Sustainable Cities and Communities** by improving service visibility, accountability, and community participation.

> **Project status:** An academic demo is live on Amazon EC2. Photograph storage is deferred. This is an individual, 12-week academic project and is not a production council service.

## EC2 deployment

**Public URL:** [https://15-135-238-18.sslip.io/](https://15-135-238-18.sslip.io/)

The hosted demo runs on Amazon Linux 2023. Caddy serves HTTPS and forwards requests to the React frontend and ASP.NET Core API. PostgreSQL runs on the same EC2 instance. The frontend, API, database, and Caddy services are running, and the public homepage and sign-in page respond successfully. Amazon RDS is not connected to this deployment.

The developer has decided to postpone Amazon S3 integration and deployment because of the project's workload and limited familiarity with S3. Photograph uploads are therefore unavailable in the hosted demo for now.

## Online demo accounts

Open the [Smart Community sign-in page](https://15-135-238-18.sslip.io/login) and use one of these accounts:

| Role | Email | Password |
| --- | --- | --- |
| Resident | `resident.demo@example.test` | `DemoPass123!` |
| Staff | `staff.demo@example.test` | `DemoPass123!` |

These accounts are for testing with synthetic data. The hosted administrator account is private and is not listed here. The administrator demo account described in the local development guide is not created on the hosted site.

## Core capabilities

### Residents

- Register and authenticate securely.
- Submit an issue with a category, description, and location. Photograph handling is deferred.
- Receive a unique report reference.
- Track status updates and report history.
- Add relevant comments and provide feedback after resolution.

### Council staff

- Review, search, and filter incoming reports.
- Validate reports and identify potential duplicates.
- Set priorities and assign work.
- Record progress and update report status.
- View operational statistics.

### Administrators

- Manage users, roles, and issue categories.
- Maintain system settings.
- Review important activity through audit records.

## Technology stack

| Area | Technology |
| --- | --- |
| Web client | React |
| API | ASP.NET Core Web API |
| Data access | Entity Framework Core with Npgsql |
| Database | PostgreSQL |
| Location search and map | Google Maps JavaScript API and Places API (New) |
| Local environment | Docker |
| Application hosting | Amazon EC2 |
| Hosted demo database | PostgreSQL on Amazon EC2 |
| Planned photograph storage | Amazon S3 (not connected) |

## Architecture

The application separates the web interface, API and business logic, and relational data. PostgreSQL runs in Docker during local development and on the EC2 instance for the hosted demo. Amazon RDS and S3 remain possible future infrastructure components.

See [Architecture](docs/ARCHITECTURE.md) for boundaries and design principles.

## Documentation

- [Requirements](docs/REQUIREMENTS.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Proposed database design](docs/DATABASE.md)
- [Delivery roadmap](docs/ROADMAP.md)
- [Privacy policy](PRIVACY.md)
- [Security policy](SECURITY.md)
- [Contributing guide](CONTRIBUTING.md)
- [Code of conduct](CODE_OF_CONDUCT.md)
- [Changelog](CHANGELOG.md)

## Scope

The hosted demo covers registration, authentication, role-based access, issue submission, locations, report tracking, dashboards, assignments, priorities, status updates, comments, notifications, feedback, basic statistics, and audit records. Photograph uploads remain deferred.

Native mobile applications, AI-based classification, emergency dispatch, automatic translation, and integration with existing council systems are outside the initial scope.

## Frontend development

The frontend is available in [`frontend/`](frontend/). Resident functions include reporting, tracking, and comments. Staff functions cover operational processing. Administrator functions cover users, roles, categories, approved settings, and audit records. All operational data uses the PostgreSQL-backed API in [`backend/`](backend/README.md). Homepage community metrics remain illustrative.

Requirements:

- Node.js 22.13 or later
- npm

```bash
cd frontend
npm install
npm run dev
```

See the [API setup guide](backend/README.md) for PostgreSQL, migration, and local startup steps. Use `npm test` to build and verify the frontend routes. Repository changes should follow [CONTRIBUTING.md](CONTRIBUTING.md).

## Responsible use

Do not use this prototype to collect real personal information or operational council reports. Any production deployment requires an identified service operator, a completed privacy assessment, verified retention rules, security testing, incident-response procedures, and appropriate legal review.

## Licence

Source code and repository documentation are available under the [MIT Licence](LICENSE).
