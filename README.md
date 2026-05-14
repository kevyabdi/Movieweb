# Fiirso — Streaming Platform

A full-stack streaming platform with a viewer app (rajolabs.com), admin panel (admin.rajolabs.com), and a REST API backend. Built with React + Vite, Express, Drizzle ORM, and Supabase PostgreSQL. Designed for one-click Vercel deployment.

---

## Live Demo

| Site | URL |
|------|-----|
| Streaming App | https://rajolabs.com |
| Admin Panel | https://admin.rajolabs.com |

---

## Features

- Browse and stream movies and TV series
- Hero banners, featured/trending carousels, category filtering
- Full-text search across all content
- User authentication — register, login, profile, password reset
- Subscription plans
- Actor pages and year-based browsing
- Admin panel — manage movies, series, seasons, episodes, banners, categories
- TMDB integration for importing content in bulk
- Analytics dashboard
- User management — roles, bans, subscription plans
- JWT-based auth with separate admin and user token types

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 7, Tailwind CSS v4, shadcn/ui |
| State | TanStack Query v5 |
| Routing | Wouter |
| Backend | Express 5, Node.js 24 |
| Database | PostgreSQL via Supabase |
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
│   ├── streamvault/          # Viewer frontend — rajolabs.com
│   │   ├── src/
│   │   │   ├── pages/        # Route pages (home, movie, series, search…)
│   │   │   ├── components/   # UI components
│   │   │   ├── context/      # Auth, banners context
│   │   │   └── lib/          # api-url.ts, utils
│   │   └── vercel.json
│   ├── admin/                # Admin panel — admin.rajolabs.com
│   │   ├── src/
│   │   │   ├── pages/        # Movies, series, users, analytics, settings…
│   │   │   ├── components/   # Admin-specific UI
│   │   │   └── context/      # Admin auth context
│   │   └── vercel.json
│   └── api-server/           # Express REST API backend
│       ├── src/
│       │   ├── routes/       # auth, movies, series, banners, users, tmdb…
│       │   ├── app.ts        # Express + CORS setup
│       │   └── index.ts      # Server entry (Replit dev)
│       ├── api/
│       │   └── index.js      # Vercel serverless handler (pre-built)
│       └── vercel.json
├── lib/
│   ├── db/                   # Drizzle ORM schema + migrations
│   ├── api-spec/             # OpenAPI spec (source of truth)
│   ├── api-zod/              # Generated Zod schemas
│   └── api-client-react/     # Generated React Query hooks
├── .env.example              # All required environment variables
├── pnpm-workspace.yaml
└── README.md
```

---

## How It Works

```
User Browser
    │
    ├─▶ rajolabs.com          (Vercel — streamvault frontend)
    │       └─▶ /api/*  ──▶  api.rajolabs.com  (Vercel — api-server)
    │                               └─▶ Supabase PostgreSQL
    │
    └─▶ admin.rajolabs.com    (Vercel — admin frontend)
            └─▶ All API calls ──▶  api.rajolabs.com
```

- The **API server** is the only service that talks to the database.
- Both frontends are static sites that call the API over HTTPS.
- Authentication uses **JWT tokens** stored in `localStorage`. The API validates every request.
- The first time you log in with `ADMIN_EMAIL` + `ADMIN_PASSWORD`, the API automatically creates the admin account in the database.

---

## Local Development

### Prerequisites

- Node.js 20+
- pnpm 9+
- A PostgreSQL database (Supabase free tier works)

### 1. Clone and install

```bash
git clone https://github.com/kevyabdi/Movieweb.git
cd Movieweb
pnpm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Fill in your values:

```env
# Supabase → Settings → Database → Connection string (use port 6543)
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

# Any long random string (32+ characters)
SESSION_SECRET=change-me-to-a-long-random-string-min-32-chars

# These become your admin login credentials on first login
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-secure-admin-password
```

### 3. Push the database schema

```bash
pnpm --filter @workspace/db run push
```

### 4. Start all services (3 terminals)

```bash
# Terminal 1 — API server (port 8080)
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Viewer frontend (port 5173)
PORT=5173 pnpm --filter @workspace/streamvault run dev

# Terminal 3 — Admin panel (port 5174)
PORT=5174 pnpm --filter @workspace/admin run dev
```

Then open:
- Viewer: http://localhost:5173
- Admin: http://localhost:5174
- API health check: http://localhost:8080/api/healthz

---

## Supabase Setup

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **Settings → Database → Connection string**
3. Select **Transaction pooler** (port `6543`) — required for serverless/Vercel
4. Copy the URL and paste it as `DATABASE_URL`
5. Run `pnpm --filter @workspace/db run push` to create all tables

---

## Vercel Deployment (Step-by-Step)

The project deploys as **3 separate Vercel projects** from the same GitHub repo.

### Step 1 — Deploy the API Server

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import `kevyabdi/Movieweb`
2. Set **Root Directory** → `artifacts/api-server`
3. Framework Preset → **Other**
4. Add these **Environment Variables**:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Supabase pooler connection string (port 6543) |
| `SESSION_SECRET` | A random string, 32+ characters |
| `ADMIN_EMAIL` | The email you want for the admin account |
| `ADMIN_PASSWORD` | The password you want for the admin account |
| `NODE_ENV` | `production` |
| `ALLOWED_ORIGINS` | `https://rajolabs.com,https://admin.rajolabs.com` |
| `TMDB_API_KEY` | Your TMDB API key *(optional, for content import)* |

5. Click **Deploy** and note the URL (e.g. `https://your-api.vercel.app`)

### Step 2 — Deploy the Viewer (rajolabs.com)

1. **Add New Project** → same repo
2. **Root Directory** → `artifacts/streamvault`
3. Framework → **Vite**
4. Add environment variable:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | URL from Step 1 (e.g. `https://your-api.vercel.app`) |

5. Deploy → assign your custom domain `rajolabs.com`

### Step 3 — Deploy the Admin Panel (admin.rajolabs.com)

1. **Add New Project** → same repo
2. **Root Directory** → `artifacts/admin`
3. Framework → **Vite**
4. Add environment variable:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | URL from Step 1 (e.g. `https://your-api.vercel.app`) |

5. Deploy → assign your custom domain `admin.rajolabs.com`

> **Important:** After deploying, go back to the API project → Settings → Environment Variables → update `ALLOWED_ORIGINS` to include the exact URLs of both frontends → click **Redeploy**.

---

## Why "Load failed" Happens

This is the most common issue after deployment. It means the frontend cannot reach the API. Causes:

1. **`VITE_API_URL` is missing or wrong** on the frontend Vercel project  
   → Set it to the exact URL of your API deployment and **redeploy** (required — this value is baked in at build time)

2. **`DATABASE_URL` or `SESSION_SECRET` is missing** on the API Vercel project  
   → The API crashes on every request. Set both and redeploy the API.

3. **CORS is blocking the request**  
   → Set `ALLOWED_ORIGINS` on the API to include both frontend URLs (comma-separated, no trailing slashes)

4. **Admin login says "Load failed" specifically**  
   → Make sure `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set on the API project. The first login creates the account automatically.

---

## Environment Variables Reference

| Variable | Project | Required | Description |
|----------|---------|----------|-------------|
| `DATABASE_URL` | API | ✅ | Supabase PostgreSQL pooler URL (port 6543) |
| `SESSION_SECRET` | API | ✅ | JWT signing secret (32+ random chars) |
| `ADMIN_EMAIL` | API | ✅ | Admin account email (created on first login) |
| `ADMIN_PASSWORD` | API | ✅ | Admin account password |
| `ALLOWED_ORIGINS` | API | ✅ Production | Comma-separated list of allowed frontend URLs |
| `NODE_ENV` | API | ✅ Production | Must be `production` |
| `TMDB_API_KEY` | API | Optional | Enables TMDB content import |
| `VITE_API_URL` | Frontends | ✅ Production | Full URL of the deployed API server |

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/healthz` | — | Health check |
| `POST` | `/api/auth/register` | — | User registration |
| `POST` | `/api/auth/login` | — | User login |
| `GET` | `/api/auth/me` | User token | Current user profile |
| `PATCH` | `/api/auth/profile` | User token | Update profile |
| `PATCH` | `/api/auth/change-password` | User token | Change password |
| `POST` | `/api/auth/forgot-password` | — | Request password reset |
| `POST` | `/api/auth/reset-password` | — | Reset password with token |
| `POST` | `/api/auth/admin/login` | — | Admin login |
| `GET` | `/api/auth/admin/verify` | Admin token | Verify admin session |
| `GET` | `/api/movies` | — | List movies |
| `POST` | `/api/movies` | Admin | Create movie |
| `GET` | `/api/movies/:id` | — | Get movie details |
| `GET` | `/api/series` | — | List TV series |
| `GET` | `/api/categories` | — | List categories |
| `GET` | `/api/banners/active` | — | Active hero banners |
| `GET` | `/api/users` | Admin | List all users |
| `GET` | `/api/stats` | Admin | Dashboard stats |
| `GET` | `/api/analytics/overview` | Admin | Analytics overview |
| `GET` | `/api/plans` | — | Subscription plans |
| `POST` | `/api/tmdb/bulk-import` | Admin | Bulk import from TMDB |

---

## Build Commands

```bash
# Install all dependencies
pnpm install

# Push DB schema to Supabase
pnpm --filter @workspace/db run push

# Build viewer frontend
pnpm --filter @workspace/streamvault run build

# Build admin panel
pnpm --filter @workspace/admin run build

# Build API server
pnpm --filter @workspace/api-server run build

# Typecheck entire monorepo
pnpm run typecheck

# Regenerate API types from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen
```

---

## Troubleshooting

**Login shows "Load failed"**
- Missing `VITE_API_URL` on the frontend Vercel project, or missing `DATABASE_URL`/`SESSION_SECRET` on the API project. Set them all and redeploy.

**API returns 500 on all routes**
- `DATABASE_URL` is wrong or the database is unreachable. Check your Supabase URL uses port `6543`.

**CORS errors in browser console**
- `ALLOWED_ORIGINS` on the API must exactly match your frontend domains (e.g. `https://rajolabs.com,https://admin.rajolabs.com`). No trailing slashes.

**Admin login says "Admin access required"**
- `ADMIN_EMAIL` and `ADMIN_PASSWORD` must be set on the API. The account is created automatically on first login.

**SPA routes return 404 on refresh**
- The `vercel.json` in each frontend handles this — do not delete it.

**Vercel build fails**
- Make sure the **Root Directory** is set correctly per project in the Vercel dashboard.

**TMDB import not working**
- Set `TMDB_API_KEY` on the API project's environment variables and redeploy.

---

## License

MIT
