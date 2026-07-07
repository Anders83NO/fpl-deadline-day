import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.API_FOOTBALL_KEY;
const BASE = "https://v3.football.api-sports.io";
const HEADERS = { "x-apisports-key": API_KEY! };
const LEAGUE = 39; // Premier League

function getCurrentSeason(): number {
  const now = new Date();
  return now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
}
const CURRENT_SEASON = getCurrentSeason();
const PREV_SEASON = CURRENT_SEASON - 1;

function roundToGw(round: string): number {
  const match = round.match(/(\d+)$/);
  return match ? parseInt(match[1]) : 0;
}

function gwIsFullyDone(matches: FormattedMatch[]): boolean {
  if (!matches.length) return false;
  const allFt = matches.every((m) =>
    ["FT", "AET", "PEN", "FINISHED"].includes(m.status)
  );
  if (!allFt) return false;
  const lastMatch = matches
    .map((m) => new Date(m.utcDate))
    .sort((a, b) => b.getTime() - a.getTime())[0];
  const midnight = new Date(lastMatch);
  midnight.setUTCDate(midnight.getUTCDate() + 1);
  midnight.setUTCHours(0, 1, 0, 0);
  return new Date() >= midnight;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatFixtures(fixtures: any[]): FormattedMatch[] {
  return fixtures.map((f) => ({
    id: f.fixture.id,
    home: f.teams.home.name,
    homeCrest: f.teams.home.logo,
    away: f.teams.away.name,
    awayCrest: f.teams.away.logo,
    homeScore: f.goals.home ?? null,
    awayScore: f.goals.away ?? null,
    status: f.fixture.status.short,
    minute: f.fixture.status.elapsed ?? null,
    utcDate: f.fixture.date,
    matchday: roundToGw(f.league.round ?? ""),
  }));
}

async function fetchFixtures(season: number, gw: number) {
  const round = encodeURIComponent(`Regular Season - ${gw}`);
  const res = await fetch(
    `${BASE}/fixtures?league=${LEAGUE}&season=${season}&round=${round}`,
    { headers: HEADERS, cache: "no-store" }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.response ?? [];
}

async function getCurrentRound(season: number): Promise<number> {
  const res = await fetch(
    `${BASE}/fixtures/rounds?league=${LEAGUE}&season=${season}&current=true`,
    { headers: HEADERS, cache: "no-store" }
  );
  if (!res.ok) return 0;
  const data = await res.json();
  const rounds: string[] = data.response ?? [];
  if (!rounds.length) return 0;
  return roundToGw(rounds[0]);
}

export async function GET(req: NextRequest) {
  const gwParam = req.nextUrl.searchParams.get("gw");
  const seasonParam = req.nextUrl.searchParams.get("season");
  const season = seasonParam ? parseInt(seasonParam) : CURRENT_SEASON;

  try {
    if (gwParam) {
      const fixtures = await fetchFixtures(season, parseInt(gwParam));
      const formatted = formatFixtures(fixtures);
      const gw = parseInt(gwParam);
      return NextResponse.json({
        matches: formatted,
        matchday: gw,
        currentMatchday: gw,
        totalMatchdays: 38,
        season: `${season}/${String(season + 1).slice(-2)}`,
        seasonYear: season,
      });
    }

    // Get current round
    let currentGw = await getCurrentRound(season);

    if (!currentGw) {
      // Off-season → show prev season GW38
      const fixtures = await fetchFixtures(PREV_SEASON, 38);
      return NextResponse.json({
        matches: formatFixtures(fixtures),
        matchday: 38,
        currentMatchday: 38,
        totalMatchdays: 38,
        season: `${PREV_SEASON}/${String(PREV_SEASON + 1).slice(-2)}`,
        seasonYear: PREV_SEASON,
      });
    }

    let fixtures = await fetchFixtures(season, currentGw);

    if (!fixtures.length) {
      const fixtures38 = await fetchFixtures(PREV_SEASON, 38);
      return NextResponse.json({
        matches: formatFixtures(fixtures38),
        matchday: 38,
        currentMatchday: 38,
        totalMatchdays: 38,
        season: `${PREV_SEASON}/${String(PREV_SEASON + 1).slice(-2)}`,
        seasonYear: PREV_SEASON,
      });
    }

    let displayGw = currentGw;
    let displayFixtures = fixtures;
    const formatted = formatFixtures(fixtures);

    if (gwIsFullyDone(formatted) && currentGw < 38) {
      const nextFixtures = await fetchFixtures(season, currentGw + 1);
      if (nextFixtures.length > 0) {
        displayGw = currentGw + 1;
        displayFixtures = nextFixtures;
      }
    }

    return NextResponse.json({
      matches: formatFixtures(displayFixtures),
      matchday: displayGw,
      currentMatchday: currentGw,
      totalMatchdays: 38,
      season: `${season}/${String(season + 1).slice(-2)}`,
      seasonYear: season,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: msg, matches: [], matchday: 1, currentMatchday: 1, totalMatchdays: 38, season: "2025/26", seasonYear: CURRENT_SEASON },
      { status: 500 }
    );
  }
}

interface FormattedMatch {
  id: number;
  home: string;
  homeCrest: string;
  away: string;
  awayCrest: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  minute: number | null;
  utcDate: string;
  matchday: number;
}
