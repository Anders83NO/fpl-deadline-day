import { NextResponse } from "next/server";

export async function GET() {
  const res = await fetch("https://fantasy.premierleague.com/api/bootstrap-static/", {
    cache: "no-store",
  });

  if (!res.ok) return NextResponse.json({ error: "API error" }, { status: 500 });

  const data = await res.json();

  const teamsMap: Record<number, { name: string; short: string; code: number }> = {};
  for (const t of data.teams) {
    teamsMap[t.id] = { name: t.name, short: t.short_name, code: t.code };
  }

  const players = data.elements
    .filter((el: { status: string }) => el.status !== "u")
    .map((el: {
      id: number;
      web_name: string;
      first_name: string;
      second_name: string;
      element_type: number;
      team: number;
      now_cost: number;
      total_points: number;
      form: string;
      points_per_game: string;
      selected_by_percent: string;
      status: string;
      news: string;
      chance_of_playing_next_round: number | null;
      goals_scored: number;
      assists: number;
      ep_next: string;
      transfers_in_event: number;
      transfers_out_event: number;
    }) => ({
      id: el.id,
      name: el.web_name,
      fullName: `${el.first_name} ${el.second_name}`,
      type: el.element_type,
      team: teamsMap[el.team]?.short ?? "?",
      teamFull: teamsMap[el.team]?.name ?? "?",
      teamCode: teamsMap[el.team]?.code ?? 0,
      price: el.now_cost / 10,
      points: el.total_points,
      form: parseFloat(el.form),
      ppg: parseFloat(el.points_per_game),
      selected: parseFloat(el.selected_by_percent),
      status: el.status,
      news: el.news,
      chanceNext: el.chance_of_playing_next_round,
      goals: el.goals_scored,
      assists: el.assists,
      epNext: parseFloat(el.ep_next),
      transfersIn: el.transfers_in_event,
      transfersOut: el.transfers_out_event,
    }));

  return NextResponse.json({ players });
}
