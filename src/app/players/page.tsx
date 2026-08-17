"use client";
import { useState, useEffect, useMemo } from "react";
import PlayerInfoModal from "@/components/PlayerInfoModal";
import PlayerCompareModal from "@/components/PlayerCompareModal";

const TYPE_LABEL: Record<number, string> = { 1: "GK", 2: "DEF", 3: "MID", 4: "FWD" };
const TYPE_COLOR: Record<number, string> = { 1: "#facc15", 2: "#4ade80", 3: "#60a5fa", 4: "#f87171" };

interface Player {
  id: number;
  name: string;
  fullName?: string;
  type: number;
  team: string;
  teamCode: number;
  price: number;
  points: number;
  form: number;
  ppg: number;
  selected: number;
  status: string;
  news?: string;
  goals: number;
  assists: number;
  epNext: number;
  ictIndex: number;
  transfersIn?: number;
  transfersOut?: number;
  chanceNext?: number | null;
}

type SortKey = "points" | "form" | "epNext" | "price" | "selected" | "ppg" | "goals" | "assists" | "ictIndex";

const COLUMNS: { key: SortKey; label: string; short: string }[] = [
  { key: "price",    label: "Price",    short: "£"    },
  { key: "selected", label: "TSB%",     short: "TSB%" },
  { key: "form",     label: "Form",     short: "Form" },
  { key: "epNext",   label: "xPts",     short: "xPts" },
  { key: "points",   label: "Total pts",short: "TP"   },
];

function shirtUrl(code: number, isGk: boolean) {
  const suffix = isGk ? `_1-110.webp` : `-110.webp`;
  return `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${code}${suffix}`;
}

function statusIcon(s: string) {
  if (s === "i" || s === "u") return { icon: "🚑", color: "#ef4444" };
  if (s === "d") return { icon: "?", color: "#f59e0b" };
  if (s === "s") return { icon: "S", color: "#a855f7" };
  return null;
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [posFilter, setPosFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>("points");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [infoId, setInfoId] = useState<number | null>(null);
  const [compareA, setCompareA] = useState<Player | null>(null);
  const [compareB, setCompareB] = useState<Player | null>(null);
  const [showCompare, setShowCompare] = useState(false);

  useEffect(() => {
    fetch("/api/fpl/players")
      .then(r => r.json())
      .then(d => { setPlayers(d.players ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = players;
    if (posFilter) list = list.filter(p => p.type === posFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q) || (p.fullName ?? "").toLowerCase().includes(q));
    }
    list = [...list].sort((a, b) => {
      const diff = (a[sortBy] as number) - (b[sortBy] as number);
      return sortDir === "desc" ? -diff : diff;
    });
    return list;
  }, [players, posFilter, search, sortBy, sortDir]);

  function handleSort(key: SortKey) {
    if (sortBy === key) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortBy(key); setSortDir("desc"); }
  }

  function handleCompare(p: Player) {
    if (compareA?.id === p.id || compareB?.id === p.id) return;
    if (!compareA) { setCompareA(p); return; }
    if (!compareB) { setCompareB(p); setShowCompare(true); return; }
    // replace B with new player
    setCompareB(p);
    setShowCompare(true);
  }

  const compareCount = (compareA ? 1 : 0) + (compareB ? 1 : 0);

  return (
    <div className="min-h-screen pb-24" style={{ background: "#0c1420" }}>
      {/* Header */}
      <div className="sticky top-0 z-30" style={{ background: "#111d2b", borderBottom: "1px solid #1a2a3a" }}>
        <div className="px-4 pt-4 pb-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: "#f59e0b" }}>FPL</p>
          <h1 className="text-xl font-bold text-white">Player stats</h1>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4d6688" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search player or club…"
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm text-white outline-none"
              style={{ background: "#0c1420", border: "1px solid #1a2a3a" }}
            />
          </div>
        </div>

        {/* Position filter */}
        <div className="flex gap-2 px-4 pb-3">
          {[null, 1, 2, 3, 4].map(pos => (
            <button
              key={pos ?? "all"}
              onClick={() => setPosFilter(pos)}
              className="flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide"
              style={{
                background: posFilter === pos ? "#f59e0b" : "#162030",
                color: posFilter === pos ? "#000" : "#4d6688",
                border: `1px solid ${posFilter === pos ? "#f59e0b" : "#1a2a3a"}`,
              }}
            >
              {pos === null ? "All" : TYPE_LABEL[pos]}
            </button>
          ))}
        </div>
      </div>

      {/* Compare bar */}
      {compareA && (
        <div className="mx-4 mt-3 rounded-xl px-4 py-3 flex items-center justify-between"
          style={{ background: "#1a1500", border: "1px solid #f59e0b44" }}>
          <div>
            <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "#f59e0b" }}>
              Comparing {compareCount}/2 {compareCount < 2 && "— pick one more player"}
            </p>
            <div className="flex gap-3 items-center">
              <span className="text-xs font-semibold text-white">{compareA.name}</span>
              {compareB && <>
                <span style={{ color: "#f59e0b" }}>vs</span>
                <span className="text-xs font-semibold text-white">{compareB.name}</span>
              </>}
            </div>
          </div>
          <div className="flex gap-2">
            {compareA && compareB && (
              <button onClick={() => setShowCompare(true)} className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                style={{ background: "#f59e0b", color: "#000" }}>Compare</button>
            )}
            <button onClick={() => { setCompareA(null); setCompareB(null); }} className="text-xs px-3 py-1.5 rounded-lg"
              style={{ background: "#1e2d42", color: "#6688aa" }}>Clear</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="mx-4 mt-3 rounded-xl overflow-hidden" style={{ border: "1px solid #1a2a3a" }}>
        {/* Table header */}
        <div className="grid items-center px-3 py-2"
          style={{ gridTemplateColumns: "28px 1fr 52px 52px 52px 52px 52px", background: "#111d2b", borderBottom: "1px solid #1a2a3a" }}>
          <div />
          <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#4d6688" }}>Player</div>
          {COLUMNS.map(col => (
            <button key={col.key} onClick={() => handleSort(col.key)}
              className="text-[10px] font-semibold uppercase tracking-wide text-right flex items-center justify-end gap-0.5"
              style={{ color: sortBy === col.key ? "#f59e0b" : "#4d6688" }}>
              {col.short}
              {sortBy === col.key && <span style={{ fontSize: 8 }}>{sortDir === "desc" ? "↓" : "↑"}</span>}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "#f59e0b", borderTopColor: "transparent" }} />
          </div>
        )}

        {!loading && filtered.map((p, i) => {
          const isGk = p.type === 1;
          const si = statusIcon(p.status);
          const isCompared = compareA?.id === p.id || compareB?.id === p.id;
          return (
            <div key={p.id}
              className="grid items-center px-3 py-2"
              style={{
                gridTemplateColumns: "28px 1fr 52px 52px 52px 52px 52px",
                background: isCompared ? "#1a1500" : i % 2 === 0 ? "#0f1a28" : "#111d2b",
                borderBottom: "1px solid #0f1a25",
              }}>
              {/* Info button */}
              <button onClick={() => setInfoId(p.id)}
                className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                style={{ background: "#1a2538", border: "1px solid #2a3d55", color: "#6688aa" }}>i</button>

              {/* Player info */}
              <button className="flex items-center gap-2 text-left min-w-0" onClick={() => handleCompare(p)}>
                <div className="relative flex-shrink-0">
                  <img src={shirtUrl(p.teamCode, isGk)} alt={p.team} width={24} height={28} className="object-contain" />
                  {si && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full flex items-center justify-center text-[6px] font-bold"
                      style={{ background: "#000", color: si.color, border: `1px solid ${si.color}` }}>{si.icon}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-white truncate">{p.name}</span>
                    {isCompared && <span className="text-[8px] px-1 py-0.5 rounded font-bold" style={{ background: "#f59e0b22", color: "#f59e0b" }}>★</span>}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[9px]" style={{ color: "#4d6688" }}>{p.team}</span>
                    <span className="text-[8px] font-bold px-1 rounded" style={{ background: TYPE_COLOR[p.type] + "22", color: TYPE_COLOR[p.type] }}>
                      {TYPE_LABEL[p.type]}
                    </span>
                  </div>
                </div>
              </button>

              {/* Stats */}
              <div className="text-right text-xs font-semibold font-variant-numeric" style={{ color: "#e5e5e5" }}>£{p.price.toFixed(1)}</div>
              <div className="text-right text-xs font-variant-numeric" style={{ color: "#6688aa" }}>{p.selected.toFixed(1)}%</div>
              <div className="text-right text-xs font-semibold font-variant-numeric" style={{ color: p.form >= 6 ? "#4ade80" : p.form >= 3 ? "#e5e5e5" : "#6688aa" }}>{p.form.toFixed(1)}</div>
              <div className="text-right text-xs font-semibold font-variant-numeric" style={{ color: "#f59e0b" }}>{p.epNext.toFixed(1)}</div>
              <div className="text-right text-xs font-bold font-variant-numeric text-white">{p.points}</div>
            </div>
          );
        })}

        {!loading && filtered.length === 0 && (
          <div className="py-10 text-center">
            <p className="text-sm" style={{ color: "#4d6688" }}>No players found.</p>
          </div>
        )}
      </div>

      <p className="text-center text-[10px] mt-3 pb-2" style={{ color: "#2a3a50" }}>
        {filtered.length} players · tap a row to add to comparison
      </p>

      {infoId && <PlayerInfoModal playerId={infoId} onClose={() => setInfoId(null)} />}
      {showCompare && compareA && compareB && (
        <PlayerCompareModal
          playerA={compareA}
          playerB={compareB}
          onClose={() => setShowCompare(false)}
          onSwapA={(p) => setCompareA(p)}
          onSwapB={(p) => setCompareB(p)}
        />
      )}
    </div>
  );
}
