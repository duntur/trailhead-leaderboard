import { getLeaderboard } from '../lib/db';

export const dynamic = 'force-dynamic'; // always show fresh totals, no static caching

export default async function Page() {
  const stepsPerKm = Number(process.env.STEPS_PER_KM || 1330);
  const rows = await getLeaderboard();

  const leaderboard = rows.map((r) => {
    const km = r.total_distance_m / 1000;
    const totalSteps = Math.round(km * stepsPerKm);
    const avgStepsPerActivity = r.activity_count > 0 ? Math.round(totalSteps / r.activity_count) : 0;
    return { name: r.name, km, activities: r.activity_count, avgStepsPerActivity };
  });

  const max = leaderboard.length > 0 ? leaderboard[0].km : 1;

  return (
    <div className="wrap">
      <div className="header">
        <p className="eyebrow">Live · Strava-connected</p>
        <h1>Trailhead Challenge</h1>
        <p className="sub">Total distance walked or hiked</p>
        <a className="connect-btn" href="/api/auth/connect">Connect Strava</a>
      </div>

      {leaderboard.length === 0 ? (
        <div className="empty">No athletes connected yet. Share the "Connect Strava" link above.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Athlete</th>
              <th className="num">Total Distance</th>
              <th className="num">Activities</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((athlete, i) => (
              <tr key={athlete.name + i}>
                <td><span className={`rank ${i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : ''}`}>{i + 1}</span></td>
                <td>
                  <div className="name">{athlete.name}</div>
                  <div className="steps">avg <b>{athlete.avgStepsPerActivity.toLocaleString()}</b> steps/walk</div>
                  <div className="bar-track">
                    <div className={`bar-fill ${i === 0 ? 'bar-fill-1' : ''}`} style={{ width: `${(athlete.km / max) * 100}%` }} />
                  </div>
                </td>
                <td className="num"><span className="dist">{athlete.km.toFixed(1)}</span><span className="unit">km</span></td>
                <td className="num">{athlete.activities}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p className="footer">
        Distances pulled from Strava activities of type Walk / Hike. Step counts are estimated from distance
        (~{stepsPerKm} steps/km) since Strava doesn't track steps directly.
      </p>
    </div>
  );
}
