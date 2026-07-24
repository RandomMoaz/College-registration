# 🎓 College Registration

A University Online registration system — Node/Express + SQLite API with a React (Vite) frontend. Students register for courses (with prerequisite and credit-limit checks), view schedules and exams; staff view rosters and exams.

## Demo logins
| Role    | Email             | Password |
|---------|-------------------|----------|
| Student | `student@uni.edu` | `1234`   |
| Staff   | `staff@uni.edu`   | `1234`   |




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
