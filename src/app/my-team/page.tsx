"use client";

import { useState, useEffect } from "react";
import PlayerInfoModal from "@/components/PlayerInfoModal";
import { StatusTriangle } from "@/components/StatusTriangle";

const TYPE_LABEL: Record<number, string> = { 1: "GK", 2: "DEF", 3: "MID", 4: "FWD" };

interface Pick {
  element: number;
  position: number;
  multiplier: number;
  is_captain: boolean;
  is_vice_captain: boolean;
  name: string;
  team: string;
  teamCode: number;
  element_type: number;
  gw_points: number;
  status?: string;
  news?: string;
}

interface TeamData {
  manager: string;
  overall_points: number;
  overall_rank: number;
  gw_points: number;
  gw: number;
  currentGw: number;
  bank: string;
  team_value: string;
  picks: Pick[];
}

function shirtUrl(teamCode: number, isGk: boolean): string {
  const suffix = isGk ? `_1-110.webp` : `-110.webp`;
  return `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${teamCode}${suffix}`;
}

function PlayerCard({ pick, bench = false, onInfo }: { pick: Pick; bench?: boolean; onInfo?: (id: number) => void }) {
  const isEmpty = pick.element < 0;
  const isGk = pick.element_type === 1;
  const posLabel = TYPE_LABEL[pick.element_type] ?? pick.name;
  const status = pick.status ?? "a";
  const statusDot = status === "i" || status === "u" ? { type: "red" as const }
    : status === "d" ? { type: "yellow" as const }
    : status === "s" ? { type: "suspended" as const }
    : null;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center gap-1 w-[72px]">
        <div className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.18)", border: "1.5px dashed rgba(255,255,255,0.25)", opacity: bench ? 0.6 : 1 }}>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 18 }}>+</span>
        </div>
        <div className="w-[68px] rounded-md overflow-hidden text-center shadow-lg">
          <span className="block text-[10px] font-bold py-0.5" style={{ background: "rgba(15,21,32,0.85)", color: "#6688aa" }}>{posLabel}</span>
        </div>
      </div>
    );
  }

  const pts = bench ? pick.gw_points : pick.gw_points * pick.multiplier;

  return (
    <div className="flex flex-col items-center gap-1 w-[72px]">
      <div className="w-14 h-14 flex items-center justify-center relative">
        {pick.is_captain && (
          <span aria-hidden="true" className="absolute inset-0 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(245,158,11,0.55) 0%, rgba(245,158,11,0) 70%)" }} />
        )}
        {pick.teamCode > 0 ? (
          <img src={shirtUrl(pick.teamCode, isGk)} alt={pick.team} width={46} height={52}
            className="relative object-contain" style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.45))", opacity: bench ? 0.75 : 1 }} />
        ) : (
          <span className="relative text-[10px] font-bold text-center leading-tight px-1 text-white">
            {pick.name}
          </span>
        )}
        {pick.is_captain && (
          <span className="absolute -top-0.5 -right-1 w-5 h-5 rounded-full text-[10px] font-extrabold flex items-center justify-center"
            style={{ background: "#f59e0b", color: "#000", boxShadow: "0 0 0 2px #0f1520" }}>C</span>
        )}
        {pick.is_vice_captain && (
          <span className="absolute -top-0.5 -right-1 w-5 h-5 rounded-full text-[10px] font-extrabold flex items-center justify-center"
            style={{ background: "#0f1520", color: "#c8d4e3", boxShadow: "0 0 0 1.5px #6688aa" }}>V</span>
        )}
        {statusDot && !pick.is_captain && !pick.is_vice_captain && (
          <span className="absolute -top-0.5 -left-0.5">
            {statusDot.type === "suspended"
              ? <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ background: "#000", color: "#a855f7", border: "1.5px solid #a855f7" }}>S</span>
              : <StatusTriangle color={statusDot.type} size={15} />
            }
          </span>
        )}
        {onInfo && pick.element > 0 && (
          <button
            onClick={e => { e.stopPropagation(); onInfo(pick.element); }}
            aria-label={`Info about ${pick.name}`}
            className="absolute -right-2 bottom-0 flex items-center justify-center"
            style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(15,21,32,0.9)", border: "1px solid #2a3d55", fontSize: 10, fontWeight: 700, color: "#c8d4e3" }}
          >i</button>
        )}
      </div>
      <div className="w-[68px] rounded-md overflow-hidden text-center"
        style={{ boxShadow: "0 4px 10px -2px rgba(0,0,0,0.5)" }}>
        {bench && (
          <span className="block text-[8px] font-bold tracking-wider py-px"
            style={{ background: "#1e3050", color: "#8aa4c2" }}>
            {TYPE_LABEL[pick.element_type]}
          </span>
        )}
        <span className="block text-[10.5px] font-bold leading-tight px-1 py-[3px] truncate"
          style={{ background: bench ? "#c8d4e3" : "#fff", color: "#0f1520" }}>
          {pick.name}
        </span>
        <span className="block text-[11px] font-extrabold tabular-nums py-[2px]"
          style={{
            background: pick.is_captain ? "#f59e0b" : "rgba(15,21,32,0.92)",
            color: pick.is_captain ? "#000" : pts > 0 ? (bench ? "#8ab0d8" : "#f59e0b") : "#4d6a88",
          }}>
          {pts}
        </span>
      </div>
    </div>
  );
}

function PitchRow({ picks, bench, onInfo }: { picks: Pick[]; bench?: boolean; onInfo?: (id: number) => void }) {
  return (
    <div className="flex justify-center gap-1.5">
      {picks.map((p) => <PlayerCard key={p.element} pick={p} bench={bench} onInfo={onInfo} />)}
    </div>
  );
}

function PitchMarkings() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 500" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="155" y="0" width="90" height="8" rx="2" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
      <line x1="155" y1="8" x2="165" y2="0" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      <line x1="200" y1="8" x2="200" y2="0" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      <line x1="245" y1="8" x2="235" y2="0" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      <rect x="140" y="10" width="120" height="70" rx="0" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
      <rect x="80" y="10" width="240" height="130" rx="0" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
      <path d="M 145 140 A 55 55 0 0 0 255 140" stroke="rgba(255,255,255,0.2)" strokeWidth="2" fill="none" />
      <circle cx="200" cy="105" r="3" fill="rgba(255,255,255,0.2)" />
      <line x1="0" y1="492" x2="400" y2="492" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
      <path d="M 140 492 A 60 60 0 0 0 260 492" stroke="rgba(255,255,255,0.2)" strokeWidth="2" fill="none" />
    </svg>
  );
}

interface ChipUsage {
  gw: number;
  chip: string;
}

interface LeagueStanding {
  entryId: number;
  teamName: string;
  managerName: string;
  rank: number;
  total: number;
  gwPoints: number;
}

interface League {
  id: number;
  name: string;
  standings: LeagueStanding[];
  myRank: number;
}

const EMPTY_PICKS: Pick[] = [
  { element: -1,  position: 1,  multiplier: 1, is_captain: false, is_vice_captain: false, name: "GKP", team: "", teamCode: 0, element_type: 1, gw_points: 0 },
  { element: -2,  position: 2,  multiplier: 1, is_captain: false, is_vice_captain: false, name: "DEF", team: "", teamCode: 0, element_type: 2, gw_points: 0 },
  { element: -3,  position: 3,  multiplier: 1, is_captain: false, is_vice_captain: false, name: "DEF", team: "", teamCode: 0, element_type: 2, gw_points: 0 },
  { element: -4,  position: 4,  multiplier: 1, is_captain: false, is_vice_captain: false, name: "DEF", team: "", teamCode: 0, element_type: 2, gw_points: 0 },
  { element: -5,  position: 5,  multiplier: 1, is_captain: false, is_vice_captain: false, name: "DEF", team: "", teamCode: 0, element_type: 2, gw_points: 0 },
  { element: -6,  position: 6,  multiplier: 1, is_captain: false, is_vice_captain: false, name: "MID", team: "", teamCode: 0, element_type: 3, gw_points: 0 },
  { element: -7,  position: 7,  multiplier: 1, is_captain: false, is_vice_captain: false, name: "MID", team: "", teamCode: 0, element_type: 3, gw_points: 0 },
  { element: -8,  position: 8,  multiplier: 1, is_captain: false, is_vice_captain: false, name: "MID", team: "", teamCode: 0, element_type: 3, gw_points: 0 },
  { element: -9,  position: 9,  multiplier: 1, is_captain: false, is_vice_captain: false, name: "MID", team: "", teamCode: 0, element_type: 3, gw_points: 0 },
  { element: -10, position: 10, multiplier: 1, is_captain: false, is_vice_captain: false, name: "FWD", team: "", teamCode: 0, element_type: 4, gw_points: 0 },
  { element: -11, position: 11, multiplier: 1, is_captain: false, is_vice_captain: false, name: "FWD", team: "", teamCode: 0, element_type: 4, gw_points: 0 },
  { element: -12, position: 12, multiplier: 1, is_captain: false, is_vice_captain: false, name: "GKP", team: "", teamCode: 0, element_type: 1, gw_points: 0 },
  { element: -13, position: 13, multiplier: 1, is_captain: false, is_vice_captain: false, name: "DEF", team: "", teamCode: 0, element_type: 2, gw_points: 0 },
  { element: -14, position: 14, multiplier: 1, is_captain: false, is_vice_captain: false, name: "MID", team: "", teamCode: 0, element_type: 3, gw_points: 0 },
  { element: -15, position: 15, multiplier: 1, is_captain: false, is_vice_captain: false, name: "FWD", team: "", teamCode: 0, element_type: 4, gw_points: 0 },
];

const ALL_CHIPS = [
  { key: "wildcard", label: "WC" },
  { key: "freehit", label: "FH" },
  { key: "3xc", label: "TC" },
  { key: "bboost", label: "BB" },
];

export default function MyTeamPage() {
  const [teamId, setTeamId] = useState("");
  const [infoPlayerId, setInfoPlayerId] = useState<number | null>(null);
  const [inputId, setInputId] = useState("");
  const [data, setData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [viewGw, setViewGw] = useState<number | null>(null);
  const [chips, setChips] = useState<ChipUsage[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [expandedLeague, setExpandedLeague] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("fpl_team_id");
    if (saved) {
      setTeamId(saved);
      // Fetch default GW from gw-status, then load team
      fetch("/api/fpl/gw-status")
        .then(r => r.json())
        .then(status => {
          const defaultGw = status.viewGw ?? status.currentGw ?? undefined;
          setViewGw(defaultGw);
          fetchTeam(saved, defaultGw);
        })
        .catch(() => fetchTeam(saved));
    }
  }, []);

  // Poll for live point updates every 30s (only on current GW)
  useEffect(() => {
    if (!teamId) return;
    const isCurrentGw = !viewGw || (data && viewGw === data.currentGw);
    if (!isCurrentGw) return;
    const interval = setInterval(() => {
      refreshPoints(teamId, viewGw ?? undefined);
    }, 30000);
    return () => clearInterval(interval);
  }, [teamId, viewGw, data]);

  async function fetchTeam(id: string, gw?: number) {
    setLoading(true);
    setError("");
    try {
      const url = gw ? `/api/fpl/team?id=${id}&gw=${gw}` : `/api/fpl/team?id=${id}`;
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok && !json.noData) throw new Error("Team not found");
      setData(json);
      setTeamId(id);
      if (!viewGw) setViewGw(json.currentGw ?? json.gw);
      localStorage.setItem("fpl_team_id", id);

      // Load chips and leagues in parallel (reload when team changes)
      if (chips.length === 0 || teamId !== id) {
        Promise.all([
          fetch(`/api/fpl/history?id=${id}`).then(r => r.json()).catch(() => ({ chips: [] })),
          fetch(`/api/fpl/leagues?id=${id}`).then(r => r.json()).catch(() => ({ leagues: [] })),
        ]).then(([historyData, leagueData]) => {
          setChips(historyData.chips ?? []);
          setLeagues(leagueData.leagues ?? []);
        });
      }
    } catch {
      setError("Could not find that team ID. Check and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function refreshPoints(id: string, gw?: number) {
    try {
      const url = gw ? `/api/fpl/team?id=${id}&gw=${gw}` : `/api/fpl/team?id=${id}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const json = await res.json();
      setData(json);
    } catch { /* silent */ }
  }

  function changeGw(dir: number) {
    if (!viewGw || !data) return;
    const next = viewGw + dir;
    if (next < 1 || next > data.currentGw) return;
    setViewGw(next);
    fetchTeam(teamId, next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (inputId.trim()) fetchTeam(inputId.trim());
  }

  const picks = data ? (data.picks.length > 0 ? data.picks : EMPTY_PICKS) : [];
  const isEmptySquad = data?.picks.length === 0;

  const starting = picks.filter((p) => p.position <= 11);
  const bench = picks.filter((p) => p.position > 11);

  const gk = starting.filter((p) => p.element_type === 1);
  const defs = starting.filter((p) => p.element_type === 2);
  const mids = starting.filter((p) => p.element_type === 3);
  const fwds = starting.filter((p) => p.element_type === 4);

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <header className="mb-6">
        <p className="text-[11px] font-semibold tracking-[0.15em] uppercase" style={{ color: "#f59e0b" }}>My Team</p>
        <h1 className="text-2xl font-bold tracking-tight text-white mt-0.5">
          {data ? data.manager : "Your Squad"}
        </h1>
      </header>

      {/* ID input */}
      {!teamId && (
        <form onSubmit={handleSubmit} className="mb-6">
          <p className="text-sm mb-3" style={{ color: "#6688aa" }}>
            Enter your FPL Team ID to see your squad and points.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputId}
              onChange={(e) => setInputId(e.target.value)}
              placeholder="e.g. 1213119"
              className="flex-1 px-4 py-2 rounded-lg text-sm text-white outline-none"
              style={{ background: "#1a2538", border: "1px solid #1e3050" }}
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: "#f59e0b", color: "#000" }}
            >
              Load →
            </button>
          </div>
          {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
        </form>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#f59e0b", borderTopColor: "transparent" }} />
        </div>
      )}

      {data && !loading && (
        <>
          {/* GW Navigator */}
          <div className="card flex items-center justify-between px-3 py-3 mb-3">
            <button
              onClick={() => changeGw(-1)}
              disabled={!viewGw || viewGw <= 1}
              aria-label="Previous gameweek"
              className="w-11 h-11 flex items-center justify-center rounded-xl disabled:opacity-20"
              style={{ background: "#1a2538", border: "1px solid #1e3050" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>
            </button>
            <div className="text-center">
              <p className="eyebrow">Gameweek {viewGw ?? data.gw}</p>
              <p className="mt-1 leading-none tabular-nums">
                <span className="text-4xl font-extrabold tracking-tight" style={{ color: "#f59e0b" }}>{data.gw_points}</span>
                <span className="text-sm font-semibold ml-1" style={{ color: "#6688aa" }}>pts</span>
              </p>
            </div>
            <button
              onClick={() => changeGw(1)}
              disabled={!viewGw || viewGw >= data.currentGw}
              aria-label="Next gameweek"
              className="w-11 h-11 flex items-center justify-center rounded-xl disabled:opacity-20"
              style={{ background: "#1a2538", border: "1px solid #1e3050" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9,18 15,12 9,6"/></svg>
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: "Overall", value: data.overall_points.toLocaleString() + "pts" },
              { label: "Rank", value: data.overall_rank.toLocaleString() },
              { label: "Bank", value: "£" + data.bank + "m" },
            ].map((s, i) => (
              <div key={i} className="card px-2 py-3 text-center">
                <p className="eyebrow mb-1">{s.label}</p>
                <p className="text-[15px] font-bold text-white tabular-nums">{s.value}</p>
              </div>
            ))}
          </div>

          {/* GW1 banner */}
          {isEmptySquad && (
            <div className="rounded-xl px-4 py-3 mb-4" style={{ background: "#1a1200", border: "1px solid #f59e0b44" }}>
              <p className="text-xs font-bold mb-0.5" style={{ color: "#f59e0b" }}>Season hasn't started yet</p>
              <p className="text-[11px]" style={{ color: "#a07030" }}>Build your squad in the Transfers tab before GW1 kicks off.</p>
            </div>
          )}

          {/* Pitch */}
          <div className="rounded-2xl mb-4 overflow-hidden relative" style={{
            boxShadow: "inset 0 0 60px rgba(0,0,0,0.35), 0 12px 30px -12px rgba(0,0,0,0.6)",
            background: `repeating-linear-gradient(
              180deg,
              #1e6b35 0px, #1e6b35 60px,
              #1a5f2e 60px, #1a5f2e 120px
            )`,
            border: "1px solid #2e7a3e",
          }}>
            <PitchMarkings />
            <div className="relative z-10 py-5 space-y-3">
              <PitchRow picks={gk} onInfo={setInfoPlayerId} />
              <PitchRow picks={defs} onInfo={setInfoPlayerId} />
              <PitchRow picks={mids} onInfo={setInfoPlayerId} />
              <PitchRow picks={fwds} onInfo={setInfoPlayerId} />
            </div>
          </div>

          {/* Bench */}
          <div className="card p-3 pt-2.5">
            <p className="eyebrow mb-3">Bench</p>
            <div className="flex justify-around">
              {bench.map((p) => <PlayerCard key={p.element} pick={p} bench onInfo={setInfoPlayerId} />)}
            </div>
          </div>

          {/* Chips */}
          <div className="card px-4 py-3 mt-4 mb-4">
            <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#6688aa" }}>Chips</p>
            <div className="flex gap-2">
              {ALL_CHIPS.map((c) => {
                const used = chips.find(ch => ch.chip === c.key);
                return (
                  <div key={c.key} className="flex-1 rounded-lg py-2 text-center"
                    style={{
                      background: used ? "#121b29" : "#f59e0b11",
                      border: `1px solid ${used ? "#0f1520" : "#f59e0b33"}`,
                    }}>
                    <p className="text-xs font-bold" style={{ color: used ? "#555" : "#f59e0b" }}>{c.label}</p>
                    {used ? (
                      <>
                        <p className="text-[9px] mt-0.5" style={{ color: "#4d6a88" }}>Used</p>
                        <p className="text-[8px]" style={{ color: "#2a3a4a" }}>GW{used.gw}</p>
                      </>
                    ) : (
                      <p className="text-[9px] mt-0.5" style={{ color: "#f59e0b" }}>Available</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mini Leagues */}
          {leagues.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-wider mb-2 px-1" style={{ color: "#6688aa" }}>Mini Leagues</p>
              <div className="space-y-2">
                {leagues.map((league) => (
                  <div key={league.id} className="card overflow-hidden">
                    <button
                      onClick={() => setExpandedLeague(expandedLeague === league.id ? null : league.id)}
                      className="w-full text-left px-4 py-3 flex items-center justify-between active:opacity-70">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{league.name}</p>
                        <p className="text-[10px]" style={{ color: "#6688aa" }}>{league.standings.length} managers</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold" style={{ color: "#f59e0b" }}>#{league.myRank}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2"
                          style={{ transform: expandedLeague === league.id ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                          <polyline points="6,9 12,15 18,9" />
                        </svg>
                      </div>
                    </button>
                    {expandedLeague === league.id && (
                      <div style={{ borderTop: "1px solid #1a2a40" }}>
                        {league.standings.map((s) => (
                          <div key={s.entryId}
                            className="flex items-center px-4 py-2"
                            style={{
                              borderTop: "1px solid #152535",
                              background: s.entryId === parseInt(teamId) ? "#f59e0b0d" : "transparent",
                            }}>
                            <span className="text-xs font-bold w-8 text-center" style={{ color: "#6688aa" }}>{s.rank}</span>
                            <div className="flex-1 min-w-0 ml-2">
                              <p className="text-xs font-semibold truncate"
                                style={{ color: s.entryId === parseInt(teamId) ? "#f59e0b" : "#fff" }}>
                                {s.teamName}
                              </p>
                            </div>
                            <div className="text-right ml-2">
                              <p className="text-xs font-bold text-white">{s.total}</p>
                              <p className="text-[9px]" style={{ color: "#6688aa" }}>GW {s.gwPoints}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => { setTeamId(""); setData(null); localStorage.removeItem("fpl_team_id"); }}
            className="mt-2 text-xs w-full text-center py-2"
            style={{ color: "#3d5570" }}
          >
            Change team ID
          </button>
        </>
      )}
      {infoPlayerId && <PlayerInfoModal playerId={infoPlayerId} onClose={() => setInfoPlayerId(null)} />}
    </div>
  );
}
