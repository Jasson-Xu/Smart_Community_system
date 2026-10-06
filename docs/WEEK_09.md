# Week 9 Administration and Audit

## Goal

Give administrators controlled tools for access, category, and non-secret configuration management while recording every important change.

## Implemented

- Migrated existing role values into seeded `roles` and composite-key `user_roles` tables before removing `users.role`.
- Added multi-role authentication claims and session revalidation against current database roles and account status.
- Added account activation and deactivation with immediate login/session enforcement.
- Prevented administrators from deactivating themselves or removing their own Administrator role.
- Protected the final active administrator from deactivation or role removal.
- Added issue category creation, editing, ordering, activation, and deactivation while preserving historical report links.
- Added a strict allowlist of documented non-secret settings with version, editor, and timestamp metadata.
- Added append-only audit entries for role, account-status, category, and setting changes.
- Added Administrator-only dashboards and responsive management pages.

## Requirement coverage

| Requirement | Week 9 result |
| --- | --- |
| FR-03 | Current multi-role claims and active-account state are revalidated on authenticated requests. |
| FR-20 | Administrators can search users, activate accounts, and replace role assignments. |
| FR-21 | Administrators can create, edit, order, activate, and deactivate issue categories. |
| FR-23 | Important administrative changes create append-only audit records. |
| FR-25 | Only allowlisted non-secret operational settings can be changed in the web interface. |

## Verification status

- API build: passed with zero warnings.
- Frontend TypeScript check: passed.
- PostgreSQL migration: applied successfully while preserving existing role assignments.
- Focused administration smoke test: passed for role isolation, self-lockout protection, multi-role session changes, inactive login rejection, category visibility, setting allowlisting, and audit records.

Week 9 implementation and local verification are complete. Week 10 starts after the project owner confirms this result.

## Deferred work

- Photograph handling remains deferred from Week 6.
- Notifications, resident feedback, and expanded dashboard statistics begin in Week 10.
