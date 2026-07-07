import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const BASE = "https://api.football-data.org/v4";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const res = await fetch(`${BASE}/matches/${id}`, {
    headers: { "X-Auth-Token": API_KEY! },
    next: { revalidate: 60 },
  });

  if (!res.ok) return NextResponse.json({ error: "Match not found" }, { status: 404 });

  const m = await res.json();

  return NextResponse.json({
    id: m.id,
    status: m.status,
    minute: m.minute ?? null,
    home: m.homeTeam.shortName,
    homeCrest: m.homeTeam.crest,
    away: m.awayTeam.shortName,
    awayCrest: m.awayTeam.crest,
    homeScore: m.score.fullTime.home,
    awayScore: m.score.fullTime.away,
    halfTimeHome: m.score.halfTime.home,
    halfTimeAway: m.score.halfTime.away,
    referee: m.referees?.[0]?.name ?? null,
    venue: m.venue ?? null,
    homeLineup: [],
    awayLineup: [],
    homeBench: [],
    awayBench: [],
    events: [],
    upgradeRequired: true,
  });
}
