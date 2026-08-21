import { NextRequest, NextResponse } from "next/server";

// Fetches the actual submitted picks for a specific manager + GW.
// Returns null/404 if FPL hasn't processed the data yet (just after deadline).
// This is the key signal: if data exists → squad is locked in, safe to plan next GW.

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const gw = searchParams.get("gw");

  if (!id || !gw) {
    return NextResponse.json({ error: "Missing id or gw" }, { status: 400 });
  }

  try {
    const [picksRes, bootstrapRes] = await Promise.all([
      fetch(`https://fantasy.premierleague.com/api/entry/${id}/event/${gw}/picks/`, {
        cache: "no-store",
      }),
      fetch("https://fantasy.premierleague.com/api/bootstrap-static/", {
        cache: "no-store",
      }),
    ]);

    // 404 or error = data not ready yet (FPL still processing after deadline)
    if (!picksRes.ok) {
      return NextResponse.json({ ready: false, picks: null });
    }

    const picksData = await picksRes.json();
    const bootstrap = await bootstrapRes.json();

    // Build a player lookup map
    const playerMap: Record<number, { web_name: string; team: number; element_type: number }> = {};
    const teamMap: Record<number, string> = {};
    const teamCodeMap: Record<number, number> = {};

    for (const t of bootstrap.teams ?? []) {
      teamMap[t.id] = t.short_name;
      teamCodeMap[t.id] = t.code;
    }
    for (const p of bootstrap.elements ?? []) {
      playerMap[p.id] = {
        web_name: p.web_name,
        team: p.team,
        element_type: p.element_type,
      };
    }

    const enrichedPicks = (picksData.picks ?? []).map((p: {
      element: number;
      position: number;
      multiplier: number;
      is_captain: boolean;
      is_vice_captain: boolean;
    }) => {
      const info = playerMap[p.element];
      return {
        element: p.element,
        position: p.position,
        multiplier: p.multiplier,
        is_captain: p.is_captain,
        is_vice_captain: p.is_vice_captain,
        name: info?.web_name ?? "Unknown",
        team: teamMap[info?.team ?? 0] ?? "?",
        teamCode: teamCodeMap[info?.team ?? 0] ?? 0,
        element_type: info?.element_type ?? 1,
      };
    });

    return NextResponse.json({
      ready: true,
      gw: parseInt(gw),
      picks: enrichedPicks,
      bank: ((picksData.entry_history?.bank ?? 0) / 10).toFixed(1),
      teamValue: ((picksData.entry_history?.value ?? 0) / 10).toFixed(1),
      freeTransfers: picksData.transfers?.limit ?? 1,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ready: false, picks: null });
  }
}
