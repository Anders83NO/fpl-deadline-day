import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const FDR_COLOR: Record<number, string> = { 1: "green", 2: "green", 3: "yellow", 4: "red", 5: "red" };

function calcPoints(h: GwHistory, type: number): PointEvent[] {
  const events: PointEvent[] = [];
  const mins = h.minutes;
  if (mins > 0) {
    const pts = mins >= 60 ? 2 : 1;
    events.push({ label: `Minutes played (${mins})`, pts });
  }
  if (h.goals_scored > 0) {
    const ppg = type === 1 || type === 2 ? 6 : type === 3 ? 5 : 4;
    events.push({ label: `Goals scored (${h.goals_scored})`, pts: h.goals_scored * ppg });
  }
  if (h.assists > 0) events.push({ label: `Assists (${h.assists})`, pts: h.assists * 3 });
  if (h.clean_sheets > 0 && mins >= 60) {
    const ppcs = type === 1 || type === 2 ? 4 : type === 3 ? 1 : 0;
    if (ppcs > 0) events.push({ label: "Clean sheet", pts: ppcs });
  }
  if (h.saves > 0) {
    const savePts = Math.floor(h.saves / 3);
    if (savePts > 0) events.push({ label: `Saves (${h.saves})`, pts: savePts });
  }
  if (h.penalties_saved > 0) events.push({ label: `Penalties saved (${h.penalties_saved})`, pts: h.penalties_saved * 5 });
  if (h.bonus > 0) events.push({ label: "Bonus points", pts: h.bonus });
  if (h.yellow_cards > 0) events.push({ label: "Yellow card", pts: -1 });
  if (h.red_cards > 0) events.push({ label: "Red card", pts: -3 });
  if (h.own_goals > 0) events.push({ label: `Own goals (${h.own_goals})`, pts: h.own_goals * -2 });
  if (h.penalties_missed > 0) events.push({ label: `Penalties missed (${h.penalties_missed})`, pts: h.penalties_missed * -2 });
  const gcPts = (type === 1 || type === 2) ? -Math.floor(h.goals_conceded / 2) : 0;
  if (gcPts < 0) events.push({ label: `Goals conceded (${h.goals_conceded})`, pts: gcPts });
  return events;
}

interface GwHistory {
  round: number; opponent_team: number; was_home: boolean; total_points: number;
  minutes: number; goals_scored: number; assists: number; clean_sheets: number;
  goals_conceded: number; own_goals: number; penalties_saved: number;
  penalties_missed: number; yellow_cards: number; red_cards: number;
  saves: number; bonus: number;
}
interface PointEvent { label: string; pts: number; }

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const [summaryRes, bootstrapRes] = await Promise.all([
    fetch(`https://fantasy.premierleague.com/api/element-summary/${id}/`, { cache: "no-store" }),
    fetch("https://fantasy.premierleague.com/api/bootstrap-static/", { cache: "no-store" }),
  ]);

  if (!bootstrapRes.ok) return NextResponse.json({ error: "Bootstrap error" }, { status: 500 });

  const bootstrap = await bootstrapRes.json();
  const teamsMap: Record<number, { short: string; code: number }> = {};
  for (const t of bootstrap.teams) teamsMap[t.id] = { short: t.short_name, code: t.code };

  const player = bootstrap.elements.find((e: { id: number }) => e.id === parseInt(id));
  if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });

  const photo = player.photo ? player.photo.replace(".jpg", "") : null;
  const type = player.element_type;

  let history: object[] = [];
  let fixtures: object[] = [];

  if (summaryRes.ok) {
    const summary = await summaryRes.json();

    history = (summary.history ?? []).map((h: GwHistory) => ({
      gw: h.round,
      opponent: teamsMap[h.opponent_team]?.short ?? "?",
      isHome: h.was_home,
      totalPoints: h.total_points,
      minutes: h.minutes,
      events: calcPoints(h, type),
    })).reverse();

    fixtures = (summary.fixtures ?? []).slice(0, 5).map((f: {
      event: number; difficulty: number; team_h: number; team_a: number; is_home: boolean;
    }) => ({
      gw: f.event,
      opponent: teamsMap[f.is_home ? f.team_a : f.team_h]?.short ?? "?",
      isHome: f.is_home,
      fdr: f.difficulty,
      fdrColor: FDR_COLOR[f.difficulty] ?? "yellow",
    }));
  }

  return NextResponse.json({
    id: player.id,
    name: `${player.first_name} ${player.second_name}`,
    webName: player.web_name,
    photo,
    type,
    team: teamsMap[player.team]?.short ?? "?",
    teamCode: teamsMap[player.team]?.code ?? 0,
    price: player.now_cost / 10,
    totalPoints: player.total_points,
    form: player.form,
    epNext: player.ep_next,
    selectedBy: player.selected_by_percent,
    ictIndex: player.ict_index,
    pointsPerGame: player.points_per_game,
    status: player.status,
    news: player.news,
    history,
    fixtures,
  });
}
