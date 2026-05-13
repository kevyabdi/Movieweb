# Fiirso — Streaming Platform

A full-stack streaming platform with a viewer app, admin panel, and REST API. Built with React + Vite on the frontend and Express on the backend, designed for Vercel + Supabase deployment.

---

## Features

- Browse and stream movies and TV series
- Hero banners, featured/trending carousels, category filtering
- Full-text search across content
- User authentication (register, login, profile, password reset)
- Subscription plans
- Actor pages and year-based browsing
- Admin panel with content management (movies, series, seasons, episodes, banners, categories)
- TMDB integration for importing content
- Analytics dashboard
- User management (roles, bans, plans)
- JWT-based auth with admin and user token types

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 7, Tailwind CSS v4, shadcn/ui |
| State | TanStack Query v5 |
| Routing | Wouter |
| Backend | Express 5, Node.js 24 |
| Database | PostgreSQL (Supabase) |
| ORM | Drizzle ORM |
| Validation | Zod |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| API Codegen | Orval (OpenAPI → React Query hooks) |
| Monorepo | pnpm workspaces |
| Deployment | Vercel (3 separate projects) |

---

## Project Structure

```
fiirso/
├── artifacts/
│   ├── streamvault/          # Viewer frontend (React + Vite)
│   │   ├── src/
│   │   │   ├── pages/        # Route pages
│   │   │   ├── components/   # UI components
│   │   │   ├── context/      # Auth, content, banners context
│   │   │   └── lib/          # Utilities, API URL helper
│   │   └── vercel.json       # Vercel SPA config
│   ├── admin/                # Admin panel (React + Vite)
│   │   ├── src/
│   │   │   ├── pages/        # Admin route pages
│   │   │   ├── components/   # Admin UI components
│   │   │   └── context/      # Admin auth context
│   │   └── vercel.json       # Vercel SPA config
│   └── api-server/           # Express REST API
│       ├── src/
│       │   ├── routes/       # Route handlers (movies, series, auth, …)
│       │   ├── app.ts        # Express app setup
│       │   └── index.ts      # Server entrypoint (Replit)
│       ├── api/
│       │   └── index.ts      # Vercel serverless handler
│       └── vercel.json       # Vercel API routing
├── lib/
│   ├── db/                   # Drizzle ORM + PostgreSQL schema
│   ├── api-spec/             # OpenAPI spec (source of truth)
│   ├── api-zod/              # Generated Zod schemas
│   └── api-client-react/     # Generated React Query hooks
├── .env.example              # Environment variable reference
├── pnpm-workspace.yaml       # Workspace config
└── README.md
```

---

## Local Development

### Prerequisites

- Node.js 20+
- pnpm 9+
- A PostgreSQL database (Supabase or local)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:

```env
DATABASE_URL=postgresql://...          # Supabase connection string
SESSION_SECRET=a-long-random-string
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-admin-password
```

### 3. Push database schema

```bash
pnpm --filter @workspace/db run push
```

### 4. Start all services

Each service runs in its own terminal:

```bash
# API server (port 8080)
pnpm --filter @workspace/api-server run dev

# Viewer frontend (port 5173)
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/streamvault run dev

# Admin panel (port 5174)
PORT=5174 BASE_PATH=/ pnpm --filter @workspace/admin run dev
```

---

## Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Settings → Database → Connection string**
3. Copy the **Transaction pooler** URL (port `6543`) — this is required for serverless/Vercel
4. Paste it as your `DATABASE_URL`
5. Run `pnpm --filter @workspace/db run push` to create all tables

### Connection string format

```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

---

## Vercel Deployment

The project deploys as **three separate Vercel projects**:

| Project | Root Directory | Purpose |
|---------|---------------|---------|
| `fiirso-api` | `artifacts/api-server` | REST API (serverless) |
| `fiirso-app` | `artifacts/streamvault` | Viewer frontend |
| `fiirso-admin` | `artifacts/admin` | Admin panel |

### Step 1 — Deploy the API

1. Import the repo into Vercel
2. Set **Root Directory** to `artifacts/api-server`
3. Framework: **Other**
4. Add these environment variables in the Vercel dashboard:

```
DATABASE_URL        = your Supabase pooler connection string
SESSION_SECRET      = a long random string (32+ chars)
ADMIN_EMAIL         = admin@example.com
ADMIN_PASSWORD      = your admin password
ALLOWED_ORIGINS     = https://fiirso-app.vercel.app,https://fiirso-admin.vercel.app
NODE_ENV            = production
TMDB_API_KEY        = your TMDB key (optional)
```

5. Deploy — note the deployed URL (e.g. `https://fiirso-api.vercel.app`)

### Step 2 — Deploy the Viewer Frontend

1. Import the same repo, new project
2. Set **Root Directory** to `artifacts/streamvault`
3. Framework: **Vite**
4. Add environment variable:

```
VITE_API_URL = https://fiirso-api.vercel.app
```

5. Deploy

### Step 3 — Deploy the Admin Panel

1. Import the same repo, new project
2. Set **Root Directory** to `artifacts/admin`
3. Framework: **Vite**
4. Add environment variable:

```
VITE_API_URL = https://fiirso-api.vercel.app
```

5. Deploy
6. Go back to the API project → Settings → Environment Variables → update `ALLOWED_ORIGINS` to include the admin URL → Redeploy

---

## Environment Variables Reference

| Variable | Where | Required | Description |
|----------|-------|----------|-------------|
| `DATABASE_URL` | API | ✅ | Supabase PostgreSQL connection string |
| `SESSION_SECRET` | API | ✅ | JWT signing secret (32+ random chars) |
| `ADMIN_EMAIL` | API | ✅ | Initial admin account email |
| `ADMIN_PASSWORD` | API | ✅ | Initial admin account password |
| `ALLOWED_ORIGINS` | API | Production | Comma-separated allowed frontend URLs |
| `NODE_ENV` | API | Production | Set to `production` |
| `TMDB_API_KEY` | API | Optional | For TMDB content import feature |
| `VITE_API_URL` | Frontends | Production | Full URL of deployed API server |

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/healthz` | — | Health check |
| `POST` | `/api/auth/login` | — | User login |
| `POST` | `/api/auth/register` | — | User registration |
| `GET` | `/api/auth/me` | User | Current user profile |
| `POST` | `/api/auth/admin/login` | — | Admin login |
| `GET` | `/api/movies` | — | List movies |
| `POST` | `/api/movies` | Admin | Create movie |
| `GET` | `/api/movies/:id` | — | Get movie |
| `GET` | `/api/series` | — | List series |
| `GET` | `/api/categories` | — | List categories |
| `GET` | `/api/banners/active` | — | Active banners |
| `GET` | `/api/stats` | Admin | Dashboard stats |
| `GET` | `/api/analytics/overview` | Admin | Analytics |
| `POST` | `/api/tmdb/bulk-import` | Admin | Import from TMDB |

---

## Build Commands

```bash
# Typecheck entire monorepo
pnpm run typecheck

# Regenerate API types from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# Push schema changes to database (dev)
pnpm --filter @workspace/db run push

# Build viewer frontend
pnpm --filter @workspace/streamvault run build

# Build admin panel
pnpm --filter @workspace/admin run build

# Build API server
pnpm --filter @workspace/api-server run build
```

---

## Troubleshooting

**API returns 404 on all routes**
- Check that `DATABASE_URL` is set and the database is reachable
- Verify the schema has been pushed: `pnpm --filter @workspace/db run push`

**CORS errors in the browser**
- Set `ALLOWED_ORIGINS` in the API project to include your frontend URLs
- Redeploy the API after updating

**Admin login fails after deployment**
- Confirm `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set in the API project's Vercel env vars
- The first login creates the admin account automatically

**SPA routes return 404 on refresh**
- The `vercel.json` in each frontend project configures rewrites — make sure it was not deleted

**Supabase SSL errors**
- The API uses `ssl: { rejectUnauthorized: false }` in production — this is required for Supabase

**Build fails with "PORT is required"**
- This only applies to Replit dev mode. Vercel builds do not require `PORT`

**TMDB import not working**
- Set `TMDB_API_KEY` in the API project's environment variables

---

## Redeployments

On Replit: all services auto-restart when you push code changes.

On Vercel:
- Push to your connected Git branch — Vercel automatically rebuilds and redeploys
- Environment variable changes require a manual redeploy from the Vercel dashboard
- Schema changes: run `pnpm --filter @workspace/db run push` against your Supabase database, then redeploy

---

## License

MIT
