import { sql } from '@vercel/postgres';

export async function upsertAthlete({ stravaId, name, accessToken, refreshToken, expiresAt }) {
  await sql`
    INSERT INTO athletes (strava_id, name, access_token, refresh_token, token_expires_at)
    VALUES (${stravaId}, ${name}, ${accessToken}, ${refreshToken}, ${expiresAt})
    ON CONFLICT (strava_id) DO UPDATE SET
      name = EXCLUDED.name,
      access_token = EXCLUDED.access_token,
      refresh_token = EXCLUDED.refresh_token,
      token_expires_at = EXCLUDED.token_expires_at
  `;
  await sql`
    INSERT INTO activity_totals (strava_id)
    VALUES (${stravaId})
    ON CONFLICT (strava_id) DO NOTHING
  `;
}

export async function getAllAthletes() {
  const { rows } = await sql`SELECT * FROM athletes`;
  return rows;
}

export async function updateAthleteTokens(stravaId, { accessToken, refreshToken, expiresAt }) {
  await sql`
    UPDATE athletes
    SET access_token = ${accessToken},
        refresh_token = ${refreshToken},
        token_expires_at = ${expiresAt}
    WHERE strava_id = ${stravaId}
  `;
}

export async function setAthleteTotals(stravaId, { distanceMeters, activityCount }) {
  await sql`
    UPDATE activity_totals
    SET total_distance_m = ${distanceMeters},
        activity_count = ${activityCount},
        last_synced_at = now()
    WHERE strava_id = ${stravaId}
  `;
}

export async function getLeaderboard() {
  const { rows } = await sql`
    SELECT a.strava_id, a.name, t.total_distance_m, t.activity_count, t.last_synced_at
    FROM athletes a
    JOIN activity_totals t ON t.strava_id = a.strava_id
    ORDER BY t.total_distance_m DESC
  `;
  return rows;
}
