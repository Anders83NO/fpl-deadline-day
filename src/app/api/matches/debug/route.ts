import { NextResponse } from "next/server";

const API_KEY = process.env.API_FOOTBALL_KEY;
const BASE = "https://v3.football.api-sports.io";
const HEADERS = { "x-apisports-key": API_KEY! };

export async function GET() {
  const results: Record<string, unknown> = { keyPresent: !!API_KEY, keyLength: API_KEY?.length };

  const roundsRes = await fetch(`${BASE}/fixtures/rounds?league=39&season=2025&current=true`, { headers: HEADERS });
  results.roundsStatus = roundsRes.status;
  results.rounds = roundsRes.ok ? await roundsRes.json() : await roundsRes.text();

  const fixturesRes = await fetch(`${BASE}/fixtures?league=39&season=2025&round=Regular Season - 38`, { headers: HEADERS });
  results.fixturesStatus = fixturesRes.status;
  const fixturesData = fixturesRes.ok ? await fixturesRes.json() : await fixturesRes.text();
  results.fixturesCount = (fixturesData as { results?: number; response?: unknown[] })?.results
    ?? (fixturesData as { response?: unknown[] })?.response?.length ?? "?";
  results.fixturesSample = (fixturesData as { response?: unknown[] })?.response?.[0] ?? fixturesData;

  return NextResponse.json(results);
}
