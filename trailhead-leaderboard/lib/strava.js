const AUTH_URL = 'https://www.strava.com/oauth/authorize';
const TOKEN_URL = 'https://www.strava.com/oauth/token';
const ACTIVITIES_URL = 'https://www.strava.com/api/v3/athlete/activities';

// Only these count toward the competition. Add/remove as your group prefers.
const COUNTED_TYPES = new Set(['Walk', 'Hike']);

export function getAuthorizeUrl() {
  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID,
    redirect_uri: process.env.STRAVA_REDIRECT_URI,
    response_type: 'code',
    approval_prompt: 'auto',
    scope: 'activity:read_all',
  });
  return `${AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForToken(code) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) throw new Error(`Strava token exchange failed: ${res.status}`);
  return res.json(); // { access_token, refresh_token, expires_at, athlete: {...} }
}

export async function refreshAccessToken(refreshToken) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) throw new Error(`Strava token refresh failed: ${res.status}`);
  return res.json(); // { access_token, refresh_token, expires_at }
}

// Fetches all activities after `afterEpochSeconds`, paginating as needed,
// and returns the summed distance + count for counted activity types.
export async function fetchWalkingTotals(accessToken, afterEpochSeconds) {
  let page = 1;
  let totalDistance = 0;
  let count = 0;

  while (true) {
    const url = `${ACTIVITIES_URL}?after=${afterEpochSeconds}&per_page=200&page=${page}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) throw new Error(`Strava activities fetch failed: ${res.status}`);
    const activities = await res.json();
    if (activities.length === 0) break;

    for (const a of activities) {
      if (COUNTED_TYPES.has(a.type)) {
        totalDistance += a.distance; // meters
        count += 1;
      }
    }

    if (activities.length < 200) break; // last page
    page += 1;
  }

  return { totalDistance, count };
}
