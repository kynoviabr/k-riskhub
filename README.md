# K-RiskHub

K-RiskHub is a modern SaaS application for project risk management.

## Current Direction

- Next.js application with a clean left-navigation SaaS interface.
- Supabase planned for authentication, authorization, database, and server-side services.
- Login methods planned: Microsoft, Google, email/password, password reset.
- Official Excel export must preserve the existing `.xlsm` model.
- No Cast logo, no Kynovia mention. The visual identity is neutral and product-owned.

## Core Modules

- Login and profile
- User administration
- Clients
- Projects, including project number
- Project managers and responsible people
- Risks, issues, mitigation plans, and statuses
- Project, client, and portfolio dashboards
- Excel export and report generation

## Development

```bash
npm install
npm run dev
```

## Environment

Create `.env.local` from `.env.example` and fill the Supabase anon/publishable key:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://eacazrjltglfmkometgi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-or-anon-key
```

OAuth callback URL for Supabase providers:

```text
http://localhost:3000/auth/callback
```
