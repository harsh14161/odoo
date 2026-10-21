# TransitOps — Smart Transport Operations Platform

A full-stack transport operations platform: vehicle registry, driver management,
trip dispatch, maintenance workflow, fuel & expense tracking, dashboard KPIs,
and reports — built on **MongoDB + Express + React + Node ("MERN" stack)**.

> Note: the request asked for "MERN using Postgres." MERN's "M" is normally
> MongoDB, which is a NoSQL document store — it isn't a drop-in replacement
> target for a relational database. So this app uses PostgreSQL as the
> database with Sequelize as the ORM, and Express/React/Node for the rest
> of the stack (i.e. **MERN**), which is the correct combination for a
> Postgres-backed app.

## Stack

- **Database:** MongoBD
- **Backend:** Node.js, Express, JWT auth, bcrypt
- **Frontend:** React (Vite), React Router, Axios
- **Auth:** Email/password login, JWT, Role-Based Access Control (RBAC)

## Project Structure

```
transitops/
├── backend/
│   ├── src/
│   │   ├── config/db.js          # Sequelize/Postgres connection
│   │   ├── models/                # User, Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense
│   │   ├── middleware/auth.js     # JWT auth + RBAC middleware
│   │   ├── controllers/           # Business logic incl. all mandatory rules
│   │   ├── routes/
│   │   ├── app.js
│   │   ├── server.js              # entrypoint, connects DB + syncs models
│   │   └── seed.js                # creates demo users/vehicles/drivers
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/axios.js           # axios instance w/ JWT interceptor
│   │   ├── context/AuthContext.jsx
│   │   ├── components/            # Navbar, ProtectedRoute
│   │   ├── pages/                 # Login, Dashboard, Vehicles, Drivers, Trips,
│   │   │                          # Maintenance, FuelExpenses, Reports
│   │   ├── App.jsx
│   │   └── styles.css
│   ├── package.json
│   └── .env.example
├── docker-compose.yml              # spins up Postgres locally
└── README.md
```

## Roles (RBAC)

| Role | Permissions |
|---|---|
| `admin` | Full access to everything |
| `fleet_manager` | Manage vehicles, maintenance, view all, dispatch trips |
| `driver` | Create/dispatch/complete trips |
| `safety_officer` | Manage drivers, suspend/reinstate |
| `financial_analyst` | View reports, log expenses |

## Mandatory Business Rules Implemented

- Vehicle registration number is unique (DB constraint + explicit check).
- Retired / In Shop vehicles are excluded from the `/vehicles/available` dispatch pool.
- Drivers with expired licenses or `Suspended` status are excluded from `/drivers/available`
  and are re-validated (defense-in-depth) at dispatch time.
- A vehicle/driver already `On Trip` cannot be dispatched again (checked at dispatch time
  inside a DB transaction with row locks to avoid race conditions).
- Cargo weight is validated against the vehicle's max load capacity at both trip creation
  and dispatch time.
- Dispatching a trip atomically sets vehicle + driver to `On Trip`.
- Completing a trip (requires final odometer + fuel consumed) atomically restores both to
  `Available`, updates the vehicle's odometer, computes actual distance, and logs a fuel entry.
- Cancelling a `Dispatched` trip restores vehicle + driver to `Available`; cancelling a `Draft`
  trip has no side effects.
- Creating an **Active** maintenance record automatically flips the vehicle to `In Shop`
  (blocked if the vehicle is currently `On Trip`).
- Closing a maintenance record restores the vehicle to `Available`, unless it's `Retired`
  or has other open maintenance records.

## Setup

### 1. Database (MongoDB)

Easiest path — Docker:

```bash
docker compose up -d
```

This starts Postgres on `localhost:5432` with db `transitops` / user `postgres` / password `postgres`
(matches `backend/.env.example`). If you already have Postgres installed locally, just create a
database named `transitops` instead.

### 2. Backend

```bash
cd backend
cp .env.example .env      # edit if your DB creds differ
npm install
npm run seed               # creates tables + demo users/vehicles/drivers
npm run dev                # starts on http://localhost:5000
```

Demo accounts created by `npm run seed` (password for all: `Password123!`):

- `admin@transitops.com` — admin
- `fleet@transitops.com` — fleet_manager
- `driver@transitops.com` — driver
- `safety@transitops.com` — safety_officer
- `finance@transitops.com` — financial_analyst

### 3. Frontend

```bash
cd frontend
cp .env.example .env      # points to http://localhost:5000/api by default
npm install
npm run dev                 # starts on http://localhost:5173
```

Open `http://localhost:5173`, log in with any demo account above.

## API Overview

| Method | Endpoint | Notes |
|---|---|---|
| POST | `/api/auth/register` | Create a user |
| POST | `/api/auth/login` | Returns JWT |
| GET | `/api/dashboard/kpis` | KPIs, filterable by `type`, `status`, `region` |
| GET/POST/PUT/DELETE | `/api/vehicles` | Vehicle CRUD |
| GET | `/api/vehicles/available` | Dispatch-eligible vehicles only |
| GET/POST/PUT/DELETE | `/api/drivers` | Driver CRUD |
| GET | `/api/drivers/available` | Dispatch-eligible drivers only |
| GET/POST | `/api/trips` | Trip CRUD (creates as `Draft`) |
| PUT | `/api/trips/:id/dispatch` | Draft → Dispatched |
| PUT | `/api/trips/:id/complete` | Dispatched → Completed |
| PUT | `/api/trips/:id/cancel` | Draft/Dispatched → Cancelled |
| GET/POST/PUT/DELETE | `/api/maintenance` | Maintenance workflow |
| GET/POST/DELETE | `/api/fuel-logs` | Fuel logging |
| GET/POST/DELETE | `/api/expenses` | Toll/other expenses |
| GET | `/api/reports/vehicles` | Fuel efficiency, utilization, cost, ROI per vehicle |
| GET | `/api/reports/vehicles/export/csv` | CSV export |

## Bonus Features Not Yet Implemented

Charts/visual analytics, PDF export, email reminders for expiring licenses, document
management, dark mode. The architecture (React + Express) makes each straightforward to
add — e.g. charts via `recharts`, PDF export via the `pdf` skill/`pdfkit`, license
reminders via a scheduled job (`node-cron`) + an email provider.
