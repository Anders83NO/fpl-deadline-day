import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    // Get entry to find leagues
    const entryRes = await fetch(
      `https://fantasy.premierleague.com/api/entry/${id}/`,
      { cache: "no-store" }
    );
    if (!entryRes.ok) return NextResponse.json({ error: "Team not found" }, { status: 404 });
    const entry = await entryRes.json();

    const classicLeagues = (entry.leagues?.classic ?? [])
      .filter((l: { league_type: string }) => l.league_type === "x")
      .slice(0, 10);

    // Fetch standings for each league in parallel
    const leagueData = await Promise.all(
      classicLeagues.map(async (l: { id: number; name: string; entry_rank: number }) => {
        try {
          const res = await fetch(
            `https://fantasy.premierleague.com/api/leagues-classic/${l.id}/standings/`,
            { cache: "no-store" }
          );
          if (!res.ok) return { id: l.id, name: l.name, standings: [], myRank: l.entry_rank };
          const data = await res.json();
          const results = (data.standings?.results ?? []).slice(0, 20).map(
            (r: { entry: number; entry_name: string; player_name: string; rank: number; total: number; event_total: number }) => ({
              entryId: r.entry,
              teamName: r.entry_name,
              managerName: r.player_name,
              rank: r.rank,
              total: r.total,
              gwPoints: r.event_total,
            })
          );
          return { id: l.id, name: l.name, standings: results, myRank: l.entry_rank };
        } catch {
          return { id: l.id, name: l.name, standings: [], myRank: l.entry_rank };
        }
      })
    );

    return NextResponse.json({ leagues: leagueData, teamId: parseInt(id) });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
