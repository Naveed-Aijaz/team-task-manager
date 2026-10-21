# Team Task Manager

A full-stack app for managing teams and tasks.

- **Frontend:** React (Vite), Tailwind CSS, Lucide icons, axios
- **Backend:** Node.js, Express, Passport (local strategy), express-session + connect-pg-simple
- **Database:** PostgreSQL (Cloud SQL ready)
- **Security:** bcrypt (cost 12), HTTP-only `SameSite=Lax` cookies (`Secure` in production), helmet, CORS allow-list, rate-limited auth routes, express-validator on every write, parameterized SQL, team-membership checks on all team and task routes

## Project layout

```
server/   Express API (config, controllers, middleware, routes, database.sql, server.js)
client/   React app (components, context, pages)
```

## Run locally

Requirements: Node 18+, PostgreSQL 13+.

```bash
# 1. Database
createdb taskmanager
psql taskmanager -f server/database.sql

# 2. API
cd server
cp .env.example .env        # edit DATABASE_URL and SESSION_SECRET
npm install
npm run dev                 # http://localhost:4000

# 3. Client (new terminal)
cd client
npm install
npm run dev                 # http://localhost:5173 (proxies /api to :4000)
```

### Environment variables (`server/.env`)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (or use `PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`) |
| `SESSION_SECRET` | Long random string. Required in production |
| `SESSION_STORE` | `memory` for local dev. Production always uses PostgreSQL |
| `CLIENT_ORIGIN` | Comma-separated allowed origins for CORS |
| `PORT` | Defaults to 4000 |

## API summary

| Method | Route | Notes |
|---|---|---|
| POST | `/api/auth/register` | Validates email and password strength, signs the user in |
| POST | `/api/auth/login` | Body: `email`, `password` |
| POST | `/api/auth/logout` | Destroys the session and clears the cookie |
| GET | `/api/auth/me` | Current user |
| POST | `/api/teams` | Creator becomes owner and first member |
| GET | `/api/teams` | Teams you belong to, with members |
| POST | `/api/teams/:id/members` | Owner only. Body: `identifier` (username or email) |
| DELETE | `/api/teams/:id` | Owner only |
| POST | `/api/tasks` | Body: `title`, `teamId`, optional `assignedTo`, `priority`, `status`, `dueDate` |
| GET | `/api/tasks?teamId=&assigneeId=` | Only tasks from your teams |
| PUT | `/api/tasks/:id` | Update fields, status, or assignee (must be a team member) |
| DELETE | `/api/tasks/:id` | Any member of the task's team |

Authorization rules: only team members can see or change a team's tasks, assignees must belong to the task's team, and only the owner can add members or delete the team.

## Deploy to Google Cloud (Cloud Run + Cloud SQL)

The server serves the built client from `client/dist`, so one container runs everything on one origin (no CORS or cross-site cookie issues).

1. **Create the database**
   ```bash
   gcloud sql instances create taskmanager-db --database-version=POSTGRES_15 --tier=db-f1-micro --region=REGION
   gcloud sql databases create taskmanager --instance=taskmanager-db
   gcloud sql users create app --instance=taskmanager-db --password=STRONG_PASSWORD
   ```
2. **Load the schema** (Cloud SQL Auth Proxy running locally, or Cloud Shell: `gcloud sql connect taskmanager-db --user=app --database=taskmanager`, then paste `server/database.sql`).
3. **Store secrets**
   ```bash
   printf 'LONG_RANDOM_STRING' | gcloud secrets create session-secret --data-file=-
   printf 'STRONG_PASSWORD'    | gcloud secrets create db-password --data-file=-
   ```
4. **Add a `Dockerfile`** at the repo root:
   ```dockerfile
   FROM node:20-slim AS client
   WORKDIR /app/client
   COPY client/package*.json ./
   RUN npm ci
   COPY client ./
   RUN npm run build

   FROM node:20-slim
   WORKDIR /app/server
   COPY server/package*.json ./
   RUN npm ci --omit=dev
   COPY server ./
   COPY --from=client /app/client/dist /app/client/dist
   ENV NODE_ENV=production
   CMD ["node", "server.js"]
   ```
5. **Deploy**
   ```bash
   gcloud run deploy team-task-manager --source . --region=REGION --allow-unauthenticated \
     --add-cloudsql-instances=PROJECT:REGION:taskmanager-db \
     --set-env-vars=NODE_ENV=production,PGHOST=/cloudsql/PROJECT:REGION:taskmanager-db,PGUSER=app,PGDATABASE=taskmanager \
     --set-secrets=SESSION_SECRET=session-secret:latest,PGPASSWORD=db-password:latest
   ```
   Cloud Run terminates TLS, and the app sets `trust proxy` in production so `Secure` cookies work.

## Notes

- Task titles and descriptions are stored as typed and rendered through React, which escapes output.
- Registration returns a clear "already registered" message; login does not reveal whether an email exists.
- Add `express-rate-limit` to other routes or put Cloud Armor in front if you expect abuse.
