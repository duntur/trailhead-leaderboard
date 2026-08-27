import { NextResponse } from 'next/server';
import { exchangeCodeForToken } from '../../../../lib/strava';
import { upsertAthlete } from '../../../../lib/db';

export async function GET(request) {
  const code = request.nextUrl.searchParams.get('code');
  const error = request.nextUrl.searchParams.get('error');

  if (error) {
    // User declined the authorization
    return NextResponse.redirect(new URL('/?connected=denied', request.url));
  }
  if (!code) {
    return NextResponse.json({ error: 'Missing code param' }, { status: 400 });
  }

  const data = await exchangeCodeForToken(code);

  await upsertAthlete({
    stravaId: data.athlete.id,
    name: `${data.athlete.firstname} ${data.athlete.lastname}`.trim(),
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_at,
  });

  return NextResponse.redirect(new URL('/?connected=1', request.url));
}
