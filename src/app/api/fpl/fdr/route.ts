import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const fromGw = parseInt(req.nextUrl.searchParams.get("from") ?? "1");
  const count = Math.min(parseInt(req.nextUrl.searchParams.get("count") ?? "6"), 10);

  try {
    const [bootstrapRes, fixturesRes] = await Promise.all([
      fetch("https://fantasy.premierleague.com/api/bootstrap-static/", { cache: "no-store" }),
      fetch("https://fantasy.premierleague.com/api/fixtures/", { cache: "no-store" }),
    ]);

    if (!bootstrapRes.ok) return NextResponse.json({ error: "API error" }, { status: 500 });

    const bootstrap = await bootstrapRes.json();
    const fixtures = fixturesRes.ok ? await fixturesRes.json() : [];

    const teams: { id: number; name: string; short: string }[] = (bootstrap.teams ?? []).map(
      (t: { id: number; name: string; short_name: string }) => ({
        id: t.id,
        name: t.name,
        short: t.short_name,
      })
    );

    const teamMap: Record<number, string> = {};
    for (const t of teams) teamMap[t.id] = t.short;

    const gws = Array.from({ length: count }, (_, i) => fromGw + i).filter(gw => gw >= 1 && gw <= 38);

    // Build FDR grid: team → [{gw, opponent, isHome, fdr}]
    const grid: Record<number, { gw: number; opponent: string; isHome: boolean; fdr: number }[]> = {};
    for (const t of teams) grid[t.id] = [];

    for (const f of fixtures) {
      if (!gws.includes(f.event)) continue;
      const homeId: number = f.team_h;
      const awayId: number = f.team_a;

      grid[homeId]?.push({
        gw: f.event,
        opponent: teamMap[awayId] ?? "?",
        isHome: true,
        fdr: f.team_h_difficulty,
      });
      grid[awayId]?.push({
        gw: f.event,
        opponent: teamMap[homeId] ?? "?",
        isHome: false,
        fdr: f.team_a_difficulty,
      });
    }

    // Sort teams by average FDR (easiest first)
    const teamRows = teams.map(t => {
      const fixtures = grid[t.id] ?? [];
      const avgFdr = fixtures.length > 0
        ? fixtures.reduce((s, f) => s + f.fdr, 0) / fixtures.length
        : 5;
      return { id: t.id, short: t.short, name: t.name, fixtures, avgFdr };
    }).sort((a, b) => a.avgFdr - b.avgFdr);

    return NextResponse.json({ teams: teamRows, gws });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
