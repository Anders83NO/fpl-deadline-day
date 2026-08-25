import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.API_FOOTBALL_KEY!;
const BASE = "https://v3.football.api-sports.io";
const HEADERS = { "x-apisports-key": API_KEY };

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const [fixtureRes, lineupsRes, eventsRes] = await Promise.all([
      fetch(`${BASE}/fixtures?id=${id}`, { headers: HEADERS, cache: "no-store" }),
      fetch(`${BASE}/fixtures/lineups?fixture=${id}`, { headers: HEADERS, cache: "no-store" }),
      fetch(`${BASE}/fixtures/events?fixture=${id}`, { headers: HEADERS, cache: "no-store" }),
    ]);

    if (!fixtureRes.ok) return NextResponse.json({ error: "Match not found" }, { status: 404 });

    const fixtureData = await fixtureRes.json();
    const f = fixtureData.response?.[0];
    if (!f) return NextResponse.json({ error: "Match not found" }, { status: 404 });

    // Lineups
    const lineupsData = lineupsRes.ok ? await lineupsRes.json() : { response: [] };
    const lineups = lineupsData.response ?? [];
    const homeLineupRaw = lineups[0] ?? null;
    const awayLineupRaw = lineups[1] ?? null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function mapPlayer(p: any) {
      return {
        id: p.player.id,
        name: p.player.name,
        number: p.player.number,
        pos: p.player.pos, // G, D, M, F
        grid: p.player.grid ?? null,
      };
    }

    const homeLineup = homeLineupRaw?.startXI?.map(mapPlayer) ?? [];
    const homeBench  = homeLineupRaw?.substitutes?.map(mapPlayer) ?? [];
    const awayLineup = awayLineupRaw?.startXI?.map(mapPlayer) ?? [];
    const awayBench  = awayLineupRaw?.substitutes?.map(mapPlayer) ?? [];

    // Events
    const eventsData = eventsRes.ok ? await eventsRes.json() : { response: [] };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const events = (eventsData.response ?? []).map((e: any) => ({
      minute: e.time.elapsed,
      extraMinute: e.time.extra ?? null,
      type: e.type,       // "Goal", "Card", "subst", "Var"
      detail: e.detail,   // "Normal Goal", "Yellow Card", "Red Card", "Penalty", etc.
      player: e.player?.name ?? null,
      assist: e.assist?.name ?? null,
      teamId: e.team?.id ?? null,
      teamName: e.team?.name ?? null,
      homeTeamId: f.teams.home.id,
    }));

    // Map status
    const statusShort = f.fixture.status.short;
    const statusMap: Record<string, string> = {
      FT: "FT", AET: "FT", PEN: "FT", HT: "HT",
      "1H": "1H", "2H": "2H", ET: "ET", P: "P",
      NS: "NS", TBD: "NS", PST: "POSTPONED",
    };

    return NextResponse.json({
      id: f.fixture.id,
      status: statusMap[statusShort] ?? statusShort,
      minute: f.fixture.status.elapsed ?? null,
      home: f.teams.home.name,
      homeCrest: f.teams.home.logo,
      away: f.teams.away.name,
      awayCrest: f.teams.away.logo,
      homeTeamId: f.teams.home.id,
      awayTeamId: f.teams.away.id,
      homeScore: f.goals.home,
      awayScore: f.goals.away,
      halfTimeHome: f.score.halftime.home,
      halfTimeAway: f.score.halftime.away,
      referee: f.fixture.referee ?? null,
      venue: f.fixture.venue?.name ?? null,
      homeFormation: homeLineupRaw?.formation ?? null,
      awayFormation: awayLineupRaw?.formation ?? null,
      homeLineup,
      awayLineup,
      homeBench,
      awayBench,
      events,
      upgradeRequired: false,
    });

  } catch (e) {
    console.error("match detail error:", e);
    return NextResponse.json({ error: "API error" }, { status: 500 });
  }
}
