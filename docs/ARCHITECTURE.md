# Architecture

## Purpose

This document records the target architecture for the Smart Community System. It describes intended boundaries rather than claiming that components have already been implemented.

## System context

The system serves three primary user groups:

- residents who submit and track community reports;
- council staff who validate, prioritise, assign, and resolve reports; and
- administrators who manage access, categories, settings, and audit information.

## Target components

```text
Resident / Staff / Administrator
              |
           HTTPS
              |
        React web client
              |
      ASP.NET Core Web API
        |               |
Entity Framework Core   Photograph service
        |               |
    PostgreSQL       Amazon S3
```

For local development, PostgreSQL will run in Docker and photograph storage may use a development-safe adapter. The planned production environment uses Amazon EC2 for the application, Amazon RDS for PostgreSQL, and Amazon S3 for photographs.

## Application boundaries

### Web client

- Presents role-appropriate interfaces.
- Provides accessible forms and client-side feedback.
- Does not make authorisation decisions.
- Sends validated request shapes to the API over HTTPS.

### Web API

- Authenticates requests and enforces role-based permissions.
- Applies business rules and server-side validation.
- Coordinates report workflows, notifications, and audit events.
- Exposes documented, versioned endpoints.

### Relational data

- Stores users, roles, reports, categories, assignments, statuses, comments, feedback, notifications, and audit metadata.
- Uses migrations and integrity constraints.
- Stores photograph references and metadata, not photograph binaries.

### Object storage

- Stores uploaded photographs with private-by-default permissions.
- Uses generated object identifiers rather than user-provided paths.
- Serves authorised content through time-limited access where appropriate.

## Core design principles

1. **Least privilege:** users and services receive only the permissions required for their role.
2. **Server-side enforcement:** validation, workflow rules, and authorisation are enforced by the API.
3. **Privacy by design:** collect the minimum necessary information and protect precise locations and photographs.
4. **Traceability:** important report and administrative changes produce audit records.
5. **Accessible by default:** interfaces support keyboard use, semantic labels, visible focus, and sufficient contrast.
6. **Replaceable infrastructure:** business logic is kept independent from specific storage and notification providers.
7. **Observable operations:** failures are logged for diagnosis without exposing secrets or unnecessary personal data.

## Initial report lifecycle

```text
Submitted -> Under Review -> Assigned -> In Progress -> Resolved -> Closed
```

Rejected and reopened paths may be added when their rules, permissions, and audit requirements are defined.

## Security boundaries

- Browser input, uploaded files, and external service responses are untrusted.
- Authentication credentials and cloud keys must never be stored in the repository.
- Public views must not expose resident identity or sensitive location details.
- Administrative actions require explicit permissions and audit coverage.
- Production services must use HTTPS, managed secrets, backups, monitoring, and tested recovery procedures.

## Decisions still required

- Authentication and token strategy.
- Notification channels and provider.
- Duplicate-report detection rules.
- Geocoding and map provider, if any.
- Operational retention schedule.
- Production AWS region and network topology.
- Recovery objectives, monitoring, and alerting thresholds.
