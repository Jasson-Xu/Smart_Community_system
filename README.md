# Smart Community System

A secure, accessible web platform for residents to report community issues and for council teams to manage them from submission through resolution.

The system supports concerns affecting public infrastructure, environmental quality, accessibility, and community safety, including potholes, broken streetlights, damaged footpaths, illegal dumping, and similar local hazards. It contributes to **United Nations Sustainable Development Goal 11: Sustainable Cities and Communities** by improving service visibility, accountability, and community participation.

> **Project status:** Week 10 notifications, feedback, and dashboard insight have passed local verification and await project-owner confirmation. Week 6 photograph handling is deferred. This is an individual, 12-week academic project and is not a production council service.

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
| Production database | Amazon RDS for PostgreSQL |
| Photograph storage | Amazon S3 |

## Architecture

The application separates the web interface, API and business logic, relational data, and photograph storage. PostgreSQL runs in Docker during local development. In production, the API is planned for Amazon EC2, structured data for Amazon RDS for PostgreSQL, and uploaded photographs for Amazon S3.

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

The initial release covers registration, authentication, role-based access, issue submission, locations, photograph uploads, report tracking, dashboards, assignments, priorities, status updates, comments, notifications, feedback, basic statistics, and audit records.

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
