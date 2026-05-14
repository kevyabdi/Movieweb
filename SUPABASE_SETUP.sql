-- ============================================================
--  Fiirso — Supabase Database Setup
--  Run this entire script in: Supabase → SQL Editor → New Query
-- ============================================================

-- Users (stores bcrypt-hashed passwords — NOT Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id               SERIAL PRIMARY KEY,
  email            TEXT NOT NULL UNIQUE,
  password_hash    TEXT NOT NULL,
  name             TEXT,
  avatar_url       TEXT,
  role             TEXT NOT NULL DEFAULT 'user',
  plan             TEXT NOT NULL DEFAULT 'free',
  is_active        BOOLEAN NOT NULL DEFAULT true,
  reset_token      TEXT,
  reset_token_expiry TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Movies
CREATE TABLE IF NOT EXISTS movies (
  id               SERIAL PRIMARY KEY,
  title            TEXT NOT NULL,
  year             TEXT NOT NULL,
  genre            TEXT NOT NULL,
  rating           TEXT,
  duration         TEXT,
  description      TEXT NOT NULL DEFAULT '',
  long_description TEXT,
  poster_url       TEXT,
  backdrop_url     TEXT,
  trailer_url      TEXT,
  embed_url        TEXT,
  quality          TEXT NOT NULL DEFAULT 'HD',
  director         TEXT,
  tags             TEXT[],
  status           TEXT NOT NULL DEFAULT 'draft',
  is_featured      BOOLEAN NOT NULL DEFAULT false,
  is_trending      BOOLEAN NOT NULL DEFAULT false,
  is_most_liked    BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TV Series
CREATE TABLE IF NOT EXISTS series (
  id               SERIAL PRIMARY KEY,
  title            TEXT NOT NULL,
  year             TEXT NOT NULL,
  genre            TEXT NOT NULL,
  rating           TEXT,
  seasons_count    INTEGER NOT NULL DEFAULT 0,
  description      TEXT NOT NULL DEFAULT '',
  long_description TEXT,
  poster_url       TEXT,
  backdrop_url     TEXT,
  trailer_url      TEXT,
  quality          TEXT NOT NULL DEFAULT 'HD',
  director         TEXT,
  tags             TEXT[],
  status           TEXT NOT NULL DEFAULT 'draft',
  is_featured      BOOLEAN NOT NULL DEFAULT false,
  is_trending      BOOLEAN NOT NULL DEFAULT false,
  is_most_liked    BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seasons
CREATE TABLE IF NOT EXISTS seasons (
  id            SERIAL PRIMARY KEY,
  series_id     INTEGER NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  season_number INTEGER NOT NULL,
  title         TEXT,
  description   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Episodes
CREATE TABLE IF NOT EXISTS episodes (
  id             SERIAL PRIMARY KEY,
  series_id      INTEGER NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  season_id      INTEGER NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  episode_number INTEGER NOT NULL,
  title          TEXT NOT NULL,
  description    TEXT,
  duration       TEXT,
  embed_url      TEXT,
  thumbnail_url  TEXT,
  status         TEXT NOT NULL DEFAULT 'draft',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Hero Banners
CREATE TABLE IF NOT EXISTS banners (
  id           SERIAL PRIMARY KEY,
  title        TEXT NOT NULL,
  subtitle     TEXT,
  image_url    TEXT NOT NULL,
  link_url     TEXT,
  button_label TEXT DEFAULT 'Watch Now',
  is_active    BOOLEAN NOT NULL DEFAULT true,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User Ratings
CREATE TABLE IF NOT EXISTS ratings (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id   TEXT NOT NULL,
  content_type TEXT NOT NULL,
  value        INTEGER NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS ratings_user_content_idx
  ON ratings (user_id, content_id, content_type);

-- User Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id   TEXT NOT NULL,
  content_type TEXT NOT NULL,
  text         TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- App Settings (key/value store)
CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
--  Admin account is created automatically on first login.
--  Just go to admin.rajolabs.com and sign in with:
--    Email:    (your ADMIN_EMAIL env var)
--    Password: (your ADMIN_PASSWORD env var)
--  The API will create the account in the users table for you.
-- ============================================================
