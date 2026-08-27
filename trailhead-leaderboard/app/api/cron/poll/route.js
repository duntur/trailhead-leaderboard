import { NextResponse } from 'next/server';
import { getAllAthletes, updateAthleteTokens, setAthleteTotals } from '../../../../lib/db';
import { refreshAccessToken, fetchWalkingTotals } from '../../../../lib/strava';

export const maxDuration = 60; // seconds — bump on paid Vercel plans if you have many athletes

export async function GET(request) {
  // Vercel Cron sends this header automatically; guards against random public hits.
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const competitionStart = Math.floor(new Date(process.env.COMPETITION_START).getTime() / 1000);
  const nowEpoch = Math.floor(Date.now() / 1000);
  const athletes = await getAllAthletes();

  const results = [];

  for (const athlete of athletes) {
    try {
      let accessToken = athlete.access_token;

      // Refresh if the token is expired or about to expire
      if (Number(athlete.token_expires_at) < nowEpoch + 60) {
        const refreshed = await refreshAccessToken(athlete.refresh_token);
        accessToken = refreshed.access_token;
        await updateAthleteTokens(athlete.strava_id, {
          accessToken: refreshed.access_token,
          refreshToken: refreshed.refresh_token,
          expiresAt: refreshed.expires_at,
        });
      }

      const { totalDistance, count } = await fetchWalkingTotals(accessToken, competitionStart);
      await setAthleteTotals(athlete.strava_id, { distanceMeters: totalDistance, activityCount: count });
      results.push({ athlete: athlete.name, status: 'ok', totalDistance, count });
    } catch (err) {
      results.push({ athlete: athlete.name, status: 'error', message: err.message });
    }
  }

  return NextResponse.json({ synced: results.length, results });
}
