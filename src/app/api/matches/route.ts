import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const BASE = "https://api.football-data.org/v4";
const HEADERS = { "X-Auth-Token": API_KEY! };

function getCurrentSeason(): number {
  const now = new Date();
  return now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
}
const CURRENT_SEASON = getCurrentSeason();
const PREV_SEASON = CURRENT_SEASON - 1;

function gwIsFullyDone(matches: Match[]): boolean {
  if (!matches.length) return false;
  const allFt = matches.every((m) =>
    ["FINISHED", "FT", "AET", "PEN"].includes(m.status)
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

function formatMatches(matches: Match[]) {
  return matches.map((m) => ({
    id: m.id,
    home: m.homeTeam.shortName,
    homeCrest: m.homeTeam.crest,
    away: m.awayTeam.shortName,
    awayCrest: m.awayTeam.crest,
    homeScore: m.score.fullTime.home,
    awayScore: m.score.fullTime.away,
    status: m.status,
    minute: m.minute ?? null,
    utcDate: m.utcDate,
    matchday: m.matchday,
  }));
}

export async function GET(req: NextRequest) {
  const gwParam = req.nextUrl.searchParams.get("gw");
  const seasonParam = req.nextUrl.searchParams.get("season");
  const season = seasonParam ? parseInt(seasonParam) : CURRENT_SEASON;

  try {
    if (gwParam) {
      const res = await fetch(
        `${BASE}/competitions/PL/matches?season=${season}&matchday=${gwParam}`,
        { headers: HEADERS, cache: "no-store" }
      );
      if (!res.ok) return NextResponse.json({ matches: [], matchday: parseInt(gwParam), currentMatchday: 38, totalMatchdays: 38, season: `${season}/${String(season+1).slice(-2)}`, seasonYear: season });
      const data = await res.json();
      const matches: Match[] = data.matches ?? [];
      const md = matches[0]?.matchday ?? parseInt(gwParam);
      return NextResponse.json({ matches: formatMatches(matches), matchday: md, currentMatchday: md, totalMatchdays: 38, season: `${season}/${String(season+1).slice(-2)}`, seasonYear: season });
    }

    const compRes = await fetch(`${BASE}/competitions/PL?season=${season}`, { headers: HEADERS, cache: "no-store" });
    if (!compRes.ok) throw new Error("comp failed");
    const comp = await compRes.json();
    const currentMatchday: number = comp?.currentSeason?.currentMatchday ?? 0;

    if (!currentMatchday) {
      const prev = await fetch(`${BASE}/competitions/PL/matches?season=${PREV_SEASON}&matchday=38`, { headers: HEADERS, cache: "no-store" });
      const prevData = prev.ok ? await prev.json() : { matches: [] };
      const prevMatches: Match[] = prevData.matches ?? [];
      return NextResponse.json({ matches: formatMatches(prevMatches), matchday: 38, currentMatchday: 38, totalMatchdays: 38, season: `${PREV_SEASON}/${String(PREV_SEASON+1).slice(-2)}`, seasonYear: PREV_SEASON });
    }

    const matchRes = await fetch(`${BASE}/competitions/PL/matches?season=${season}&matchday=${currentMatchday}`, { headers: HEADERS, cache: "no-store" });
    if (!matchRes.ok) throw new Error("matches failed");
    const matchData = await matchRes.json();
    const matches: Match[] = matchData.matches ?? [];

    if (matches.length === 0) {
      const prev = await fetch(`${BASE}/competitions/PL/matches?season=${PREV_SEASON}&matchday=38`, { headers: HEADERS, cache: "no-store" });
      const prevData = prev.ok ? await prev.json() : { matches: [] };
      const prevMatches: Match[] = prevData.matches ?? [];
      return NextResponse.json({ matches: formatMatches(prevMatches), matchday: 38, currentMatchday: 38, totalMatchdays: 38, season: `${PREV_SEASON}/${String(PREV_SEASON+1).slice(-2)}`, seasonYear: PREV_SEASON });
    }

    let displayMatchday = currentMatchday;
    let displayMatches = matches;
    if (gwIsFullyDone(matches) && currentMatchday < 38) {
      const nextRes = await fetch(`${BASE}/competitions/PL/matches?season=${season}&matchday=${currentMatchday + 1}`, { headers: HEADERS, cache: "no-store" });
      if (nextRes.ok) {
        const nextData = await nextRes.json();
        if ((nextData.matches ?? []).length > 0) {
          displayMatchday = currentMatchday + 1;
          displayMatches = nextData.matches;
        }
      }
    }

    return NextResponse.json({
      matches: formatMatches(displayMatches),
      matchday: displayMatchday,
      currentMatchday,
      totalMatchdays: 38,
      season: `${season}/${String(season+1).slice(-2)}`,
      seasonYear: season,
    });

  } catch {
    return NextResponse.json({ error: "API error", matches: [], matchday: 38, currentMatchday: 38, totalMatchdays: 38, season: "2025/26", seasonYear: CURRENT_SEASON }, { status: 500 });
  }
}

interface Match {
  id: number;
  homeTeam: { shortName: string; crest: string };
  awayTeam: { shortName: string; crest: string };
  score: { fullTime: { home: number | null; away: number | null } };
  status: string;
  minute?: number;
  utcDate: string;
  matchday: number;
}
