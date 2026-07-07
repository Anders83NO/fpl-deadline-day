import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.API_FOOTBALL_KEY;
const BASE = "https://v3.football.api-sports.io";
const HEADERS = { "x-apisports-key": API_KEY! };

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const res = await fetch(`${BASE}/fixtures?id=${id}`, {
    headers: HEADERS,
    next: { revalidate: 60 },
  });

  if (!res.ok) return NextResponse.json({ error: "Match not found" }, { status: 404 });

  const data = await res.json();
  const f = (data.response ?? [])[0];
  if (!f) return NextResponse.json({ error: "Match not found" }, { status: 404 });

  return NextResponse.json({
    id: f.fixture.id,
    status: f.fixture.status.short,
    minute: f.fixture.status.elapsed ?? null,
    home: f.teams.home.name,
    homeCrest: f.teams.home.logo,
    away: f.teams.away.name,
    awayCrest: f.teams.away.logo,
    homeScore: f.goals.home ?? null,
    awayScore: f.goals.away ?? null,
    halfTimeHome: f.score?.halftime?.home ?? null,
    halfTimeAway: f.score?.halftime?.away ?? null,
    referee: f.fixture.referee ?? null,
    venue: f.fixture.venue?.name ?? null,
    homeLineup: [],
    awayLineup: [],
    homeBench: [],
    awayBench: [],
    events: [],
    upgradeRequired: true,
  });
}
