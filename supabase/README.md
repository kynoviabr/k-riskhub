# Supabase

This folder contains database migrations for K-RiskHub.

## Initial Migration

`20260530133000_initial_schema.sql` creates:

- application roles
- clients
- projects with `project_number`
- project members
- responsible people
- risks
- mitigation plans
- comments
- exports
- reports
- audit log
- helper functions for RLS
- base Row Level Security policies
- an Auth trigger that creates a default `client` profile after first login

## UX Approval Rule

Database and backend migrations can progress independently, but every new screen, material UX change, and visual pattern must be reviewed before it becomes the product baseline.

## First Admin

New users are created as `client` by default. Promote the first administrator from the Supabase SQL editor after their first login:

```sql
update public.profiles
set role = 'admin'
where email = 'admin@example.com';
```
