import { NextRequest, NextResponse } from "next/server";

// Returns a map of teamId -> { opponent: shortName, isHome: boolean }
// for a given FPL gameweek, so the Plan page can show fixture info per player.

export async function GET(req: NextRequest) {
  const gw = req.nextUrl.searchParams.get("gw");
  if (!gw) return NextResponse.json({ fixtures: {} });

  try {
    const [fixturesRes, bootstrapRes] = await Promise.all([
      fetch(`https://fantasy.premierleague.com/api/fixtures/?event=${gw}`, {
        cache: "no-store",
      }),
      fetch("https://fantasy.premierleague.com/api/bootstrap-static/", {
        cache: "no-store",
      }),
    ]);

    if (!fixturesRes.ok || !bootstrapRes.ok) {
      return NextResponse.json({ fixtures: {} });
    }

    const fixturesData = await fixturesRes.json();
    const bootstrap = await bootstrapRes.json();

    // Build team ID → short name map
    const teamMap: Record<number, string> = {};
    for (const t of bootstrap.teams ?? []) {
      teamMap[t.id] = t.short_name;
    }

    // Build teamId → { opponent, isHome } map
    // A team can have a double gameweek (2 fixtures), handle that too
    const fixtures: Record<number, { opponent: string; isHome: boolean }[]> = {};

    for (const f of fixturesData ?? []) {
      const homeId: number = f.team_h;
      const awayId: number = f.team_a;
      const homeName = teamMap[homeId] ?? "?";
      const awayName = teamMap[awayId] ?? "?";

      if (!fixtures[homeId]) fixtures[homeId] = [];
      if (!fixtures[awayId]) fixtures[awayId] = [];

      fixtures[homeId].push({ opponent: awayName, isHome: true });
      fixtures[awayId].push({ opponent: homeName, isHome: false });
    }

    return NextResponse.json({ fixtures, teamMap });
  } catch {
    return NextResponse.json({ fixtures: {} });
  }
}
