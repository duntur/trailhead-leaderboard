import { NextResponse } from 'next/server';
import { getAuthorizeUrl } from '../../../../lib/strava';

export async function GET() {
  return NextResponse.redirect(getAuthorizeUrl());
}
