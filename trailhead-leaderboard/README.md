# Trailhead Challenge — Strava Walking Leaderboard

A small, private leaderboard that ranks a group by total walking/hiking distance
pulled from Strava, with an estimated average-steps-per-walk figure next to each name.

## What's included

- `app/page.js` — the leaderboard page (server-rendered, always fresh)
- `app/api/auth/connect` — redirects a user to Strava to authorize
- `app/api/auth/callback` — exchanges the code, saves tokens to the DB
- `app/api/cron/poll` — refreshes tokens and re-syncs everyone's totals (runs on a schedule)
- `app/api/leaderboard` — JSON endpoint if you want the data elsewhere
- `lib/strava.js` — Strava OAuth + activities API calls
- `lib/db.js` — Postgres queries
- `schema.sql` — the two tables this needs

## Setup

### 1. Create a Strava API app
Go to https://www.strava.com/settings/api and register an app.
You'll get a **Client ID** and **Client Secret**.
Leave "Authorization Callback Domain" as `localhost` for now — you'll update it
once you have a real deploy URL.

### 2. Push this repo to GitHub
```bash
cd trailhead-leaderboard
git init
git add .
git commit -m "Initial commit"
# create a repo on GitHub, then:
git remote add origin <your-repo-url>
git push -u origin main
```

### 3. Deploy to Vercel
- Go to https://vercel.com, import the GitHub repo.
- In the project's **Storage** tab, add a **Postgres** database (this auto-sets `POSTGRES_URL`).
- Run `schema.sql` against that database once (Storage tab → your DB → Query tab, paste the file contents).

### 4. Set environment variables
In the Vercel project's **Settings → Environment Variables**, add everything from `.env.example`:
- `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET` — from step 1
- `STRAVA_REDIRECT_URI` — `https://<your-vercel-domain>/api/auth/callback`
- `CRON_SECRET` — any random string, e.g. output of `openssl rand -hex 16`
- `COMPETITION_START` — ISO date, e.g. `2026-09-01T00:00:00Z`
- `STEPS_PER_KM` — `1330` (or your own average)

Then go back to your Strava app settings and update **Authorization Callback Domain**
to your real Vercel domain (just the domain, no `https://` or path).

### 5. Redeploy
Trigger a redeploy so the new env vars take effect.

### 6. Invite your group
Share your live URL. Each person clicks **Connect Strava** on the page, authorizes,
and shows up in the table after the next sync.

### 7. First sync
The cron job runs on the schedule in `vercel.json` (every 6 hours by default).
To sync immediately after someone connects, you can manually hit:
```
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://<your-domain>/api/cron/poll
```

## Notes

- Only activities of type `Walk` or `Hike` count — change `COUNTED_TYPES` in `lib/strava.js` if your group wants to include others (e.g. `Run`).
- Steps are an **estimate** from distance (Strava doesn't record steps). Adjust `STEPS_PER_KM` for your group's average stride, or extend the schema to store a per-athlete stride length if you want more accuracy.
- Strava's API terms restrict building "virtual competitions" at any public/commercial scale — this is intended for a small private group, not a public product.
