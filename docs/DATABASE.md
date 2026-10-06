# Proposed Database Design

This document defines the PostgreSQL data model for the Smart Community System. Week 4 created `users`; Week 5 added reporting; Week 7 added comments; Week 8 added staff workflow data; Week 9 normalises roles and adds `system_settings` and `audit_logs`.

Week 9 migrated the initial `users.role` values into seeded `roles` and composite-key `user_roles` records before dropping the legacy column. Users can now hold multiple roles, and `users.is_active` blocks inactive accounts. Week 5 report references use `SC-<year>-<12 hexadecimal characters>` and are protected by a unique database index. A report can also store `latitude`, `longitude`, and `google_place_id` supplied by the Google Maps picker.

## Design goals

- Use UUID primary keys for externally referenced business records.
- Keep roles and permissions separate from user accounts.
- Preserve report assignment and status history instead of overwriting operational events.
- Store photograph metadata and private object-storage keys, not image binaries.
- Keep resident communication, feedback, notifications, and audit events traceable.
- Use PostgreSQL constraints, indexes, and migrations to protect data integrity.

## Proposed tables

| Domain | Table | Purpose |
| --- | --- | --- |
| Identity | `users` | Resident, staff, and administrator accounts. |
| Identity | `roles` | Named access roles. |
| Identity | `user_roles` | Many-to-many account role assignments. |
| Reporting | `categories` | Administrator-managed issue categories. |
| Reporting | `report_statuses` | Ordered workflow status definitions. |
| Reporting | `reports` | The main community issue record and location. |
| Workflow | `report_photos` | Metadata for privately stored report images. |
| Workflow | `assignments` | Report assignment history for council staff. |
| Workflow | `duplicate_reviews` | Staff-recorded potential duplicate relationships without automatic deletion. |
| Workflow | `status_history` | Immutable report status transitions. |
| Workflow | `comments` | Chronological resident and staff report discussion. |
| Engagement | `notifications` | Delivery and read state for report updates. |
| Engagement | `feedback` | One resident rating after report resolution. |
| Governance | `audit_logs` | Important security and administrative activity. |
| Governance | `system_settings` | Versioned operational configuration values. |

## Key constraints and indexes

- Unique indexes: `users.email`, `roles.name`, `categories.name`, `report_statuses.code`, `reports.reference_no`, and `report_photos.object_key`.
- Composite primary key: `user_roles(user_id, role_id)`.
- One feedback record per report: unique `feedback.report_id`.
- Priority constraint: `reports.priority` is Low, Normal, High, or Urgent.
- One directional duplicate-review record per report pair.
- Rating constraint: `feedback.rating BETWEEN 1 AND 5`.
- Coordinate constraints: latitude from -90 to 90 and longitude from -180 to 180.
- Coordinate pair constraint: latitude and longitude must either both be present or both be null; manually entered locations can omit both.
- Report lookup indexes: `(resident_id, submitted_at DESC)`, `(current_status_id, priority, submitted_at)`, and `(category_id, submitted_at)`.
- Workflow indexes: `(report_id, changed_at)`, `(report_id, assigned_at)`, and `(report_id, created_at)` for comments.
- Staff workload index: `(assigned_to_user_id, assigned_at)` for assignment history.
- Comment bodies are limited to 1,000 characters and retain their author and creation timestamp.
- Notification index: `(recipient_id, read_at, created_at DESC)`.
- Audit index: `(entity_type, entity_id, created_at DESC)` and `(actor_user_id, created_at DESC)`.
- Settings use approved keys, a version number, last editor, and last-update timestamp; secrets are excluded.
- Audit rows are append-only through the application API and store action, actor, entity, details, and UTC timestamp.

## Status and status history

The two status tables serve different purposes and are connected by a foreign key:

- `report_statuses` is the status lookup table. It defines allowed values such as Submitted, Under Review, Assigned, In Progress, Resolved, and Closed.
- `reports.current_status_id` points to `report_statuses.id` for fast access to a report's current status.
- `status_history.status_id` points to `report_statuses.id`. Each row records one status transition, including the report, person making the change, optional note, and timestamp.

Therefore, history is not stored as a column inside `report_statuses`; it is stored as related rows in `status_history` so every change remains traceable.

## Retention and security notes

- Passwords must be stored only as hashes produced by the selected ASP.NET Core identity implementation.
- Precise coordinates, comments, photographs, notification content, IP addresses, and audit metadata may contain personal or sensitive information and require role-based access.
- Deleting a category or status already used by a report should be restricted; deactivate it instead.
- Operational history should normally use restricted deletion, while user-facing dependent data should follow an approved retention policy.
- Timestamps should use PostgreSQL `timestamptz` and be stored in UTC.
