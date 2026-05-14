# Fiirso — Streaming Platform

A full-stack streaming platform with a viewer app and an admin panel. Built with React, Express, and PostgreSQL. Deployed on Vercel.

---

## What You Will Deploy

You need to create **2 projects on Vercel** from this same GitHub repo:

| Project | What it is | Your domain |
|---------|-----------|-------------|
| **Streamvault** | The streaming site users visit | `rajolabs.com` |
| **Admin** | The admin dashboard to manage content | `admin.rajolabs.com` |

Both projects include the API — no separate API deployment needed.

---

## Before You Start — Things You Need

Before going to Vercel, make sure you have these ready:

1. **A Supabase account** (free) → [supabase.com](https://supabase.com)
2. **A Vercel account** (free) → [vercel.com](https://vercel.com)
3. **Your GitHub repo** connected to Vercel

---

## Part 1 — Set Up Your Database (Supabase)

> Do this once. Both Vercel projects share the same database.

**Step 1** — Go to [supabase.com](https://supabase.com) and sign in

**Step 2** — Click **New project**, give it a name, set a password, click **Create**

**Step 3** — Wait for the project to finish setting up (about 1 minute)

**Step 4** — Go to **Settings** (left sidebar) → **Database**

**Step 5** — Scroll down to **Connection string** → select **Transaction pooler**

**Step 6** — Copy the URL — it looks like this:
```
postgresql://postgres.XXXXXX:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

> Save this — it is your `DATABASE_URL`. You will need it in both Vercel projects.

**Step 7** — Replace `[YOUR-PASSWORD]` in the URL with the database password you set in Step 2

---

## Part 2 — Deploy the Streaming Site (Streamvault)

**Step 1** — Go to [vercel.com](https://vercel.com) → click **Add New** → **Project**

**Step 2** — Click **Import** next to your GitHub repo `kevyabdi/Movieweb`

**Step 3** — In the **Configure Project** screen:
- Find **Root Directory** → click **Edit** → type `artifacts/streamvault` → click **Continue**
- **Framework Preset** → leave it as detected (Vite)

**Step 4** — Scroll down to **Environment Variables** and add these one by one:

| Name | Value |
|------|-------|
| `DATABASE_URL` | The Supabase URL you copied in Part 1 |
| `SESSION_SECRET` | Any long random text — example: `my-super-secret-key-change-this-32chars` |
| `ADMIN_EMAIL` | The email you want to use to log into the admin panel |
| `ADMIN_PASSWORD` | The password you want for the admin panel |
| `NODE_ENV` | `production` |
| `ALLOWED_ORIGINS` | `https://rajolabs.com,https://admin.rajolabs.com` |

> To add each one: type the Name, type the Value, click **Add**

**Step 5** — Click **Deploy** and wait for it to finish (about 2 minutes)

**Step 6** — When done, Vercel gives you a URL like `https://movieweb-xxxx.vercel.app`
- Go to **Settings** → **Domains** → add `rajolabs.com`
- Follow Vercel's instructions to update your domain's DNS settings

---

## Part 3 — Deploy the Admin Panel

**Step 1** — Go to [vercel.com](https://vercel.com) → click **Add New** → **Project** again

**Step 2** — Import the same repo `kevyabdi/Movieweb`

**Step 3** — In the **Configure Project** screen:
- **Root Directory** → click **Edit** → type `artifacts/admin` → click **Continue**
- **Framework Preset** → leave it as detected (Vite)

**Step 4** — Add these **Environment Variables**:

| Name | Value |
|------|-------|
| `DATABASE_URL` | Same Supabase URL from Part 1 |
| `SESSION_SECRET` | Same secret you used for Streamvault |
| `ADMIN_EMAIL` | Same admin email |
| `ADMIN_PASSWORD` | Same admin password |
| `NODE_ENV` | `production` |
| `ALLOWED_ORIGINS` | `https://rajolabs.com,https://admin.rajolabs.com` |

**Step 5** — Click **Deploy** and wait

**Step 6** — Go to **Settings** → **Domains** → add `admin.rajolabs.com`

---

## Part 4 — First Login to Admin

**Step 1** — Go to `https://admin.rajolabs.com`

**Step 2** — You should see a green **API online** dot at the top

**Step 3** — Enter the `ADMIN_EMAIL` and `ADMIN_PASSWORD` you set in Vercel

**Step 4** — Click **Sign In** — the admin account is created automatically on first login

---

## Something Is Wrong? Read This

### The admin shows "Unreachable" (red dot)

**Most likely cause:** `DATABASE_URL` or `SESSION_SECRET` is missing or wrong.

How to fix:
1. Go to your Vercel **admin** project → **Settings** → **Environment Variables**
2. Check that `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` are all there
3. If you add or change anything → go to **Deployments** → click **Redeploy**

---

### Login says "Cannot reach the server"

**Most likely cause:** The environment variables are missing on Vercel.

How to fix: same as above — check all 4 required variables are set, then redeploy.

---

### Login says "Invalid credentials" or "Access denied"

**Most likely cause:** Wrong email or password, or `ADMIN_EMAIL`/`ADMIN_PASSWORD` not set on Vercel.

How to fix:
1. Check the exact email/password you set in `ADMIN_EMAIL` / `ADMIN_PASSWORD` on Vercel
2. Use those exact values to log in (copy-paste to avoid typos)
3. If you change `ADMIN_EMAIL` or `ADMIN_PASSWORD` on Vercel → redeploy → log in again

---

### The page shows "404" when you refresh

This is normal for SPAs. The `vercel.json` file handles this — do not delete it.

---

### Vercel build fails

Check that the **Root Directory** is set correctly:
- Streamvault project → `artifacts/streamvault`
- Admin project → `artifacts/admin`

---

### TMDB import not working

Add `TMDB_API_KEY` to both Vercel project environment variables → redeploy.
Get a free API key at [themoviedb.org](https://www.themoviedb.org/settings/api).

---

## Environment Variables — Quick Reference

Both Vercel projects need the same set of variables:

| Variable | Required | What it is |
|----------|----------|-----------|
| `DATABASE_URL` | YES | Supabase connection string (port 6543) |
| `SESSION_SECRET` | YES | Any random string, 32+ characters |
| `ADMIN_EMAIL` | YES | Your admin login email |
| `ADMIN_PASSWORD` | YES | Your admin login password |
| `NODE_ENV` | YES | Must be exactly `production` |
| `ALLOWED_ORIGINS` | YES | `https://rajolabs.com,https://admin.rajolabs.com` |
| `TMDB_API_KEY` | Optional | For importing movies from TMDB |

---

## How It Works (Simple Diagram)

```
User visits rajolabs.com
      |
      |---> Vercel serves the streaming site
      |         |
      |         |---> /api/... requests go to the same Vercel project
      |                   |
      |                   |---> Supabase PostgreSQL (your database)


Admin visits admin.rajolabs.com
      |
      |---> Vercel serves the admin panel
                |
                |---> /api/... requests go to the same Vercel project
                          |
                          |---> Supabase PostgreSQL (same database)
```

Everything stays on the same domain — no cross-site issues.

---

## License

MIT
