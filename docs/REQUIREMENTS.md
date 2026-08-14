# Requirements

## Product goal

Provide a secure and accessible service through which residents can submit structured community issue reports, monitor progress, and communicate with authorised council staff throughout the issue lifecycle.

## User roles

- **Resident:** creates and tracks reports, comments, and feedback.
- **Council staff:** reviews, prioritises, assigns, and updates reports.
- **Administrator:** manages users, roles, categories, settings, and audit records.

## Functional requirements

| ID | Requirement |
| --- | --- |
| FR-01 | The system shall allow residents to create an account. |
| FR-02 | The system shall allow registered users to log in and log out. |
| FR-03 | The system shall apply access permissions according to user roles. |
| FR-04 | The system shall allow residents to submit community issue reports. |
| FR-05 | The system shall allow residents to select an issue category. |
| FR-06 | The system shall allow residents to enter a description and location. |
| FR-07 | The system shall allow residents to upload supporting photographs. |
| FR-08 | The system shall validate required information before submission. |
| FR-09 | The system shall generate a unique reference number for each report. |
| FR-10 | The system shall allow residents to view their submitted reports. |
| FR-11 | The system shall display the current status of each report. |
| FR-12 | The system shall allow staff to search and filter reports. |
| FR-13 | The system shall allow authorised staff to set report priorities. |
| FR-14 | The system shall allow staff to assign reports. |
| FR-15 | The system shall allow staff to update report statuses. |
| FR-16 | The system shall maintain a history of status changes. |
| FR-17 | The system shall allow residents and authorised staff to add comments. |
| FR-18 | The system shall notify residents of important status changes. |
| FR-19 | The system shall allow residents to provide feedback after resolution. |
| FR-20 | The system shall allow administrators to manage users and roles. |
| FR-21 | The system shall allow administrators to manage issue categories. |
| FR-22 | The system shall provide basic dashboard statistics. |
| FR-23 | The system shall record important activities in an audit log. |

## Non-functional requirements

### Performance

- Standard pages should load within three seconds under normal operating conditions.
- Search and filtering should return results without unreasonable delay.
- The system should support concurrent resident and staff activity.

### Security

- Passwords must use an established secure hashing implementation.
- Production communication must use HTTPS.
- API endpoints must enforce role-based authorisation.
- Server-side validation must cover all untrusted input.
- Database access must use Entity Framework Core or parameterised operations.
- Uploads must be restricted by type, size, name, and storage permission.
- Secrets must be supplied through protected configuration and never committed.

### Reliability

- Transactions and constraints must protect important data relationships.
- Important actions and timestamps must remain traceable.
- Production data must use managed backups and tested recovery procedures.
- User-facing errors must not expose sensitive implementation details.

### Usability and accessibility

- Navigation, labels, actions, and status indicators must be consistent.
- Interfaces must support keyboard navigation and visible focus.
- Forms must use programmatically associated labels and actionable error messages.
- Meaning must not depend on colour alone.
- Layouts must remain usable on supported desktop and mobile viewports.

### Maintainability

- The web client, business logic, data access, and file storage must remain separated.
- Public APIs must be documented.
- Database changes must use repeatable migrations.
- Behavioural changes must include relevant automated tests and documentation.

## Initial scope exclusions

- Native mobile applications.
- AI image recognition or automatic issue classification.
- Emergency service dispatch.
- Automatic multilingual translation.
- Integration with existing council systems.

## Definition of done

A backlog item is complete when its acceptance criteria are met, relevant automated and manual checks pass, no critical defect remains, privacy and security impacts have been considered, and associated documentation is current.
