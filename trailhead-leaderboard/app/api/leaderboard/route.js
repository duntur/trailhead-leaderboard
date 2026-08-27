import { NextResponse } from 'next/server';
import { getLeaderboard } from '../../../lib/db';

export async function GET() {
  const stepsPerKm = Number(process.env.STEPS_PER_KM || 1330);
  const rows = await getLeaderboard();

  const leaderboard = rows.map((r) => {
    const km = r.total_distance_m / 1000;
    const totalSteps = Math.round(km * stepsPerKm);
    const avgStepsPerActivity = r.activity_count > 0 ? Math.round(totalSteps / r.activity_count) : 0;
    return {
      name: r.name,
      km: Number(km.toFixed(1)),
      activities: r.activity_count,
      avgStepsPerActivity,
      lastSyncedAt: r.last_synced_at,
    };
  });

  return NextResponse.json({ leaderboard });
}
