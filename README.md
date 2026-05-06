# Restaurant Reservations & Host Seating

A small full-stack demo app for a class project.

- **Backend:** Node.js + Express + MongoDB (Mongoose)
- **Frontend:** React + Vite
- Two roles: **Guest** (book a table) and **Host** (manage reservations and seating)

---

## Prerequisites

- Node.js 18+ and npm
- MongoDB running locally on the default port `27017`

### Starting MongoDB locally (Windows)

Pick whichever applies to your install:

- **Installed as a Windows service:**
  ```
  net start MongoDB
  ```
- **Manual binary:**
  ```
  mongod --dbpath C:\data\db
  ```
- **MongoDB Compass / Atlas:** open Compass and connect to `mongodb://127.0.0.1:27017`, or update `MONGO_URI` in `backend/.env` to point at a remote cluster.
- **Docker (any OS):**
  ```
  docker run -d --name mongo -p 27017:27017 mongo:7
  ```

The app uses the database name `restaurant_reservations` — it is created automatically the first time something is written.

---

## First-time Setup

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env        # on Windows PowerShell: Copy-Item .env.example .env
npm run seed                # populates 6 tables and 5 sample reservations

# 2. Frontend (in a second terminal)
cd frontend
npm install
```

`.env` defaults are usually fine:

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/restaurant_reservations
```

---

## Running the App

Open **two** terminals:

```bash
# Terminal 1 — backend
cd backend
npm run dev
# → API listening on http://localhost:5000
```

```bash
# Terminal 2 — frontend
cd frontend
npm run dev
# → Vite dev server on http://localhost:5173
```

Then open **http://localhost:5173** in your browser.

The Vite dev server proxies `/api/*` to the backend, so the React app and the
Express API behave like one origin during development.

---

## Routes

### Frontend
| Route | Page |
|------|------|
| `/` | Home / landing |
| `/reserve` | Guest reservation form |
| `/confirmation/:id` | Booking confirmation |
| `/host` | Host dashboard (reservations + tables tabs) |

### Backend (REST API)

Reservations:
- `GET    /api/reservations` — supports `?date=YYYY-MM-DD&status=pending`
- `GET    /api/reservations/:id`
- `POST   /api/reservations`
- `PATCH  /api/reservations/:id`
- `DELETE /api/reservations/:id`

Tables:
- `GET   /api/tables`
- `POST  /api/tables`
- `PATCH /api/tables/:id`

Health check: `GET /api/health`

---

## Project Structure

```
Final/
├── backend/
│   ├── server.js
│   ├── config/db.js
│   ├── models/        # Reservation.js, Table.js
│   ├── controllers/   # reservationController.js, tableController.js
│   ├── routes/        # reservationRoutes.js, tableRoutes.js
│   ├── middleware/errorHandler.js
│   └── seed/seed.js
└── frontend/
    ├── vite.config.js
    └── src/
        ├── App.jsx, main.jsx, index.css
        ├── api/client.js
        ├── components/  # Navbar, ReservationList, ReservationRow, ReservationFilters, StatusBadge, TableGrid
        └── pages/       # Home, ReserveForm, Confirmation, HostDashboard
```

---

## How Status & Seating Stay In Sync

The reservation controller has a small helper, `syncTableForReservation`, that
updates the linked Table whenever a reservation changes:

| Reservation state | Effect on linked table |
|-------------------|------------------------|
| `pending` + table assigned | Table → `reserved` |
| `seated` | Table → `occupied` |
| `completed`, `cancelled`, `no-show` | Table → `available`, link cleared |
| Reservation deleted | Linked table is freed |

Conversely, marking a table `available` from the Tables tab will free any
reservation that was attached to it (and move a `seated` reservation to
`completed`).

---

## Resetting Sample Data

```bash
cd backend
npm run seed
```

This wipes the `tables` and `reservations` collections and re-seeds them.

---

## Known Limitations

- **No authentication.** The "Host" view is a route, not a login. This is by design for a class/demo project.
- **No double-booking guard.** Two reservations can be assigned to the same table — the host UI surfaces table status so this is visible, but it isn't prevented.
- **Date handling is naive.** `reservationDate` is stored as a `YYYY-MM-DD` string and uses the host's local date. There's no time-zone normalization.
- **No tests.** Verification is manual via the UI and `curl`.
- **Validation is basic.** Server side relies on Mongoose schema validation plus a small phone-or-email check; client side has lightweight inline checks. It's enough for a demo, not for production.
- **No pagination.** The reservation list returns everything matching the filter.
