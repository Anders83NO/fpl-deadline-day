import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    const res = await fetch(
      `https://fantasy.premierleague.com/api/entry/${id}/history/`,
      { cache: "no-store" }
    );
    if (!res.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const data = await res.json();

    const chips = (data.chips ?? []).map((c: { event: number; name: string; time: string }) => ({
      gw: c.event,
      chip: c.name,
      time: c.time,
    }));

    return NextResponse.json({ chips });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
