-- Run this once against your Vercel Postgres database
-- (Storage tab -> your DB -> Query, or via `psql $POSTGRES_URL -f schema.sql`)

CREATE TABLE IF NOT EXISTS athletes (
  strava_id         BIGINT PRIMARY KEY,
  name              TEXT NOT NULL,
  access_token      TEXT NOT NULL,
  refresh_token     TEXT NOT NULL,
  token_expires_at  BIGINT NOT NULL,   -- unix epoch seconds
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity_totals (
  strava_id         BIGINT PRIMARY KEY REFERENCES athletes(strava_id) ON DELETE CASCADE,
  total_distance_m  DOUBLE PRECISION DEFAULT 0,
  activity_count    INT DEFAULT 0,
  last_synced_at    TIMESTAMPTZ DEFAULT now()
);
