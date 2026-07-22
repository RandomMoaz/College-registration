# 🎓 College Registration

A full-stack **University Online registration system**. Students register for courses
(with live prerequisite and GPA-based credit-limit checks), view their schedule and
exam seating; staff view class rosters and exam schedules. Built as a single deployable
app: an **Express + SQLite** API that also serves a **React (Vite)** frontend.

---

## 🚀 Quick start (one command)

Requires **Node.js 20+**. From the project root:

```powershell
npm run demo
```

That installs both apps, builds the frontend, and starts everything on one port.
Then open **http://localhost:4000**.

> `npm run demo` = `npm run setup` (install + build) followed by `npm start`.
> Already set up once? Just run `npm start`.

### Demo logins
| Role    | Email             | Password |
|---------|-------------------|----------|
| Student | `student@uni.edu` | `1234`   |
| Staff   | `staff@uni.edu`   | `1234`   |

---

## ✨ Features

**Student**
- Log in and see profile: GPA, earned vs. total program credits, completed courses with grades.
- Browse **open courses** — only those whose prerequisites are met and not already passed.
- **Register** with server-side validation: prerequisite checks and a GPA-based credit-hour limit
  (3.5+ → 21 cr, 3.0+ → 18, 2.0+ → 15, below → 12).
- View the resulting **weekly schedule** (lectures / labs / sections, rooms, instructors) and total cost.
- During exam season, view **exam dates, halls, and seat numbers**.

**Staff**
- View the courses they teach with enrollment counts.
- View full **class rosters** (student id, name, GPA, status).
- View the **exam schedule** for their courses.

**Auth** — signed (HMAC) bearer tokens, role-based access (student vs. staff).

---

## 🧱 Tech stack

| Layer     | Tech |
|-----------|------|
| Frontend  | React 19 + Vite |
| Backend   | Node.js + Express |
| Database  | SQLite (`better-sqlite3`) |
| Auth      | HMAC-signed tokens, role-based middleware |

---

## 🛠️ Development mode (hot reload)

Run the API and UI separately in two terminals — Vite proxies `/api` to the backend:

```powershell
# terminal 1 — API on http://localhost:4000
npm run dev:api

# terminal 2 — UI on http://localhost:5173
npm run dev:ui
```

Open http://localhost:5173.

---

## 📁 Project structure

```
College-registration/
├── package.json        # root scripts: demo / setup / start / dev
├── Backend/            # Express API (also serves the built frontend)
│   ├── server.js       # routes + static hosting of Frontend/dist
│   ├── database.js     # SQLite setup & queries
│   └── data.js         # seed data (courses, users, offerings, exams)
└── Frontend/           # React + Vite app
    └── src/            # App, Login, Student/Staff panels, api client
```

---

## ⚙️ Configuration (optional, for deployment)

| Variable     | Default                | Notes |
|--------------|------------------------|-------|
| `PORT`       | `4000`                 | Port the server listens on. |
| `JWT_SECRET` | `dev-secret-change-me` | **Change in production** — signs auth tokens. |

> Data lives in SQLite (`Backend/college.db`). On hosts with an ephemeral
> filesystem, registrations reset on redeploy — fine for a demo.
