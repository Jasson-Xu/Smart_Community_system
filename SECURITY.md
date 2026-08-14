# Security Policy

## Supported versions

The project is in active development. Security fixes are applied only to the latest revision of the `main` branch until versioned releases begin.

## Reporting a vulnerability

Do not disclose suspected vulnerabilities, credentials, access tokens, personal information, or exploit details in a public issue or discussion.

Use GitHub's private vulnerability reporting feature for this repository if it is available. If it is unavailable, contact the repository owner through a private channel and provide:

- the affected component and revision;
- clear reproduction steps;
- the potential impact;
- any proof-of-concept material needed to validate the issue; and
- a safe way to contact you for follow-up.

The project owner should acknowledge a report within five business days, assess its severity, and coordinate remediation and disclosure. These targets are best-effort commitments for an individual academic project, not a service-level agreement.

## Security expectations

Contributors must:

- keep credentials and personal data out of source control;
- use environment variables or an approved secret store;
- validate all untrusted input on the server;
- enforce authentication and role-based authorisation at the API boundary;
- use parameterised database operations;
- restrict and inspect uploaded files;
- avoid exposing internal errors or sensitive logs to users;
- keep dependencies supported and review vulnerability alerts; and
- add or update tests for security-sensitive behaviour.

## Secrets committed by mistake

Immediately revoke or rotate the exposed secret. Removing it from the latest commit is not sufficient because it may remain in Git history, caches, logs, or forks. After rotation, notify the project owner privately so repository history and downstream exposure can be assessed.

## Personal information

Development and testing must use synthetic data. Security reports must not contain personal information collected from real residents or council systems. See [PRIVACY.md](PRIVACY.md).
