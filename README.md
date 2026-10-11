# Velora

Velora is an emergency medicine discovery platform designed to help people find urgently needed medicines quickly. Instead of calling multiple pharmacies or travelling from shop to shop, a user searches for a medicine and sees nearby verified pharmacies that are open right now and have it in stock, ordered by distance.

Each result shows directions, current stock availability, and how recently the pharmacy updated its stock. If the requested medicine is unavailable nearby, Velora suggests alternatives with the same active ingredient. Users can also reserve one unit for 30 minutes so the medicine is still available when they arrive.

## Project Status

This repository currently contains the architecture and system design documentation for Velora. The application implementation is planned from these documents.

- [Backend Architecture](docs/backend.html)
- [Frontend Architecture](docs/frontend.html)
- [System Flowcharts](docs/system-flowcharts.html)

## Problem Statement

When someone needs medicine urgently, the usual process is slow and uncertain:

- searching for nearby pharmacies manually
- calling multiple shops to ask about stock
- travelling without knowing whether the medicine is still available
- discovering late that the shop is closed or the medicine is out of stock

Velora solves this by combining live pharmacy availability, verified pharmacy onboarding, stock freshness indicators, medicine alternatives, and short-term reservation.

## Key Features

### Patient Features

- Search medicines without logging in
- View nearby pharmacies that are currently open
- See pharmacies sorted by nearest distance
- Check stock availability and last stock update time
- Get directions to the selected pharmacy
- Reserve one unit for 30 minutes
- View and cancel active holds
- See alternative medicines with the same ingredient when the searched medicine is not available nearby

### Pharmacist Features

- Register a pharmacy on Velora
- Submit licence details for verification
- Maintain medicine stock and prices
- Update opening hours
- View incoming holds
- Mark reserved medicine as collected

### Admin Features

- Manually verify pharmacy licences before pharmacies appear in search
- Approve, reject, suspend, or reinstate pharmacies
- Monitor expiring licences
- Check missing hours and expired holds
- Rebuild the MongoDB search copy when required

## User Roles

| Role | Purpose |
| --- | --- |
| Patient | Searches medicines, views pharmacies, places and manages holds |
| Pharmacist | Maintains pharmacy profile, stock, hours, and reservations |
| Admin | Verifies licences and manages compliance |

## Architecture Overview

Velora is designed as a modular monolith with one frontend application, one backend API, and two databases.

```text
Browser / React SPA
        |
        v
Express + TypeScript REST API
        |
        +--> PostgreSQL via Prisma ORM
        |
        +--> MongoDB search copy
```

The main architectural rule is:

> PostgreSQL decides, MongoDB copies.

PostgreSQL is the source of truth for users, pharmacies, stock, holds, licences, hours, and audit data. MongoDB is used only as a read-optimized search copy and can be rebuilt from PostgreSQL.

## Technology Stack

### Frontend

- React 18
- TypeScript
- Vite
- React Router v6
- TanStack Query
- React Hook Form
- Zod
- Tailwind CSS

### Backend

- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- MongoDB
- JSON Web Tokens
- bcrypt

### Deployment Plan

- Frontend: Vercel
- Backend: Heroku
- PostgreSQL: managed PostgreSQL database
- MongoDB: MongoDB Atlas

## Core Workflows

### Medicine Search

1. Patient enters a medicine name and location.
2. Frontend calls the public search API.
3. Backend reads from the MongoDB search copy for fast results.
4. Results are filtered to show verified pharmacies that are open and have stock.
5. Pharmacies are sorted by distance.
6. If no nearby stock is found, the system returns alternative medicines with the same active ingredient.

### Stock Hold

1. Patient selects Hold on a pharmacy result.
2. Backend verifies the user is a patient.
3. PostgreSQL transaction checks whether at least one unit is available.
4. If stock exists, quantity is decremented and a hold is created.
5. Hold remains active for 30 minutes.
6. Patient may cancel the hold, or the pharmacist may mark it as collected.

This flow is correctness-critical because two patients may try to reserve the last available unit at the same time. The hold operation is handled inside a PostgreSQL transaction so only one request can succeed.

### Pharmacy Verification

1. Pharmacist registers a pharmacy and submits licence information.
2. Pharmacy starts in a pending state.
3. Admin manually checks the licence.
4. Admin approves or rejects the pharmacy.
5. Only verified pharmacies appear in public search results.

## Planned Backend Structure

```text
server/
|- prisma/
|  |- schema.prisma
|  |- migrations/
|  `- seed.ts
|- data/
`- src/
   |- server.ts
   |- app.ts
   |- config/
   |- routes/
   |- controllers/
   |- services/
   |- middlewares/
   |- validators/
   |- db/
   |- types/
   `- utils/
```

The backend follows an MVC-style layered structure:

- routes define paths and middleware chains
- controllers read requests and send responses
- services contain business rules and database operations
- middleware handles authentication, authorization, validation, not found, and error handling
- Prisma manages PostgreSQL access
- MongoDB stores the rebuildable search copy

## Planned Frontend Structure

```text
client/src/
|- main.tsx
|- app/
|- api/
|- features/
|  |- auth/
|  |- search/
|  |- pharmacy/
|  |- holds/
|  |- pharmacist/
|  `- admin/
|- components/
|- hooks/
`- lib/
```

The frontend is organized by feature. API calls are isolated in the API layer, server state is handled with TanStack Query, and protected pages are guarded by authentication and role checks.

## API Overview

All backend endpoints are planned under:

```text
/api/v1
```

Main endpoint groups:

| Group | Purpose |
| --- | --- |
| `/auth` | Register, login, refresh, logout, current user |
| `/search` | Medicine search, suggestions, areas |
| `/holds` | Place, list, and cancel patient holds |
| `/pharmacies` | Pharmacy registration, stock, hours, incoming holds |
| `/admin` | Verification, compliance, search index rebuild |

## Data Model Summary

The planned PostgreSQL schema includes:

- users
- pharmacies
- medicines
- stock items
- holds
- pharmacy credentials
- operating hours
- refresh tokens
- audit logs

The planned MongoDB search copy includes:

- pharmacy search documents
- medicine suggestion documents

## Security and Trust

- JWT access tokens for protected API requests
- Refresh tokens stored through PostgreSQL
- Passwords hashed with bcrypt
- Role-based access control for patient, pharmacist, and admin flows
- Manual admin verification before a pharmacy appears in search
- Backend authorization remains the source of truth even when frontend routes are guarded

## Reliability Rules

- PostgreSQL is the source of truth
- MongoDB search data is rebuildable
- Holds are created inside ACID transactions
- No external network work happens inside database transactions
- Expired holds can be handled lazily when relevant hold operations run
- Search remains public, but reservations require authentication

## Testing Plan

Planned test coverage focuses on workflows where incorrect behavior would directly affect users:

- medicine search loading, empty, and error states
- hold placement success and stock conflict handling
- hold countdown and cancellation
- authentication token refresh
- role-based route protection
- pharmacy stock updates
- admin pharmacy verification

## Documentation

The detailed design is available in the `docs/` directory:

- `docs/system-flowcharts.html` explains end-to-end system behavior and flowcharts.
- `docs/backend.html` explains backend architecture, routes, services, transactions, data model, and deployment.
- `docs/frontend.html` explains frontend routes, state management, API client, forms, accessibility, and testing.

## Vision

Velora aims to make urgent medicine discovery faster, safer, and more reliable by connecting patients with verified pharmacies that maintain fresh stock and opening-hour information.
