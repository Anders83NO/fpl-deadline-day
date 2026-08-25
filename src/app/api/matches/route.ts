import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.API_FOOTBALL_KEY!;
const BASE = "https://v3.football.api-sports.io";
const HEADERS = { "x-apisports-key": API_KEY };
const PL_LEAGUE = 39;

function getCurrentSeason(): number {
  const now = new Date();
  return now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
}
const CURRENT_SEASON = getCurrentSeason();

// Short team names for PL clubs
const SHORT_NAMES: Record<number, string> = {
  42: "Arsenal", 40: "Liverpool", 33: "Man United", 50: "Man City",
  47: "Tottenham", 49: "Chelsea", 66: "Aston Villa", 51: "Brighton",
  55: "Brentford", 45: "Everton", 52: "Crystal Palace", 35: "Bournemouth",
  36: "Fulham", 48: "West Ham", 34: "Newcastle", 44: "Wolves",
  62: "Sheffield Utd", 41: "Southampton", 46: "Leicester", 57: "Ipswich",
  67: "Nott'm Forest", 63: "Leeds", 88: "Sunderland", 91: "Hull",
};

function shortName(team: { id: number; name: string }): string {
  return SHORT_NAMES[team.id] ?? team.name.replace("FC", "").replace("AFC", "").trim();
}

function mapStatus(s: string): string {
  // Normalise to football-data.org style so page.tsx doesn't need changes
  if (["FT", "AET", "PEN"].includes(s)) return "FT";
  if (s === "HT") return "HT";
  if (["1H", "2H", "ET", "BT", "P", "LIVE", "INT"].includes(s)) return "1H";
  if (["NS", "TBD"].includes(s)) return "NS";
  if (s === "PST") return "POSTPONED";
  return s;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatFixture(f: any) {
  return {
    id: f.fixture.id,
    home: shortName(f.teams.home),
    homeCrest: f.teams.home.logo,
    away: shortName(f.teams.away),
    awayCrest: f.teams.away.logo,
    homeScore: f.goals.home,
    awayScore: f.goals.away,
    status: mapStatus(f.fixture.status.short),
    minute: f.fixture.status.elapsed ?? null,
    utcDate: f.fixture.date,
    matchday: parseInt((f.league.round ?? "Regular Season - 1").split(" - ")[1] ?? "1"),
  };
}

function gwIsFullyDone(fixtures: ReturnType<typeof formatFixture>[]): boolean {
  if (!fixtures.length) return false;
  const allFt = fixtures.every(f => f.status === "FT");
  if (!allFt) return false;
  const lastMatch = fixtures.map(f => new Date(f.utcDate)).sort((a, b) => b.getTime() - a.getTime())[0];
  const cutoff = new Date(lastMatch);
  cutoff.setUTCDate(cutoff.getUTCDate() + 1);
  cutoff.setUTCHours(0, 1, 0, 0);
  return new Date() >= cutoff;
}

async function getFixturesByRound(season: number, round: number) {
  const res = await fetch(
    `${BASE}/fixtures?league=${PL_LEAGUE}&season=${season}&round=Regular+Season+-+${round}`,
    { headers: HEADERS, cache: "no-store" }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.response ?? []).map(formatFixture);
}

async function getCurrentRound(season: number): Promise<number> {
  const res = await fetch(
    `${BASE}/fixtures/rounds?league=${PL_LEAGUE}&season=${season}&current=true`,
    { headers: HEADERS, cache: "no-store" }
  );
  if (!res.ok) return 1;
  const data = await res.json();
  const round = data.response?.[0] ?? "";
  const num = parseInt(round.split(" - ")[1]);
  return isNaN(num) ? 1 : num;
}

export async function GET(req: NextRequest) {
  const gwParam = req.nextUrl.searchParams.get("gw");
  const seasonParam = req.nextUrl.searchParams.get("season");
  const season = seasonParam ? parseInt(seasonParam) : CURRENT_SEASON;

  try {
    if (gwParam) {
      const fixtures = await getFixturesByRound(season, parseInt(gwParam));
      return NextResponse.json({
        matches: fixtures,
        matchday: parseInt(gwParam),
        currentMatchday: parseInt(gwParam),
        totalMatchdays: 38,
        season: `${season}/${String(season + 1).slice(-2)}`,
        seasonYear: season,
      });
    }

    const currentRound = await getCurrentRound(season);

    if (!currentRound) {
      // Pre-season fallback: show last GW of previous season
      const fixtures = await getFixturesByRound(season - 1, 38);
      return NextResponse.json({
        matches: fixtures, matchday: 38, currentMatchday: 38,
        totalMatchdays: 38, season: `${season - 1}/${String(season).slice(-2)}`, seasonYear: season - 1,
      });
    }

    let displayRound = currentRound;
    let fixtures = await getFixturesByRound(season, currentRound);

    if (fixtures.length === 0) {
      const fixtures2 = await getFixturesByRound(season - 1, 38);
      return NextResponse.json({
        matches: fixtures2, matchday: 38, currentMatchday: 38,
        totalMatchdays: 38, season: `${season - 1}/${String(season).slice(-2)}`, seasonYear: season - 1,
      });
    }

    // If current GW is done, peek at next
    if (gwIsFullyDone(fixtures) && currentRound < 38) {
      const next = await getFixturesByRound(season, currentRound + 1);
      if (next.length > 0) {
        displayRound = currentRound + 1;
        fixtures = next;
      }
    }

    return NextResponse.json({
      matches: fixtures,
      matchday: displayRound,
      currentMatchday: currentRound,
      totalMatchdays: 38,
      season: `${season}/${String(season + 1).slice(-2)}`,
      seasonYear: season,
    });

  } catch (e) {
    console.error("matches route error:", e);
    return NextResponse.json({
      error: "API error", matches: [], matchday: 1, currentMatchday: 1,
      totalMatchdays: 38, season: `${CURRENT_SEASON}/${String(CURRENT_SEASON + 1).slice(-2)}`,
      seasonYear: CURRENT_SEASON,
    }, { status: 500 });
  }
}
