"use client";

import { useState, useEffect } from "react";

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

function PlayerCard({ pick }: { pick: Pick }) {
  const isGk = pick.element_type === 1;

  return (
    <div className="flex flex-col items-center gap-0.5 w-[72px]">
      <div className="w-14 h-14 rounded-xl flex items-center justify-center relative"
        style={{
          background: pick.is_captain ? "#f59e0b" : "#14532d",
          border: `1.5px solid ${pick.is_captain ? "#f59e0b" : "#22763e"}`,
        }}>
        {pick.teamCode > 0 ? (
          <img
            src={shirtUrl(pick.teamCode, isGk)}
            alt={pick.team}
            width={36}
            height={40}
            className="object-contain"
          />
        ) : (
          <span className="text-[10px] font-bold text-center leading-tight px-1"
            style={{ color: pick.is_captain ? "#000" : "#fff" }}>
            {pick.name}
          </span>
        )}
        {pick.is_captain && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center"
            style={{ background: "#000", color: "#f59e0b", border: "1.5px solid #f59e0b" }}>C</span>
        )}
        {pick.is_vice_captain && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center"
            style={{ background: "#000", color: "#888", border: "1.5px solid #888" }}>V</span>
        )}
      </div>
      <div className="flex flex-col items-center w-full">
        <span className="text-[10px] font-bold text-center leading-tight rounded-t px-1 py-0.5 w-full truncate block"
          style={{ background: "#fff", color: "#000", maxWidth: "72px" }}>
          {pick.name}
        </span>
        <span className="text-[10px] font-bold tabular-nums text-center rounded-b px-1.5 py-0.5 w-full"
          style={{ background: pick.gw_points > 0 ? "#f59e0b" : "#555", color: pick.gw_points > 0 ? "#000" : "#fff" }}>
          {pick.gw_points * pick.multiplier}
        </span>
      </div>
    </div>
  );
}

function PitchRow({ picks }: { picks: Pick[] }) {
  return (
    <div className="flex justify-center gap-2 my-1">
      {picks.map((p) => <PlayerCard key={p.element} pick={p} />)}
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

const ALL_CHIPS = [
  { key: "wildcard", label: "WC" },
  { key: "freehit", label: "FH" },
  { key: "3xc", label: "TC" },
  { key: "bboost", label: "BB" },
];

export default function MyTeamPage() {
  const [teamId, setTeamId] = useState("");
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
      if (!res.ok) throw new Error("Team not found");
      const json = await res.json();
      setData(json);
      if (!viewGw) setViewGw(json.currentGw ?? json.gw);
      localStorage.setItem("fpl_team_id", id);

      // Load chips and leagues in parallel (only on first load)
      if (!gw) {
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

  const starting = data?.picks.filter((p) => p.position <= 11) ?? [];
  const bench = data?.picks.filter((p) => p.position > 11) ?? [];

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
          <div className="flex items-center justify-between rounded-xl px-4 py-3 mb-4"
            style={{ background: "#162030", border: "1px solid #1e3050" }}>
            <button
              onClick={() => changeGw(-1)}
              disabled={!viewGw || viewGw <= 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-opacity disabled:opacity-20"
              style={{ background: "#1e2d42" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5"><polyline points="15,18 9,12 15,6"/></svg>
            </button>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-widest" style={{ color: "#6688aa" }}>Gameweek</p>
              <p className="text-lg font-bold text-white">{viewGw ?? data.gw}</p>
              <p className="text-2xl font-bold" style={{ color: "#f59e0b" }}>{data.gw_points} pts</p>
            </div>
            <button
              onClick={() => changeGw(1)}
              disabled={!viewGw || viewGw >= data.currentGw}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-opacity disabled:opacity-20"
              style={{ background: "#1e2d42" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5"><polyline points="9,18 15,12 9,6"/></svg>
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: "Overall", value: data.overall_points.toLocaleString() + "pts" },
              { label: "Rank", value: data.overall_rank.toLocaleString() },
              { label: "Bank", value: "£" + data.bank + "m" },
            ].map((s, i) => (
              <div key={i} className="rounded-xl p-2.5 text-center" style={{ background: "#162030", border: "1px solid #1e3050" }}>
                <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "#6688aa" }}>{s.label}</p>
                <p className="text-sm font-bold text-white">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Pitch */}
          <div className="rounded-xl mb-4 overflow-hidden relative" style={{
            background: `repeating-linear-gradient(
              180deg,
              #1e6b35 0px, #1e6b35 60px,
              #1a5f2e 60px, #1a5f2e 120px
            )`,
            border: "1px solid #2e7a3e",
          }}>
            <PitchMarkings />
            <div className="relative z-10 py-4">
              <PitchRow picks={gk} />
              <PitchRow picks={defs} />
              <PitchRow picks={mids} />
              <PitchRow picks={fwds} />
            </div>
          </div>

          {/* Bench */}
          <div className="rounded-xl p-3" style={{ background: "#162030", border: "1px solid #1e3050" }}>
            <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: "#6688aa" }}>Bench</p>
            <div className="flex justify-around">
              {bench.map((p) => (
                <div key={p.element} className="flex flex-col items-center gap-0.5 w-[72px]">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center"
                    style={{ background: "#1a1a1a", border: "1px solid #0f1520" }}>
                    {p.teamCode > 0 ? (
                      <img src={shirtUrl(p.teamCode, p.element_type === 1)} alt={p.team} width={36} height={40} className="object-contain opacity-60" />
                    ) : (
                      <span className="text-white text-[8px] text-center px-1">{p.name}</span>
                    )}
                  </div>
                  <div className="flex flex-col items-center w-full">
                    <span className="text-[10px] font-bold text-center leading-tight rounded-t px-1 py-0.5 w-full truncate block"
                      style={{ background: "#fff", color: "#000", maxWidth: "72px" }}>
                      {p.name}
                    </span>
                    <span className="text-[10px] font-bold tabular-nums text-center rounded-b px-1.5 py-0.5 w-full"
                      style={{ background: p.gw_points > 0 ? "#f59e0b" : "#555", color: p.gw_points > 0 ? "#000" : "#fff" }}>
                      {p.gw_points}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chips */}
          <div className="rounded-xl px-4 py-3 mt-4 mb-4" style={{ background: "#162030", border: "1px solid #1e3050" }}>
            <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#6688aa" }}>Chips</p>
            <div className="flex gap-2">
              {ALL_CHIPS.map((c) => {
                const used = chips.find(ch => ch.chip === c.key);
                return (
                  <div key={c.key} className="flex-1 rounded-lg py-2 text-center"
                    style={{
                      background: used ? "#1a1a1a" : "#f59e0b11",
                      border: `1px solid ${used ? "#0f1520" : "#f59e0b33"}`,
                    }}>
                    <p className="text-xs font-bold" style={{ color: used ? "#555" : "#f59e0b" }}>{c.label}</p>
                    {used ? (
                      <p className="text-[9px] mt-0.5" style={{ color: "#4d6a88" }}>GW{used.gw}</p>
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
                  <div key={league.id} className="rounded-xl overflow-hidden" style={{ background: "#162030", border: "1px solid #1e3050" }}>
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
                              <p className="text-[10px]" style={{ color: "#4d6a88" }}>{s.managerName}</p>
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
    </div>
  );
}
