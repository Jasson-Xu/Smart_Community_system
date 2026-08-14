# Contributing

Thank you for helping improve the Smart Community System. Contributions should remain aligned with the approved project scope and protect the safety and privacy of potential users.

## Before contributing

1. Read the [requirements](docs/REQUIREMENTS.md), [architecture](docs/ARCHITECTURE.md), [privacy policy](PRIVACY.md), and [security policy](SECURITY.md).
2. Check existing issues and pull requests before starting overlapping work.
3. Discuss changes that alter scope, architecture, data collection, permissions, or cloud services before implementation.
4. Never use real resident or council data in development or tests.

## Development workflow

1. Create a focused branch from the latest `main` branch.
2. Keep changes small enough to review and test confidently.
3. Use clear commit messages written in the imperative mood.
4. Add or update tests and documentation with behavioural changes.
5. Run the relevant formatting, build, test, and security checks.
6. Open a pull request using the repository template.

## Quality standards

- Prefer clear, maintainable code over unnecessary abstraction.
- Keep the React client, API/business logic, data access, and storage responsibilities separated.
- Validate requests on the server even when the client also validates them.
- Enforce permissions in the API rather than relying on hidden interface controls.
- Use accessible semantic markup, keyboard support, visible focus, labelled controls, and sufficient contrast.
- Avoid logging secrets, authentication tokens, precise private locations, or unnecessary personal information.
- Keep documentation consistent with implemented behaviour.

## Pull requests

A pull request should explain the problem, the chosen solution, testing performed, security/privacy impact, and any follow-up work. It should not mix unrelated refactoring with a feature or fix.

## Reporting issues

Use GitHub issues for reproducible bugs and scoped feature proposals. Do not include personal information or vulnerability details. Follow [SECURITY.md](SECURITY.md) for security reports.

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).
