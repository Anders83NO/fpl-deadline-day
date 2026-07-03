import { NextResponse } from "next/server";

const OVERALL_LEAGUE = 314;
const TOP_N = 10;

export async function GET() {
  try {
    const [standingsRes, bootstrapRes] = await Promise.all([
      fetch(`https://fantasy.premierleague.com/api/leagues-classic/${OVERALL_LEAGUE}/standings/`, { cache: "no-store" }),
      fetch("https://fantasy.premierleague.com/api/bootstrap-static/", { cache: "no-store" }),
    ]);

    if (!standingsRes.ok || !bootstrapRes.ok) {
      return NextResponse.json({ error: "API error" }, { status: 500 });
    }

    const standings = await standingsRes.json();
    const bootstrap = await bootstrapRes.json();

    const currentEvent = (bootstrap.events ?? []).find((e: { is_current: boolean }) => e.is_current);
    const currentGw: number = currentEvent?.id ?? 38;

    const playerMap: Record<number, { name: string; team: number; type: number }> = {};
    for (const el of bootstrap.elements ?? []) {
      playerMap[el.id] = { name: el.web_name, team: el.team, type: el.element_type };
    }
    const teamMap: Record<number, string> = {};
    for (const t of bootstrap.teams ?? []) {
      teamMap[t.id] = t.short_name;
    }

    const topManagers = (standings.standings?.results ?? []).slice(0, TOP_N);

    // Fetch picks for each top manager
    const allPicks = await Promise.all(
      topManagers.map(async (m: { entry: number; entry_name: string; player_name: string; total: number }) => {
        try {
          const res = await fetch(
            `https://fantasy.premierleague.com/api/entry/${m.entry}/event/${currentGw}/picks/`,
            { cache: "no-store" }
          );
          if (!res.ok) return null;
          const data = await res.json();
          return {
            managerId: m.entry,
            managerName: m.player_name,
            teamName: m.entry_name,
            total: m.total,
            picks: data.picks ?? [],
            chip: data.active_chip ?? null,
          };
        } catch {
          return null;
        }
      })
    );

    const validPicks = allPicks.filter(Boolean) as {
      managerId: number;
      managerName: string;
      teamName: string;
      total: number;
      picks: { element: number; position: number; is_captain: boolean; multiplier: number }[];
      chip: string | null;
    }[];

    // Count player ownership among top managers (starting XI only)
    const ownershipCount: Record<number, number> = {};
    const captainCount: Record<number, number> = {};

    for (const mgr of validPicks) {
      for (const p of mgr.picks) {
        if (p.position <= 11) {
          ownershipCount[p.element] = (ownershipCount[p.element] ?? 0) + 1;
        }
        if (p.is_captain) {
          captainCount[p.element] = (captainCount[p.element] ?? 0) + 1;
        }
      }
    }

    // Most owned
    const mostOwned = Object.entries(ownershipCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([id, count]) => {
        const info = playerMap[Number(id)];
        return {
          id: Number(id),
          name: info?.name ?? "?",
          team: teamMap[info?.team ?? 0] ?? "?",
          type: info?.type ?? 0,
          count,
          outOf: validPicks.length,
        };
      });

    // Captain choices
    const captainChoices = Object.entries(captainCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id, count]) => {
        const info = playerMap[Number(id)];
        return {
          id: Number(id),
          name: info?.name ?? "?",
          team: teamMap[info?.team ?? 0] ?? "?",
          count,
          outOf: validPicks.length,
        };
      });

    return NextResponse.json({
      currentGw,
      managersAnalyzed: validPicks.length,
      mostOwned,
      captainChoices,
      topManagers: topManagers.slice(0, 5).map((m: { entry_name: string; player_name: string; total: number }) => ({
        teamName: m.entry_name,
        managerName: m.player_name,
        total: m.total,
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
