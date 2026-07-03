import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    const [entryRes, bootstrapRes, fixturesRes] = await Promise.all([
      fetch(`https://fantasy.premierleague.com/api/entry/${id}/`, { cache: "no-store" }),
      fetch("https://fantasy.premierleague.com/api/bootstrap-static/", { cache: "no-store" }),
      fetch("https://fantasy.premierleague.com/api/fixtures/", { cache: "no-store" }),
    ]);

    if (!entryRes.ok || !bootstrapRes.ok)
      return NextResponse.json({ error: "API error" }, { status: 500 });

    const entry = await entryRes.json();
    const bootstrap = await bootstrapRes.json();
    const fixturesData = fixturesRes.ok ? await fixturesRes.json() : [];

    const currentGw: number =
      (bootstrap.events ?? []).find((e: { is_current: boolean }) => e.is_current)?.id ?? 38;

    // Fetch picks
    const picksRes = await fetch(
      `https://fantasy.premierleague.com/api/entry/${id}/event/${currentGw}/picks/`,
      { cache: "no-store" }
    );
    if (!picksRes.ok) return NextResponse.json({ error: "Picks not available" }, { status: 404 });
    const picksData = await picksRes.json();

    // Build maps
    const teamMap: Record<number, string> = {};
    const teamCodeMap: Record<number, number> = {};
    for (const t of bootstrap.teams ?? []) {
      teamMap[t.id] = t.short_name;
      teamCodeMap[t.id] = t.code;
    }

    const playerMap: Record<number, {
      web_name: string; team: number; element_type: number;
      ep_next: string; form: string; ict_index: string;
      now_cost: number; total_points: number; points_per_game: string;
      selected_by_percent: string; chance_of_playing_next_round: number | null;
      news: string; status: string;
      transfers_in_event: number; transfers_out_event: number;
    }> = {};
    for (const el of bootstrap.elements ?? []) {
      playerMap[el.id] = el;
    }

    // FDR for next 3 GWs per team
    const teamFdr: Record<number, number[]> = {};
    for (const f of fixturesData) {
      if (!f.event || f.event <= currentGw || f.event > currentGw + 3) continue;
      if (!teamFdr[f.team_h]) teamFdr[f.team_h] = [];
      if (!teamFdr[f.team_a]) teamFdr[f.team_a] = [];
      teamFdr[f.team_h].push(f.team_h_difficulty);
      teamFdr[f.team_a].push(f.team_a_difficulty);
    }
    const avgFdr = (teamId: number): number => {
      const fdrs = teamFdr[teamId] ?? [];
      return fdrs.length > 0 ? fdrs.reduce((a, b) => a + b, 0) / fdrs.length : 3;
    };

    // Score each player 1-10
    function scorePlayer(elId: number): number {
      const p = playerMap[elId];
      if (!p) return 0;
      const epNext = parseFloat(p.ep_next) || 0;
      const form = parseFloat(p.form) || 0;
      const ict = parseFloat(p.ict_index) || 0;
      const fdr = avgFdr(p.team);

      // Weighted score: xPts (40%) + form (25%) + ICT normalized (15%) + fixture easiness (20%)
      const xPtsScore = Math.min(epNext / 8, 1) * 10;
      const formScore = Math.min(form / 8, 1) * 10;
      const ictScore = Math.min(ict / 400, 1) * 10;
      const fdrScore = ((5 - fdr) / 4) * 10; // 1=10, 5=0

      const raw = xPtsScore * 0.4 + formScore * 0.25 + ictScore * 0.15 + fdrScore * 0.2;
      return Math.round(Math.max(1, Math.min(10, raw)) * 10) / 10;
    }

    // Build squad analysis
    const squad = (picksData.picks ?? []).map((pick: {
      element: number; position: number; is_captain: boolean;
      is_vice_captain: boolean; multiplier: number;
    }) => {
      const p = playerMap[pick.element];
      const score = scorePlayer(pick.element);
      const injured = p?.chance_of_playing_next_round !== null && (p?.chance_of_playing_next_round ?? 100) < 75;

      return {
        id: pick.element,
        name: p?.web_name ?? "?",
        team: teamMap[p?.team ?? 0] ?? "?",
        teamCode: teamCodeMap[p?.team ?? 0] ?? 0,
        type: p?.element_type ?? 0,
        position: pick.position,
        isCaptain: pick.is_captain,
        isViceCaptain: pick.is_vice_captain,
        score,
        epNext: parseFloat(p?.ep_next ?? "0"),
        form: parseFloat(p?.form ?? "0"),
        fdr: avgFdr(p?.team ?? 0),
        price: (p?.now_cost ?? 0) / 10,
        totalPoints: p?.total_points ?? 0,
        injured,
        news: p?.news ?? "",
        status: p?.status ?? "a",
      };
    });

    // Captain recommendation: highest score among starting XI
    const starting = squad.filter((p: { position: number }) => p.position <= 11);
    const captainRec = [...starting].sort((a: { score: number }, b: { score: number }) => b.score - a.score);

    // Weak links: lowest scored starting players
    const weakLinks = [...starting].sort((a: { score: number }, b: { score: number }) => a.score - b.score).slice(0, 3);

    // Transfer suggestions: for each weak link, find best replacement within budget
    const bank = (picksData.entry_history?.bank ?? 0) / 10;
    const squadIds = new Set(squad.map((p: { id: number }) => p.id));

    const suggestions = weakLinks.map((weak: { id: number; type: number; price: number; name: string; score: number }) => {
      const budget = bank + weak.price;
      const candidates = (bootstrap.elements ?? [])
        .filter((el: { id: number; element_type: number; now_cost: number; minutes: number; status: string }) =>
          el.element_type === weak.type &&
          !squadIds.has(el.id) &&
          el.now_cost / 10 <= budget &&
          el.minutes > 0 &&
          el.status !== "u"
        )
        .map((el: { id: number; web_name: string; team: number; now_cost: number; ep_next: string; form: string }) => ({
          id: el.id,
          name: el.web_name,
          team: teamMap[el.team] ?? "?",
          price: el.now_cost / 10,
          score: scorePlayer(el.id),
          epNext: parseFloat(el.ep_next) || 0,
          form: parseFloat(el.form) || 0,
        }))
        .sort((a: { score: number }, b: { score: number }) => b.score - a.score)
        .slice(0, 3);

      return {
        out: { id: weak.id, name: weak.name, score: weak.score, price: weak.price },
        in: candidates,
      };
    });

    // Bench order recommendation (by score)
    const benchPlayers = squad.filter((p: { position: number }) => p.position > 11);
    const benchOrder = [...benchPlayers].sort((a: { score: number }, b: { score: number }) => b.score - a.score);

    // Overall squad rating
    const avgScore = starting.length > 0
      ? starting.reduce((s: number, p: { score: number }) => s + p.score, 0) / starting.length
      : 0;

    return NextResponse.json({
      currentGw,
      squad,
      captainRec: captainRec.slice(0, 3).map((p: { id: number; name: string; team: string; score: number; epNext: number }) => ({
        id: p.id, name: p.name, team: p.team, score: p.score, epNext: p.epNext,
      })),
      weakLinks: weakLinks.map((p: { id: number; name: string; team: string; score: number; type: number }) => ({
        id: p.id, name: p.name, team: p.team, score: p.score, type: p.type,
      })),
      suggestions,
      benchOrder: benchOrder.map((p: { id: number; name: string; score: number }) => ({
        id: p.id, name: p.name, score: p.score,
      })),
      squadRating: Math.round(avgScore * 10) / 10,
      bank,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
