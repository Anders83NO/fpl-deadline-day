"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface Player {
  id: number;
  name: string;
  pos: string;
  number: number;
  grid: string | null; // "row:col"
}

interface Event {
  minute: number;
  extraMinute: number | null;
  type: string;
  detail: string;
  player: string | null;
  playerId: number | null;
  assist: string | null;
  assistId: number | null;  // player coming ON (subst)
  teamId: number;
  homeTeamId: number;
}

interface MatchDetail {
  id: number;
  status: string;
  minute: number | null;
  home: string;
  homeCrest: string;
  away: string;
  awayCrest: string;
  homeTeamId: number;
  awayTeamId: number;
  homeScore: number | null;
  awayScore: number | null;
  halfTimeHome: number | null;
  halfTimeAway: number | null;
  referee: string | null;
  venue: string | null;
  homeFormation?: string;
  awayFormation?: string;
  homeLineup: Player[];
  awayLineup: Player[];
  homeBench: Player[];
  awayBench: Player[];
  events: Event[];
}

type Tab = "events" | "lineups";

// ── Team jersey colors (API-Football team IDs) ──
// body = main jersey color, sleeve = sleeve/accent color, collar = collar color, text = number text
const TEAM_COLORS: Record<number, { body: string; sleeve: string; collar: string; text: string }> = {
  33:  { body: "#DA291C", sleeve: "#DA291C", collar: "#fff",    text: "#fff" }, // Man United
  34:  { body: "#241F20", sleeve: "#fff",    collar: "#fff",    text: "#fff" }, // Newcastle (black+white)
  35:  { body: "#DA291C", sleeve: "#000",    collar: "#000",    text: "#fff" }, // Bournemouth
  36:  { body: "#fff",    sleeve: "#fff",    collar: "#CC0000", text: "#000" }, // Fulham
  39:  { body: "#FDB913", sleeve: "#FDB913", collar: "#000",    text: "#231F20" }, // Wolves
  40:  { body: "#C8102E", sleeve: "#C8102E", collar: "#fff",    text: "#fff" }, // Liverpool
  41:  { body: "#D71920", sleeve: "#D71920", collar: "#fff",    text: "#fff" }, // Southampton
  42:  { body: "#EF0107", sleeve: "#fff",    collar: "#fff",    text: "#fff" }, // Arsenal (red+white sleeves)
  45:  { body: "#003399", sleeve: "#003399", collar: "#fff",    text: "#fff" }, // Everton
  46:  { body: "#003090", sleeve: "#003090", collar: "#fff",    text: "#fff" }, // Leicester
  47:  { body: "#132257", sleeve: "#132257", collar: "#fff",    text: "#fff" }, // Tottenham
  48:  { body: "#7A263A", sleeve: "#1BB1E7", collar: "#1BB1E7", text: "#fff" }, // West Ham (claret+sky)
  49:  { body: "#034694", sleeve: "#034694", collar: "#fff",    text: "#fff" }, // Chelsea
  50:  { body: "#6CABDD", sleeve: "#6CABDD", collar: "#fff",    text: "#fff" }, // Man City
  51:  { body: "#0057B8", sleeve: "#FFCD00", collar: "#FFCD00", text: "#fff" }, // Brighton (blue+yellow)
  52:  { body: "#1B458F", sleeve: "#C4122E", collar: "#C4122E", text: "#fff" }, // Crystal Palace (blue+red)
  55:  { body: "#E30613", sleeve: "#E30613", collar: "#fff",    text: "#fff" }, // Brentford
  57:  { body: "#0044A9", sleeve: "#0044A9", collar: "#fff",    text: "#fff" }, // Ipswich
  62:  { body: "#EE2737", sleeve: "#EE2737", collar: "#000",    text: "#fff" }, // Sheffield United
  63:  { body: "#FFCD00", sleeve: "#FFCD00", collar: "#003087", text: "#003087" }, // Leeds
  65:  { body: "#DD0000", sleeve: "#DD0000", collar: "#fff",    text: "#fff" }, // Nottingham Forest
  66:  { body: "#670E36", sleeve: "#95BFE5", collar: "#95BFE5", text: "#fff" }, // Aston Villa (claret+blue)
  71:  { body: "#6C1D45", sleeve: "#6C1D45", collar: "#fff",    text: "#fff" }, // Burnley
  73:  { body: "#F78F1E", sleeve: "#003DAD", collar: "#003DAD", text: "#fff" }, // Luton
  80:  { body: "#E3001B", sleeve: "#E3001B", collar: "#fff",    text: "#fff" }, // Middlesbrough
  88:  { body: "#EB172B", sleeve: "#000",    collar: "#000",    text: "#fff" }, // Sunderland
};

const FALLBACK_COLOR = { body: "#2a3a4a", sleeve: "#2a3a4a", collar: "#fff", text: "#fff" };

function teamColor(teamId: number) {
  return TEAM_COLORS[teamId] ?? FALLBACK_COLOR;
}

// ── Pitch constants ──
const W = 400, H = 600;
const ML = 14, MT = 14;
const PW = W - ML * 2;
const PH = H - MT * 2;
const MID_Y = MT + PH / 2;

function statusLabel(status: string, minute: number | null): string {
  if (["1H", "2H", "ET", "P"].includes(status)) return minute ? `${minute}'` : "LIVE";
  if (status === "HT") return "HT";
  if (status === "FT") return "FT";
  if (status === "NS") return "Upcoming";
  if (status === "POSTPONED") return "PST";
  return status;
}
function isLive(status: string): boolean {
  return ["1H", "2H", "ET", "P", "HT"].includes(status);
}
function isFinished(status: string): boolean {
  return status === "FT";
}
function eventIcon(type: string, detail: string): string {
  if (type === "Goal") {
    if (detail === "Own Goal") return "⚽🔴";
    if (detail === "Penalty") return "⚽🟣";
    return "⚽";
  }
  if (type === "Card") {
    if (detail === "Red Card") return "🟥";
    if (detail === "Yellow Red Card") return "🟨🟥";
    return "🟨";
  }
  if (type === "subst") return "🔄";
  return "•";
}

// ── X position for a player in a row ──
function xPos(colIndex: number, totalCols: number): number {
  if (totalCols === 1) return W / 2;
  const spread = Math.min(totalCols * 72, PW - 56);
  return W / 2 - spread / 2 + (colIndex * spread) / (totalCols - 1);
}

// ── Y positions ──
// Home: row 1 = GK near top, higher row = closer to centre
function homeRowY(row: number, maxRow: number): number {
  const topMargin = 28;
  const botMargin = 38;
  const usable = PH / 2 - topMargin - botMargin;
  const frac = maxRow > 1 ? (row - 1) / (maxRow - 1) : 0;
  return MT + topMargin + frac * usable;
}
// Away: row 1 = GK near bottom, higher row = closer to centre
function awayRowY(row: number, maxRow: number): number {
  const topMargin = 38;
  const botMargin = 28;
  const usable = PH / 2 - topMargin - botMargin;
  const frac = maxRow > 1 ? (row - 1) / (maxRow - 1) : 0;
  return MT + PH - botMargin - frac * usable;
}

// ── Group players by grid row ──
function groupByRow(players: Player[]): Map<number, { player: Player; col: number }[]> {
  const map = new Map<number, { player: Player; col: number }[]>();
  for (const p of players) {
    if (!p.grid) continue;
    const [r, c] = p.grid.split(":").map(Number);
    if (!map.has(r)) map.set(r, []);
    map.get(r)!.push({ player: p, col: c });
  }
  for (const row of map.values()) row.sort((a, b) => a.col - b.col);
  return map;
}

// ── Player card: circular photo + team color ring + number badge ──
const PHOTO_R = 19; // photo circle radius
const RING_R  = 21; // team color ring radius

function PlayerCard({
  x, y, playerId, number, name, ringColor, badgeText,
}: {
  x: number; y: number; playerId: number; number: number; name: string;
  ringColor: string; badgeText: string;
}) {
  const lastName = name.split(" ").pop()?.slice(0, 12) ?? name;
  const nameW = Math.min(lastName.length * 5.2 + 10, 76);
  const clipId = `pc-${playerId}`;
  const photoUrl = `https://media.api-sports.io/football/players/${playerId}.png`;

  return (
    <g transform={`translate(${x},${y})`}>
      {/* Subtle drop shadow */}
      <circle cx={0} cy={2} r={RING_R} fill="rgba(0,0,0,0.22)" />

      {/* Team color ring */}
      <circle cx={0} cy={0} r={RING_R} fill={ringColor} />

      {/* Clip photo to circle */}
      <defs>
        <clipPath id={clipId}>
          <circle cx={0} cy={0} r={PHOTO_R} />
        </clipPath>
      </defs>

      {/* Photo */}
      <image
        href={photoUrl}
        x={-PHOTO_R} y={-PHOTO_R}
        width={PHOTO_R * 2} height={PHOTO_R * 2}
        clipPath={`url(#${clipId})`}
        preserveAspectRatio="xMidYMid slice"
      />

      {/* Number badge — bottom right of circle */}
      <circle cx={13} cy={13} r={8} fill={ringColor} stroke="rgba(0,0,0,0.3)" strokeWidth={0.8} />
      <text x={13} y={14} textAnchor="middle" dominantBaseline="middle"
        fontSize={7} fontWeight={800} fill={badgeText} fontFamily="system-ui,sans-serif">
        {number}
      </text>

      {/* Name pill */}
      <rect x={-nameW / 2} y={RING_R + 3} width={nameW} height={14} rx={4}
        fill="rgba(0,0,0,0.4)" />
      <text x={0} y={RING_R + 11} textAnchor="middle" dominantBaseline="middle"
        fontSize={8} fontWeight={600} fill="#fff" fontFamily="system-ui,sans-serif">
        {lastName}
      </text>
    </g>
  );
}

// ── Pitch SVG ──
function PitchView({ data }: { data: MatchDetail }) {
  const sc = PH / 105;
  const homeC = teamColor(data.homeTeamId);
  const awayC = teamColor(data.awayTeamId);

  const homeRows = groupByRow(data.homeLineup);
  const awayRows = groupByRow(data.awayLineup);
  const homeMaxRow = homeRows.size > 0 ? Math.max(...homeRows.keys()) : 4;
  const awayMaxRow = awayRows.size > 0 ? Math.max(...awayRows.keys()) : 4;

  const pbW = Math.round(40.32 * PW / 68), pbH = Math.round(16.5 * sc), pbX = ML + (PW - pbW) / 2;
  const gaW = Math.round(18.32 * PW / 68), gaH = Math.round(5.5 * sc), gaX = ML + (PW - gaW) / 2;
  const gW = Math.round(7.32 * PW / 68), gH = 10, gX = ML + (PW - gW) / 2;
  const psy = Math.round(11 * sc);
  const cr = Math.round(9.15 * sc);
  const LC = "rgba(255,255,255,0.7)";
  const R = 7;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", height: "auto", display: "block" }}>

      {/* Stripes */}
      {Array.from({ length: 10 }, (_, i) => (
        <rect key={i} x={ML} y={MT + i * PH / 10} width={PW} height={PH / 10}
          fill={i % 2 === 0 ? "#5cb85c" : "#52a852"} />
      ))}

      {/* Lines */}
      <rect x={ML} y={MT} width={PW} height={PH} fill="none" stroke={LC} strokeWidth={1.5} />
      <line x1={ML} y1={MID_Y} x2={ML + PW} y2={MID_Y} stroke={LC} strokeWidth={1.5} />
      <circle cx={W / 2} cy={MID_Y} r={cr} fill="none" stroke={LC} strokeWidth={1.5} />
      <circle cx={W / 2} cy={MID_Y} r={3} fill="rgba(255,255,255,0.5)" />

      {/* Penalty areas */}
      <rect x={pbX} y={MT} width={pbW} height={pbH} fill="none" stroke={LC} strokeWidth={1.5} />
      <rect x={pbX} y={MT + PH - pbH} width={pbW} height={pbH} fill="none" stroke={LC} strokeWidth={1.5} />
      <rect x={gaX} y={MT} width={gaW} height={gaH} fill="none" stroke={LC} strokeWidth={1} />
      <rect x={gaX} y={MT + PH - gaH} width={gaW} height={gaH} fill="none" stroke={LC} strokeWidth={1} />

      {/* Goals */}
      <rect x={gX} y={MT - gH} width={gW} height={gH} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} />
      <rect x={gX} y={MT + PH} width={gW} height={gH} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} />

      {/* Penalty spots */}
      <circle cx={W / 2} cy={MT + psy} r={2.5} fill="rgba(255,255,255,0.5)" />
      <circle cx={W / 2} cy={MT + PH - psy} r={2.5} fill="rgba(255,255,255,0.5)" />

      {/* Corner arcs */}
      <path d={`M ${ML + R} ${MT} A ${R} ${R} 0 0 0 ${ML} ${MT + R}`} fill="none" stroke={LC} strokeWidth={1.5} />
      <path d={`M ${ML + PW - R} ${MT} A ${R} ${R} 0 0 1 ${ML + PW} ${MT + R}`} fill="none" stroke={LC} strokeWidth={1.5} />
      <path d={`M ${ML} ${MT + PH - R} A ${R} ${R} 0 0 0 ${ML + R} ${MT + PH}`} fill="none" stroke={LC} strokeWidth={1.5} />
      <path d={`M ${ML + PW} ${MT + PH - R} A ${R} ${R} 0 0 1 ${ML + PW - R} ${MT + PH}`} fill="none" stroke={LC} strokeWidth={1.5} />

      {/* Team labels */}
      <text x={ML + 6} y={MT + 10} fontSize={10} fontWeight={800} fill="rgba(255,255,255,0.6)"
        fontFamily="system-ui,sans-serif">{data.home}</text>
      <text x={ML + 6} y={MT + 22} fontSize={9} fill="rgba(255,255,255,0.35)"
        fontFamily="system-ui,sans-serif">{data.homeFormation}</text>
      <text x={ML + PW - 6} y={MT + PH - 22} fontSize={10} fontWeight={800} fill="rgba(255,255,255,0.6)"
        textAnchor="end" fontFamily="system-ui,sans-serif">{data.away}</text>
      <text x={ML + PW - 6} y={MT + PH - 10} fontSize={9} fill="rgba(255,255,255,0.35)"
        textAnchor="end" fontFamily="system-ui,sans-serif">{data.awayFormation}</text>

      {/* Home players */}
      {Array.from(homeRows.entries()).map(([row, cols]) =>
        cols.map(({ player }, colIdx) => (
          <PlayerCard key={player.id}
            x={xPos(colIdx, cols.length)}
            y={homeRowY(row, homeMaxRow)}
            playerId={player.id}
            number={player.number}
            name={player.name}
            ringColor={homeC.body}
            badgeText={homeC.text}
          />
        ))
      )}

      {/* Away players */}
      {Array.from(awayRows.entries()).map(([row, cols]) =>
        cols.map(({ player }, colIdx) => (
          <PlayerCard key={player.id}
            x={xPos(colIdx, cols.length)}
            y={awayRowY(row, awayMaxRow)}
            playerId={player.id}
            number={player.number}
            name={player.name}
            ringColor={awayC.body}
            badgeText={awayC.text}
          />
        ))
      )}
    </svg>
  );
}

// ── Substitutes section ──
function SubstitutesSection({ data }: { data: MatchDetail }) {
  const substEvents = data.events.filter(e => e.type === "subst");
  // Match by ID (reliable), fall back to name if ID missing
  const cameOnIds = new Set(substEvents.map(e => e.assistId).filter((id): id is number => id != null));

  function didComeOn(p: Player): boolean {
    if (cameOnIds.size > 0) return cameOnIds.has(p.id);
    // fallback: name match
    return substEvents.some(e => e.assist === p.name);
  }

  const homeUsed   = data.homeBench.filter(p => didComeOn(p));
  const homeUnused = data.homeBench.filter(p => !didComeOn(p));
  const awayUsed   = data.awayBench.filter(p => didComeOn(p));
  const awayUnused = data.awayBench.filter(p => !didComeOn(p));

  const subEventFor = (p: Player) =>
    substEvents.find(e => e.assistId === p.id || e.assist === p.name);

  const subMinute = (p: Player): string | null => {
    const e = subEventFor(p);
    if (!e) return null;
    return e.extraMinute ? `${e.minute}+${e.extraMinute}'` : `${e.minute}'`;
  };
  const replacedName = (p: Player): string | null =>
    subEventFor(p)?.player ?? null;

  const hasUsed = homeUsed.length > 0 || awayUsed.length > 0;
  const hasUnused = homeUnused.length > 0 || awayUnused.length > 0;

  if (!hasUsed && !hasUnused) return null;

  return (
    <div className="mt-4 space-y-5">
      {hasUsed && (
        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold mb-3"
            style={{ color: "#f59e0b" }}>Inhoppare</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div className="space-y-3">
              {homeUsed.map((p, i) => (
                <div key={i}>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] w-5 text-right flex-shrink-0 font-mono"
                      style={{ color: "#4d6a88" }}>{p.number}</span>
                    <span className="text-xs text-white truncate">{p.name}</span>
                    <span className="text-[10px] flex-shrink-0 font-bold ml-auto"
                      style={{ color: "#f59e0b" }}>{subMinute(p)}</span>
                  </div>
                  {replacedName(p) && (
                    <p className="text-[10px] ml-7" style={{ color: "#4d6a88" }}>
                      ↑ av {replacedName(p)}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {awayUsed.map((p, i) => (
                <div key={i}>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] w-5 text-right flex-shrink-0 font-mono"
                      style={{ color: "#4d6a88" }}>{p.number}</span>
                    <span className="text-xs text-white truncate">{p.name}</span>
                    <span className="text-[10px] flex-shrink-0 font-bold ml-auto"
                      style={{ color: "#f59e0b" }}>{subMinute(p)}</span>
                  </div>
                  {replacedName(p) && (
                    <p className="text-[10px] ml-7" style={{ color: "#4d6a88" }}>
                      ↑ av {replacedName(p)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {hasUnused && (
        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold mb-3"
            style={{ color: "#3d5570" }}>Oanvända avbytare</p>
          <div className="grid grid-cols-2 gap-x-4">
            <div className="space-y-1.5">
              {homeUnused.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[10px] w-5 text-right flex-shrink-0 font-mono"
                    style={{ color: "#3d5570" }}>{p.number}</span>
                  <span className="text-xs truncate" style={{ color: "#6688aa" }}>{p.name}</span>
                  <span className="text-[9px] ml-auto flex-shrink-0 font-bold"
                    style={{ color: "#2a3a4a" }}>{p.pos}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              {awayUnused.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[10px] w-5 text-right flex-shrink-0 font-mono"
                    style={{ color: "#3d5570" }}>{p.number}</span>
                  <span className="text-xs truncate" style={{ color: "#6688aa" }}>{p.name}</span>
                  <span className="text-[9px] ml-auto flex-shrink-0 font-bold"
                    style={{ color: "#2a3a4a" }}>{p.pos}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ──
export default function MatchPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<MatchDetail | null>(null);
  const [tab, setTab] = useState<Tab>("events");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/matches/${id}`);
      const json = await res.json();
      setData(json);
      setLoading(false);
    }
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-6 h-6 rounded-full border-2 animate-spin"
          style={{ borderColor: "#f59e0b", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!data) return <p className="text-center p-8" style={{ color: "#6688aa" }}>Match not found.</p>;

  const live = isLive(data.status);
  const finished = isFinished(data.status);

  const displayEvents = data.events.filter(e =>
    ["Goal", "Card", "subst"].includes(e.type)
  ).slice().reverse();

  return (
    <div className="max-w-lg mx-auto pb-24">

      {/* Back */}
      <div className="px-4 pt-5 pb-2">
        <Link href="/" className="text-xs flex items-center gap-1" style={{ color: "#6688aa" }}>← Back</Link>
      </div>

      {/* Score header */}
      <div className="px-4 py-8 flex flex-col items-center"
        style={{ background: "#162030", borderBottom: "1px solid #1a2a40" }}>
        <div className="flex items-center justify-between w-full max-w-xs">
          <div className="flex flex-col items-center gap-2 flex-1">
            {data.homeCrest && <Image src={data.homeCrest} alt={data.home} width={48} height={48} className="object-contain" />}
            <span className="text-xs font-semibold text-white text-center">{data.home}</span>
            {data.homeFormation && <span className="text-[10px]" style={{ color: "#6688aa" }}>{data.homeFormation}</span>}
          </div>

          <div className="flex flex-col items-center mx-4">
            <div className="text-5xl font-bold tracking-tight text-white">
              {data.homeScore ?? "–"} – {data.awayScore ?? "–"}
            </div>
            <div className="text-xs font-semibold mt-2 tracking-wider"
              style={{ color: live ? "#f59e0b" : "#555" }}>
              {statusLabel(data.status, data.minute)}
            </div>
            {finished && data.halfTimeHome !== null && (
              <div className="text-[10px] mt-1" style={{ color: "#4d6a88" }}>
                HT {data.halfTimeHome} – {data.halfTimeAway}
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-2 flex-1">
            {data.awayCrest && <Image src={data.awayCrest} alt={data.away} width={48} height={48} className="object-contain" />}
            <span className="text-xs font-semibold text-white text-center">{data.away}</span>
            {data.awayFormation && <span className="text-[10px]" style={{ color: "#6688aa" }}>{data.awayFormation}</span>}
          </div>
        </div>

        <div className="flex gap-4 mt-5">
          {data.venue && <span className="text-[10px]" style={{ color: "#4d6a88" }}>📍 {data.venue}</span>}
          {data.referee && <span className="text-[10px]" style={{ color: "#4d6a88" }}>🟡 {data.referee}</span>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex sticky top-0 z-10" style={{ background: "#162030", borderBottom: "1px solid #1a2a40" }}>
        {(["events", "lineups"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-3 text-xs font-semibold tracking-wider uppercase"
            style={{
              color: tab === t ? "#f59e0b" : "#555",
              borderBottom: tab === t ? "2px solid #f59e0b" : "2px solid transparent",
            }}>
            {t === "events" ? "Goals & Events" : "Lineups"}
          </button>
        ))}
      </div>

      <div className="py-4">

        {/* Events tab */}
        {tab === "events" && (
          <div className="px-4">
            {displayEvents.length === 0 ? (
              <p className="text-center py-8 text-sm" style={{ color: "#6688aa" }}>No events yet.</p>
            ) : (
              <div>
                {displayEvents.map((e, i) => {
                  const isHome = e.teamId === data.homeTeamId;
                  const icon = eventIcon(e.type, e.detail);
                  const minuteStr = e.extraMinute ? `${e.minute}+${e.extraMinute}'` : `${e.minute}'`;
                  return (
                    <div key={i}
                      className={`flex items-center gap-3 py-2.5 ${isHome ? "" : "flex-row-reverse"}`}
                      style={{ borderBottom: "1px solid #161e2a" }}>
                      <div className="w-10 flex-shrink-0 text-center">
                        <span className="text-[11px] font-bold" style={{ color: "#f59e0b" }}>{minuteStr}</span>
                      </div>
                      <div className={`flex-1 ${isHome ? "" : "text-right"}`}>
                        <p className={`text-sm font-semibold text-white flex items-center gap-1.5 ${isHome ? "" : "justify-end"}`}>
                          <span>{icon}</span>
                          <span className="truncate">{e.player ?? e.detail}</span>
                        </p>
                        {e.type === "Goal" && e.assist && (
                          <p className="text-[11px] mt-0.5" style={{ color: "#6688aa" }}>Assist: {e.assist}</p>
                        )}
                        {e.type === "subst" && e.assist && (
                          <p className="text-[11px] mt-0.5" style={{ color: "#6688aa" }}>↑ {e.assist}</p>
                        )}
                      </div>
                      <div className="w-5 flex-shrink-0 flex justify-center">
                        {isHome
                          ? data.homeCrest && <Image src={data.homeCrest} alt={data.home} width={14} height={14} className="object-contain" />
                          : data.awayCrest && <Image src={data.awayCrest} alt={data.away} width={14} height={14} className="object-contain" />
                        }
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Lineups tab */}
        {tab === "lineups" && (
          <div>
            {data.homeLineup.length === 0 && data.awayLineup.length === 0 ? (
              <p className="text-center py-8 text-sm px-4" style={{ color: "#6688aa" }}>
                Lineups not available yet.
              </p>
            ) : (
              <>
                <PitchView data={data} />
                <div className="px-4">
                  <SubstitutesSection data={data} />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
