import { NextRequest, NextResponse } from "next/server";

// Fetches the actual submitted picks for a specific manager + GW.
// Returns null/404 if FPL hasn't processed the data yet (just after deadline).
// This is the key signal: if data exists → squad is locked in, safe to plan next GW.

const MAX_BANKED_FT = 5; // 2026/27 FPL rule

/**
 * Compute free transfers for the GW *after* `upToGw` by replaying the full
 * season history. This is the only reliable method — the `transfers.limit`
 * field in picks is null for chip GWs and may be missing entirely.
 *
 * Rules:
 *   - Everyone starts GW1 with 1 FT (initial squad build is free/unlimited)
 *   - Each GW: unused = max(0, ft - transfers_made), next_ft = min(MAX, unused + 1)
 *   - Free Hit: next_ft = 1 (resets regardless of banked FTs)
 *   - Wildcard: transfers are free so unused = ft, next_ft = min(MAX, ft + 1)
 */
function computeFreeTransfers(
  history: { event: number; event_transfers: number }[],
  chips: { name: string; event: number }[],
  upToGw: number
): number {
  const chipMap: Record<number, string> = {};
  for (const c of chips) chipMap[c.event] = c.name;

  let ft = 1; // FT available at start of GW1

  for (const gw of history) {
    if (gw.event > upToGw) break;

    const chip = chipMap[gw.event] ?? null;
    const transfersMade = gw.event_transfers ?? 0;

    if (gw.event === upToGw) {
      // This is the last locked GW — compute FT for the next GW
      if (chip === "freehit") return 1;
      if (chip === "wildcard") return Math.min(MAX_BANKED_FT, ft + 1); // WC = all FTs unused
      const unused = Math.max(0, ft - transfersMade);
      return Math.min(MAX_BANKED_FT, unused + 1);
    }

    // Advance ft to next GW
    if (chip === "freehit") {
      ft = 1;
    } else if (chip === "wildcard") {
      ft = Math.min(MAX_BANKED_FT, ft + 1); // WC = transfers free, accumulate normally
    } else {
      const unused = Math.max(0, ft - transfersMade);
      ft = Math.min(MAX_BANKED_FT, unused + 1);
    }
  }

  return ft; // fallback: return whatever ft is at this point
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const gw = searchParams.get("gw");

  if (!id || !gw) {
    return NextResponse.json({ error: "Missing id or gw" }, { status: 400 });
  }

  const gwNum = parseInt(gw);

  try {
    const [picksRes, bootstrapRes, historyRes] = await Promise.all([
      fetch(`https://fantasy.premierleague.com/api/entry/${id}/event/${gw}/picks/`, {
        cache: "no-store",
      }),
      fetch("https://fantasy.premierleague.com/api/bootstrap-static/", {
        cache: "no-store",
      }),
      fetch(`https://fantasy.premierleague.com/api/entry/${id}/history/`, {
        cache: "no-store",
      }),
    ]);

    // 404 or error = data not ready yet (FPL still processing after deadline)
    if (!picksRes.ok) {
      return NextResponse.json({ ready: false, picks: null });
    }

    const picksData = await picksRes.json();
    const bootstrap = await bootstrapRes.json();

    // Compute accurate FT from history
    let freeTransfers = 1;
    if (historyRes.ok) {
      const historyData = await historyRes.json();
      const history: { event: number; event_transfers: number }[] = historyData.current ?? [];
      const chips: { name: string; event: number }[] = historyData.chips ?? [];
      freeTransfers = computeFreeTransfers(history, chips, gwNum);
    }

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
      gw: gwNum,
      picks: enrichedPicks,
      bank: ((picksData.entry_history?.bank ?? 0) / 10).toFixed(1),
      teamValue: ((picksData.entry_history?.value ?? 0) / 10).toFixed(1),
      freeTransfers,                              // computed from history — always accurate
      activeChip: picksData.active_chip ?? null,  // e.g. "freehit", "wildcard", "bboost", "3xc"
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ready: false, picks: null });
  }
}
