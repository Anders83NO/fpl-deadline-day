import { NextRequest, NextResponse } from "next/server";

// Looks up a single FPL team by entry ID so the user can confirm it's theirs.
// FPL has no name-search API, so lookup by ID (or a pasted FPL link) is the reliable path.
export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");

  if (!id || !/^\d{1,10}$/.test(id)) {
    return NextResponse.json({ found: false, error: "invalid" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://fantasy.premierleague.com/api/entry/${id}/`, {
      next: { revalidate: 300 },
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
      },
    });

    if (res.status === 404) return NextResponse.json({ found: false }, { status: 404 });
    if (!res.ok) return NextResponse.json({ found: false, error: "upstream" }, { status: 502 });

    const d = await res.json();
    return NextResponse.json({
      found: true,
      id: d.id,
      teamName: d.name,
      managerName: `${d.player_first_name} ${d.player_last_name}`.trim(),
      overallRank: d.summary_overall_rank ?? null,
      overallPoints: d.summary_overall_points ?? null,
    });
  } catch {
    return NextResponse.json({ found: false, error: "upstream" }, { status: 502 });
  }
}
