import { NextRequest, NextResponse } from "next/server";

// Searches FPL managers by name using the FPL search API.
// Falls back gracefully if the endpoint is unavailable.

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const res = await fetch(
      `https://fantasy.premierleague.com/api/search/?text=${encodeURIComponent(query)}`,
      { next: { revalidate: 0 } }
    );

    if (!res.ok) {
      return NextResponse.json({ results: [], fallback: true });
    }

    const data = await res.json();

    // FPL search returns { players: { results: [...] } }
    const results = (data?.players?.results ?? []).map((r: {
      entry: number;
      entry_name: string;
      player_first_name: string;
      player_last_name: string;
    }) => ({
      id: r.entry,
      teamName: r.entry_name,
      managerName: `${r.player_first_name} ${r.player_last_name}`,
    }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [], fallback: true });
  }
}
