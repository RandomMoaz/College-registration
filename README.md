# 🎓 College Registration

A University Online registration system — Node/Express + SQLite API with a React (Vite) frontend. Students register for courses (with prerequisite and credit-limit checks), view schedules and exams; staff view rosters and exams.

## Demo logins
| Role    | Email             | Password |
|---------|-------------------|----------|
| Student | `student@uni.edu` | `1234`   |
| Staff   | `staff@uni.edu`   | `1234`   |

> **Windows PowerShell note:** PowerShell 5.1 doesn't support `&&`. Use `;` to
> separate commands (as shown below), or run each line on its own.

## Run locally (development)
Two terminals, hot-reload on both:
```powershell
# 1) API on http://localhost:4000
cd Backend; npm install; npm start

# 2) UI on http://localhost:5173 (Vite proxies /api -> :4000)
cd Frontend; npm install; npm run dev
```
Open http://localhost:5173.

## Run as a single service (live demo / production)
The backend serves the built frontend, so everything runs on one origin and
the frontend's relative `/api` calls work with no proxy:
```powershell
cd Frontend; npm install; npm run build   # produces Frontend/dist
cd ../Backend; npm install; npm start      # serves API + UI on one port
```
Open http://localhost:4000.

### Environment variables (set these when deploying)
| Variable       | Default                | Notes |
|----------------|------------------------|-------|
| `PORT`         | `4000`                 | Port the server listens on. |
| `JWT_SECRET`   | `dev-secret-change-me` | **Change in production** — signs auth tokens. |
| `VITE_API_URL` | `/api`                 | Frontend build-time API base. Leave unset for the single-service setup; set to `https://your-api-host/api` only if you host the frontend separately from the backend. |

## Notes
- Data is stored in SQLite (`Backend/college.db`). On ephemeral hosts (e.g. free
  Render/Railway tiers) the filesystem resets on redeploy, so registrations will
  reset — fine for a demo.
