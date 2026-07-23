import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const [entryRes, bootstrapRes, historyRes] = await Promise.all([
    fetch(`https://fantasy.premierleague.com/api/entry/${id}/`, { cache: "no-store" }),
    fetch("https://fantasy.premierleague.com/api/bootstrap-static/", { cache: "no-store" }),
    fetch(`https://fantasy.premierleague.com/api/entry/${id}/history/`, { cache: "no-store" }),
  ]);

  // GW1 / new season: FPL entry endpoint may return 404 before picks exist
  if (!entryRes.ok) {
    return NextResponse.json({ picks: [], noData: true, gw: 1, currentGw: 1, manager: "", teamName: "", overall_points: 0, overall_rank: 0, gw_points: 0, bank: "0.0", team_value: "0.0", chipsPlayed: [], activeChipThisGw: null });
  }

  const entry = await entryRes.json();
  const bootstrap = await bootstrapRes.json();

  const currentEvent = entry.current_event ?? 1;
  const gwParam = req.nextUrl.searchParams.get("gw");
  const viewGw = gwParam ? parseInt(gwParam) : (currentEvent || 1);

  const [picksRes, liveRes] = await Promise.all([
    fetch(
      `https://fantasy.premierleague.com/api/entry/${id}/event/${viewGw}/picks/`,
      { cache: "no-store" }
    ),
    fetch(
      `https://fantasy.premierleague.com/api/event/${viewGw}/live/`,
      { cache: "no-store" }
    ),
  ]);

  // No picks yet (GW1 before deadline)
  if (!picksRes.ok) {
    return NextResponse.json({ picks: [], noData: true, gw: viewGw, currentGw: currentEvent ?? 1, manager: `${entry.player_first_name} ${entry.player_last_name}`, teamName: entry.name ?? "", overall_points: entry.summary_overall_points ?? 0, overall_rank: entry.summary_overall_rank ?? 0, gw_points: 0, bank: "100.0", team_value: "100.0", chipsPlayed: [], activeChipThisGw: null });
  }

  const picksData = await picksRes.json();

  const livePoints: Record<number, number> = {};
  const liveExplain: Record<number, { identifier: string; points: number }[]> = {};
  const liveBonus: Record<number, number> = {};
  if (liveRes.ok) {
    const liveData = await liveRes.json();
    for (const el of liveData.elements ?? []) {
      livePoints[el.id] = el.stats?.total_points ?? 0;
      liveBonus[el.id] = el.stats?.bonus ?? 0;
      liveExplain[el.id] = (el.explain ?? []).flatMap(
        (fixture: { stats: { identifier: string; points: number }[] }) => fixture.stats ?? []
      ).filter((s: { points: number }) => s.points !== 0);
    }
  }

  const elementsMap: Record<number, { web_name: string; team: number; element_type: number }> = {};
  for (const el of bootstrap.elements) {
    elementsMap[el.id] = { web_name: el.web_name, team: el.team, element_type: el.element_type };
  }

  const teamsMap: Record<number, string> = {};
  const teamCodeMap: Record<number, number> = {};
  for (const t of bootstrap.teams) {
    teamsMap[t.id] = t.short_name;
    teamCodeMap[t.id] = t.code;
  }

  const picks = picksData.picks.map((p: { element: number; position: number; multiplier: number; is_captain: boolean; is_vice_captain: boolean }) => {
    const el = elementsMap[p.element];
    return {
      element: p.element,
      position: p.position,
      multiplier: p.multiplier,
      is_captain: p.is_captain,
      is_vice_captain: p.is_vice_captain,
      name: el?.web_name ?? "Unknown",
      team: el ? teamsMap[el.team] : "?",
      teamCode: el ? teamCodeMap[el.team] : 0,
      element_type: el?.element_type ?? 0,
      gw_points: livePoints[p.element] ?? 0,
      bonus: liveBonus[p.element] ?? 0,
      explain: liveExplain[p.element] ?? [],
    };
  });

  // Map FPL chip names to app chip keys
  const FPL_CHIP_MAP: Record<string, string> = {
    wildcard: "wildcard",
    bboost: "bboost",
    "3xc": "triplecaptain",
    freehit: "freehit",
  };

  const historyData = historyRes.ok ? await historyRes.json() : null;
  const chipsPlayed: string[] = (historyData?.chips ?? [])
    .map((c: { name: string }) => FPL_CHIP_MAP[c.name] ?? c.name)
    .filter((v: string, i: number, arr: string[]) => arr.indexOf(v) === i); // dedupe

  // Chip active this specific GW (already played, not just planned)
  const activeChipThisGw: string | null = picksData.active_chip
    ? (FPL_CHIP_MAP[picksData.active_chip] ?? picksData.active_chip)
    : null;

  return NextResponse.json({
    manager: `${entry.player_first_name} ${entry.player_last_name}`,
    teamName: entry.name,
    overall_points: entry.summary_overall_points,
    overall_rank: entry.summary_overall_rank,
    gw_points: picksData.entry_history?.points ?? 0,
    gw: viewGw,
    currentGw: currentEvent,
    bank: ((picksData.entry_history?.bank ?? 1000) / 10).toFixed(1),
    team_value: ((picksData.entry_history?.value ?? 1000) / 10).toFixed(1),
    picks,
    chipsPlayed,
    activeChipThisGw,
  });
}
