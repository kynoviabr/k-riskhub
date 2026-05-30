# Technical Plan

## Stack

- Next.js App Router
- TypeScript
- Supabase Auth
- Supabase Postgres with Row Level Security
- Supabase Edge Functions for secure server-side work
- Server-side Excel export based on the official `.xlsm` template
- Server-side Word/PDF report generation

## Authentication

Supported methods:

- Microsoft OAuth
- Google OAuth
- Email/password
- Password reset

Microsoft should be prioritized for B2B clients because many organizations use Microsoft 365 and Microsoft Entra ID.

## Initial Data Model

Core tables:

- `profiles`
- `clients`
- `projects`
- `project_members`
- `responsibles`
- `risks`
- `risk_mitigation_plans`
- `risk_comments`
- `exports`
- `reports`
- `audit_log`

## Access Rules

| Resource | Admin | GP | Cliente | Portfolio Manager | Diretor |
| --- | --- | --- | --- | --- | --- |
| Users | Full | None | None | None | None |
| Clients | Full | Linked | Linked read | Managed set | Broad read |
| Projects | Full | Assigned | Linked read | Managed set | Broad read |
| Risks | Full | Assigned project edit | Linked read | Managed set | Broad read |
| Mitigation plans | Full | Assigned project edit | Linked read | Managed set | Broad read |
| Excel export | Full | Assigned projects | Allowed linked projects | Managed set | Broad read |
| Reports | Full | Assigned projects | Allowed linked projects | Managed set | Broad read |

## Export Service

The export service should:

1. Load the official `.xlsm` template.
2. Clear editable input rows in `01 Inventário de Riscos`.
3. Fill rows `5:44` with project risks.
4. Preserve formulas, validations, styles, charts, and workbook structure.
5. Set workbook recalculation flags.
6. Return an `.xlsm` download.

The app should block export or warn the user when a project has more risks than the current template supports.
