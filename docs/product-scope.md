# K-RiskHub Product Scope

## Identity

Product name: K-RiskHub.

The system must not display Cast branding or mention Kynovia. The UI should use a neutral modern SaaS visual identity inspired by the current preferred style direction.

## Roles

| Role | Access |
| --- | --- |
| Admin | Full access to users, clients, projects, risks, dashboards, exports, and reports. |
| GP | Access to assigned projects and their risks, plans, exports, and reports. |
| Cliente | Read-only access to linked clients/projects, dashboards, exports, and reports as permitted. |
| Portfolio Manager | Multi-client and multi-project visibility for management and consolidation. |
| Diretor | Executive visibility across portfolios, usually read-oriented. |

## Required Screens

- Login with Microsoft, Google, email/password, and password reset.
- User profile after login.
- Administration for users, profiles, clients, projects, and assignments.
- Client CRUD.
- Project CRUD with project number.
- Project manager and responsible person CRUD.
- Risk and issue management.
- Mitigation plan management.
- Project dashboard.
- Client dashboard.
- Portfolio dashboard.
- Excel export using the official `.xlsm` template.
- Word/PDF report generation.

## Official Excel Export

Template: `TP-0801_Controle e Gerenciamento de Riscos.xlsm`.

The export must preserve the workbook and fill the official input cells instead of creating a generic workbook from scratch.

Main input sheet: `01 Inventario de Riscos` / `01 Inventário de Riscos`.

Input range: rows `5:44`.

| Field | Excel Column |
| --- | --- |
| Sequence | B |
| Group | C |
| Phase | D |
| Risk description | E |
| Origin | F |
| Identification date | G |
| Main impact | I |
| Probability label | J |
| Impact label | K |
| Response plan | Q |
| Action | R |
| Responsible | S |
| Status | T |
| Risk closure date | U |

Columns L, M, N, and O are formula-driven and should be preserved.

Open decision: align risk severity thresholds between the current prototype and the official workbook.
