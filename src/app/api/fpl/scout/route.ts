import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [bootstrapRes, fixturesRes] = await Promise.all([
      fetch("https://fantasy.premierleague.com/api/bootstrap-static/", { cache: "no-store" }),
      fetch("https://fantasy.premierleague.com/api/fixtures/", { cache: "no-store" }),
    ]);

    if (!bootstrapRes.ok) return NextResponse.json({ error: "FPL API error" }, { status: 500 });

    const bootstrap = await bootstrapRes.json();
    const fixturesData = fixturesRes.ok ? await fixturesRes.json() : [];

    const teamMap: Record<number, string> = {};
    for (const t of bootstrap.teams ?? []) teamMap[t.id] = t.short_name;

    // Current event
    const currentEvent = (bootstrap.events ?? []).find((e: { is_current: boolean }) => e.is_current)
      ?? (bootstrap.events ?? []).slice(-1)[0];
    const currentGw: number = currentEvent?.id ?? 38;

    // Build fixture difficulty per team for next 3 GWs
    const upcomingFixtures = (fixturesData ?? []).filter(
      (f: { event: number }) => f.event && f.event > currentGw && f.event <= currentGw + 3
    );

    const teamFdr: Record<number, number[]> = {};
    for (const f of upcomingFixtures) {
      if (!teamFdr[f.team_h]) teamFdr[f.team_h] = [];
      if (!teamFdr[f.team_a]) teamFdr[f.team_a] = [];
      teamFdr[f.team_h].push(f.team_h_difficulty);
      teamFdr[f.team_a].push(f.team_a_difficulty);
    }

    const avgFdr = (teamId: number): number => {
      const fdrs = teamFdr[teamId] ?? [];
      if (!fdrs.length) return 5;
      return fdrs.reduce((a, b) => a + b, 0) / fdrs.length;
    };

    // Map players
    const players = (bootstrap.elements ?? [])
      .filter((p: { minutes: number; status: string }) => p.minutes > 0 && p.status !== "u")
      .map((p: {
        id: number;
        web_name: string;
        team: number;
        element_type: number;
        ep_next: string;
        form: string;
        selected_by_percent: string;
        transfers_in_event: number;
        transfers_out_event: number;
        cost_change_event: number;
        cost_change_start: number;
        now_cost: number;
        total_points: number;
        points_per_game: string;
        value_season: string;
        value_form: string;
        ict_index: string;
        influence: string;
        creativity: string;
        threat: string;
        chance_of_playing_next_round: number | null;
        news: string;
      }) => ({
        id: p.id,
        name: p.web_name,
        team: teamMap[p.team] ?? "?",
        teamId: p.team,
        type: p.element_type,
        epNext: parseFloat(p.ep_next) || 0,
        form: parseFloat(p.form) || 0,
        ownership: parseFloat(p.selected_by_percent) || 0,
        transfersIn: p.transfers_in_event,
        transfersOut: p.transfers_out_event,
        priceChange: p.cost_change_event,
        priceChangeSeason: p.cost_change_start,
        price: p.now_cost / 10,
        totalPoints: p.total_points,
        ppg: parseFloat(p.points_per_game) || 0,
        valueSeason: parseFloat(p.value_season) || 0,
        valueForm: parseFloat(p.value_form) || 0,
        ictIndex: parseFloat(p.ict_index) || 0,
        influence: parseFloat(p.influence) || 0,
        creativity: parseFloat(p.creativity) || 0,
        threat: parseFloat(p.threat) || 0,
        chanceNext: p.chance_of_playing_next_round,
        news: p.news,
        fdr: avgFdr(p.team),
      }));

    const top = (arr: typeof players, n = 5) => arr.slice(0, n);

    // 1. Captain picks – highest ep_next, ownership > 5%, exclude GKs and defenders
    const captainPicks = top(
      [...players]
        .filter(p => p.ownership > 5 && p.type !== 1 && p.type !== 2)
        .sort((a, b) => b.epNext - a.epNext)
    );

    // 2. Hot transfers in
    const hotTransfersIn = top(
      [...players].filter(p => p.transfersIn > 0).sort((a, b) => b.transfersIn - a.transfersIn)
    );

    // 3. Differentials – ep_next high, ownership < 15%
    const differentials = top(
      [...players].filter(p => p.ownership < 15 && p.epNext > 3).sort((a, b) => b.epNext - a.epNext)
    );

    // 4. Price risers
    const priceRisers = top(
      [...players].filter(p => p.priceChange > 0).sort((a, b) => b.priceChange - a.priceChange || b.transfersIn - a.transfersIn)
    );

    // 5. Price fallers
    const priceFallers = top(
      [...players].filter(p => p.priceChange < 0).sort((a, b) => a.priceChange - b.priceChange || b.transfersOut - a.transfersOut)
    );

    // 6. ICT leaders
    const ictLeaders = top(
      [...players].sort((a, b) => b.ictIndex - a.ictIndex)
    );

    // 7. Best value (value_season = season points / price * 10)
    const bestValue = top(
      [...players].filter(p => p.totalPoints > 30).sort((a, b) => b.valueSeason - a.valueSeason)
    );

    // 8. Easy fixtures – players from teams with avg FDR ≤ 2.5 next 3 GWs, sorted by ep_next
    const easyFixtures = top(
      [...players].filter(p => p.fdr <= 2.5 && p.epNext > 2).sort((a, b) => b.epNext - a.epNext)
    );

    return NextResponse.json({
      currentGw,
      captainPicks,
      hotTransfersIn,
      differentials,
      priceRisers,
      priceFallers,
      ictLeaders,
      bestValue,
      easyFixtures,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
