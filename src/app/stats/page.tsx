"use client";

import { useEffect, useState, useMemo } from "react";
import PlayerInfoModal from "@/components/PlayerInfoModal";
import PlayerCompareModal from "@/components/PlayerCompareModal";

// ─── Icons ──────────────────────────────────────────────────────────────────

const IC = ({ d }: { d: string }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d={d} />
  </svg>
);

const ICONS = {
  intel:    <IC d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2M18 14h-8M15 18h-5M10 6h8v4h-8z" />,
  managers: <IC d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />,
  europe:   <IC d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />,
  calendar: <IC d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />,
  star:     <IC d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />,
  target:   <IC d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />,
  fire:     <IC d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 0 1-7 7 7 7 0 0 1-7-7c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />,
  diamond:  <IC d="M2.7 10.3a2.4 2.4 0 0 0 0 3.41l7.56 7.57a2.4 2.4 0 0 0 3.4 0l7.57-7.57a2.4 2.4 0 0 0 0-3.4L13.67 2.72a2.4 2.4 0 0 0-3.41 0z" />,
  bolt:     <IC d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
  money:    <IC d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM12 6v2M12 16v2M8 12h8M8 10h1a3 3 0 0 1 0 6H8" />,
  shield:   <IC d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  up:       <IC d="M3 17l4-8 4 4 4-6 4 8" />,
  down:     <IC d="M3 7l4 8 4-4 4 6 4-8" />,
};

// ─── Types ───────────────────────────────────────────────────────────────────

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

interface ScoutPlayer {
  id: number; name: string; team: string; type: number;
  epNext: number; form: number; ownership: number;
  transfersIn: number; priceChange: number; price: number;
  totalPoints: number; ppg: number; valueSeason: number;
  ictIndex: number; chanceNext: number | null; news: string; fdr: number;
}

interface ScoutData {
  currentGw: number;
  captainPicks: ScoutPlayer[];
  hotTransfersIn: ScoutPlayer[];
  differentials: ScoutPlayer[];
  priceRisers: ScoutPlayer[];
  priceFallers: ScoutPlayer[];
  ictLeaders: ScoutPlayer[];
  bestValue: ScoutPlayer[];
  easyFixtures: ScoutPlayer[];
}

interface ElitePlayer { id: number; name: string; team: string; type: number; count: number; outOf: number; }
interface EliteData { currentGw: number; managersAnalyzed: number; mostOwned: ElitePlayer[]; captainChoices: ElitePlayer[]; }

// ─── Constants ───────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<number, string> = { 1: "GK", 2: "DEF", 3: "MID", 4: "FWD" };
const TYPE_COLOR: Record<number, string> = { 1: "#facc15", 2: "#4ade80", 3: "#60a5fa", 4: "#f87171" };
const SCOUT_TYPE_COLOR: Record<number, string> = { 1: "#f59e0b", 2: "#22d3ee", 3: "#a78bfa", 4: "#4ade80" };
const PAGE_SIZE = 20;

type SortKey = "points" | "form" | "epNext" | "price" | "selected" | "ppg" | "goals" | "assists" | "ictIndex";

const COLUMNS: { key: SortKey; short: string }[] = [
  { key: "price",    short: "£"    },
  { key: "selected", short: "TSB%" },
  { key: "form",     short: "Form" },
  { key: "epNext",   short: "xPts" },
  { key: "points",   short: "TP"   },
];

// ─── Scout static data ───────────────────────────────────────────────────────

const NEW_MANAGERS = [
  { club: "Chelsea",       manager: "Xabi Alonso",      flag: "🇪🇸", style: "Possession-based, tactical flexibility. Won Bundesliga with Leverkusen undefeated.", fplNote: "Big squad rotation expected early. Wait for settled XI before investing." },
  { club: "Liverpool",     manager: "Andoni Iraola",     flag: "🇪🇸", style: "Intense high press, aggressive gegenpressing. Made his name at Bournemouth.", fplNote: "Press-triggering midfielders and high-energy forwards likely to shine." },
  { club: "Man City",      manager: "Enzo Maresca",      flag: "🇮🇹", style: "Possession-based, structured build-up. Won PL title with Chelsea in 24/25.", fplNote: "System players could carry over. Watch who fits Maresca's mould." },
  { club: "Newcastle",     manager: "Matthias Jaissle",  flag: "🇩🇪", style: "High press, compact 4-3-3. Won Saudi League with Al Ahli. RB-school coach.", fplNote: "Unknown quantity in PL. Avoid Newcastle assets until system is clear." },
  { club: "Nott'm Forest", manager: "Oliver Glasner",    flag: "🇦🇹", style: "Intense pressing, dynamic attacking play. Won FA Cup with Crystal Palace.", fplNote: "Forest attacking players could be undervalued given new ambition." },
  { club: "Crystal Palace",manager: "Pierre Sage",       flag: "🇫🇷", style: "Attack-minded, won Conference League with Palace. Previously promoted Lyon to CL.", fplNote: "Palace assets could be undervalued early in the season." },
  { club: "Bournemouth",   manager: "Marco Rose",        flag: "🇩🇪", style: "Gegenpressing 4-2-3-1, high tempo. Experience from RB Leipzig & Dortmund.", fplNote: "High-press style suits physical forwards and box-to-box midfielders." },
  { club: "Fulham",        manager: "Álvaro Arbeloa",    flag: "🇪🇸", style: "Former Real Madrid defender. Coached Real Madrid Castilla. First senior PL job.", fplNote: "Big unknown. Avoid Fulham assets until style and first XI becomes clear." },
  { club: "Ipswich",       manager: "Gary O'Neil",       flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", style: "Defensive structure, pragmatic. Solid record at Wolves and Bournemouth.", fplNote: "Ipswich fighting relegation — avoid assets unless clear first-team role." },
];

const EUROPEAN_CLUBS = [
  { competition: "Champions League", color: "#3b82f6", clubs: [
    { name: "Arsenal", note: "Top seeds, deep run expected" },
    { name: "Manchester City", note: "New manager + UCL = rotation risk" },
    { name: "Manchester United", note: "Europa League last season, now UCL" },
    { name: "Aston Villa", note: "Building on last season's run" },
    { name: "Liverpool", note: "New manager Iraola + UCL from day 1" },
  ]},
  { competition: "Europa League", color: "#f59e0b", clubs: [
    { name: "Bournemouth", note: "First ever European campaign" },
    { name: "Crystal Palace", note: "As Conference League winners → UEL" },
    { name: "Sunderland", note: "Historic return to European football" },
  ]},
  { competition: "Conference League", color: "#22d3ee", clubs: [
    { name: "Brighton", note: "Smaller squad depth, rotation likely" },
  ]},
];

const INTERNATIONAL_BREAKS = [
  { label: "Autumn (merged Sep/Oct)", after: "GW5",  before: "GW6",  dates: "~20 Sep – 10 Oct 2026", duration: "3 weeks", note: "Sep & Oct windows merged — longest break of the season" },
  { label: "November",                after: "GW10", before: "GW11", dates: "~7 – 21 Nov 2026",       duration: "2 weeks", note: "Standard international window" },
  { label: "March / Spring",          after: "GW28", before: "GW29", dates: "~20 Mar – 10 Apr 2027",  duration: "3 weeks", note: "Mid-season break — good window for DGW planning" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function shirtUrl(code: number, isGk: boolean) {
  return `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${code}${isGk ? "_1" : ""}-110.webp`;
}

function statusIcon(s: string) {
  if (s === "i" || s === "u") return { icon: "🚑", color: "#ef4444" };
  if (s === "d") return { icon: "?", color: "#f59e0b" };
  if (s === "s") return { icon: "S", color: "#a855f7" };
  return null;
}

function formatTransfers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}

// ─── Scout sub-components ────────────────────────────────────────────────────

function ScoutPlayerRow({ player, stat, statLabel }: { player: ScoutPlayer; stat: string; statLabel: string }) {
  const color = SCOUT_TYPE_COLOR[player.type];
  const injured = player.chanceNext !== null && player.chanceNext < 75;
  return (
    <div className="flex items-center gap-3 px-4 py-3" style={{ borderTop: "1px solid #1a2a40" }}>
      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded w-8 text-center flex-shrink-0"
        style={{ background: color + "22", color }}>{TYPE_LABEL[player.type]}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-white truncate">{player.name}</p>
          {injured && <span className="text-[9px]" style={{ color: "#ef4444" }}>⚠</span>}
        </div>
        <p className="text-[10px]" style={{ color: "#6688aa" }}>{player.team} · £{player.price.toFixed(1)}m · {player.ownership.toFixed(1)}%</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold" style={{ color: "#f59e0b" }}>{stat}</p>
        <p className="text-[10px]" style={{ color: "#6688aa" }}>{statLabel}</p>
      </div>
    </div>
  );
}

function ScoutSection({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <div>
          <h2 className="text-sm font-bold text-white">{title}</h2>
          {subtitle && <p className="text-[10px]" style={{ color: "#6688aa" }}>{subtitle}</p>}
        </div>
      </div>
      <div className="rounded-xl overflow-hidden" style={{ background: "#162030", border: "1px solid #1e3050" }}>
        {children}
      </div>
    </section>
  );
}

// ─── Search modal for compare ────────────────────────────────────────────────

function PlayerSearchModal({ allPlayers, onSelect, onClose, title }: {
  allPlayers: Player[];
  onSelect: (p: Player) => void;
  onClose: () => void;
  title: string;
}) {
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    if (!q.trim()) return allPlayers.slice(0, 20);
    const lower = q.toLowerCase();
    return allPlayers.filter(p =>
      p.name.toLowerCase().includes(lower) ||
      p.team.toLowerCase().includes(lower) ||
      (p.fullName ?? "").toLowerCase().includes(lower)
    ).slice(0, 20);
  }, [q, allPlayers]);

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.75)" }} onClick={onClose}>
      <div className="w-full max-h-[80vh] flex flex-col"
        style={{ background: "#0f1520", borderRadius: "16px 16px 0 0", border: "1px solid #1e3050" }}
        onClick={e => e.stopPropagation()}>
        <div className="px-4 pt-4 pb-3" style={{ borderBottom: "1px solid #1a2a3a" }}>
          <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#f59e0b" }}>{title}</p>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4d6688" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              autoFocus
              type="text"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search player or club…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white outline-none"
              style={{ background: "#162030", border: "1px solid #1a2a3a" }}
            />
          </div>
        </div>
        <div className="overflow-y-auto flex-1">
          {results.map(p => {
            const isGk = p.type === 1;
            const si = statusIcon(p.status);
            return (
              <button key={p.id} onClick={() => { onSelect(p); onClose(); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
                style={{ borderBottom: "1px solid #0f1a25" }}>
                <div className="relative flex-shrink-0">
                  <img src={shirtUrl(p.teamCode, isGk)} alt={p.team} width={24} height={28} className="object-contain" />
                  {si && <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full flex items-center justify-center text-[6px] font-bold"
                    style={{ background: "#000", color: si.color, border: `1px solid ${si.color}` }}>{si.icon}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                  <p className="text-[10px]" style={{ color: "#6688aa" }}>
                    {p.team} · <span style={{ color: TYPE_COLOR[p.type] }}>{TYPE_LABEL[p.type]}</span> · £{p.price.toFixed(1)}m
                  </p>
                </div>
                <p className="text-sm font-bold flex-shrink-0" style={{ color: "#f59e0b" }}>{p.points}pts</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Players tab ─────────────────────────────────────────────────────────────

function PlayersTab({ allPlayers, loading }: { allPlayers: Player[]; loading: boolean }) {
  const [search, setSearch] = useState("");
  const [posFilter, setPosFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>("points");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(0);
  const [infoId, setInfoId] = useState<number | null>(null);
  const [compareA, setCompareA] = useState<Player | null>(null);
  const [compareB, setCompareB] = useState<Player | null>(null);
  const [searchFor, setSearchFor] = useState<"A" | "B" | null>(null);
  const [showCompare, setShowCompare] = useState(false);

  const filtered = useMemo(() => {
    let list = allPlayers;
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
  }, [allPlayers, posFilter, search, sortBy, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function handleSort(key: SortKey) {
    if (sortBy === key) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortBy(key); setSortDir("desc"); setPage(0); }
  }

  function handleSearchChange(v: string) { setSearch(v); setPage(0); }
  function handlePosFilter(p: number | null) { setPosFilter(p); setPage(0); }

  function selectForCompare(p: Player) {
    if (searchFor === "A") setCompareA(p);
    else setCompareB(p);
    setSearchFor(null);
    if (searchFor === "A" && compareB) setShowCompare(true);
    if (searchFor === "B" && compareA) setShowCompare(true);
  }

  return (
    <>
      {/* Compare slots */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {(["A", "B"] as const).map(slot => {
          const player = slot === "A" ? compareA : compareB;
          const accent = slot === "A" ? "#f59e0b" : "#22d3ee";
          return (
            <button key={slot} onClick={() => setSearchFor(slot)}
              className="rounded-xl overflow-hidden text-left"
              style={{ background: "#111d2b", border: `1px solid ${player ? accent + "55" : "#1a2a3a"}` }}>
              {player ? (
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <img src={shirtUrl(player.teamCode, player.type === 1)} alt={player.team} width={20} height={24} className="object-contain flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate" style={{ color: accent }}>{player.name}</p>
                    <p className="text-[9px]" style={{ color: "#6688aa" }}>{player.team} · £{player.price.toFixed(1)}m</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#1a2538", border: `1px dashed ${accent}44` }}>
                    <span style={{ color: accent, fontSize: 12, lineHeight: 1 }}>+</span>
                  </div>
                  <p className="text-[10px]" style={{ color: "#3d5570" }}>Add player {slot}</p>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {compareA && compareB && (
        <button onClick={() => setShowCompare(true)}
          className="w-full py-2.5 rounded-xl text-xs font-bold mb-3"
          style={{ background: "#f59e0b", color: "#000" }}>
          Compare {compareA.name} vs {compareB.name} →
        </button>
      )}

      {/* Search */}
      <div className="relative mb-3">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4d6688" strokeWidth="2.5">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input type="text" value={search} onChange={e => handleSearchChange(e.target.value)}
          placeholder="Search player or club…"
          className="w-full pl-9 pr-4 py-2 rounded-xl text-sm text-white outline-none"
          style={{ background: "#162030", border: "1px solid #1a2a3a" }} />
      </div>

      {/* Position filter */}
      <div className="flex gap-2 mb-3">
        {([null, 1, 2, 3, 4] as (number | null)[]).map(pos => (
          <button key={pos ?? "all"} onClick={() => handlePosFilter(pos)}
            className="flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide"
            style={{ background: posFilter === pos ? "#f59e0b" : "#162030", color: posFilter === pos ? "#000" : "#4d6688", border: `1px solid ${posFilter === pos ? "#f59e0b" : "#1a2a3a"}` }}>
            {pos === null ? "All" : TYPE_LABEL[pos]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #1a2a3a" }}>
        {/* Header */}
        <div className="grid items-center px-3 py-2"
          style={{ gridTemplateColumns: "28px 1fr 48px 52px 48px 48px 48px", background: "#111d2b", borderBottom: "1px solid #1a2a3a" }}>
          <div />
          <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#4d6688" }}>Player</div>
          {COLUMNS.map(col => (
            <button key={col.key} onClick={() => handleSort(col.key)}
              className="text-[10px] font-semibold uppercase tracking-wide text-right flex items-center justify-end gap-0.5"
              style={{ color: sortBy === col.key ? "#f59e0b" : "#4d6688" }}>
              {col.short}{sortBy === col.key && <span style={{ fontSize: 8 }}>{sortDir === "desc" ? "↓" : "↑"}</span>}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-10">
            <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "#f59e0b", borderTopColor: "transparent" }} />
          </div>
        )}

        {!loading && paginated.map((p, i) => {
          const isGk = p.type === 1;
          const si = statusIcon(p.status);
          const isCompared = compareA?.id === p.id || compareB?.id === p.id;
          return (
            <div key={p.id} className="grid items-center px-3 py-2"
              style={{ gridTemplateColumns: "28px 1fr 48px 52px 48px 48px 48px", background: isCompared ? "#1a1500" : i % 2 === 0 ? "#0f1a28" : "#111d2b", borderBottom: "1px solid #0f1a25" }}>
              <button onClick={() => setInfoId(p.id)}
                className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                style={{ background: "#1a2538", border: "1px solid #2a3d55", color: "#6688aa" }}>i</button>
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative flex-shrink-0">
                  <img src={shirtUrl(p.teamCode, isGk)} alt={p.team} width={22} height={26} className="object-contain" />
                  {si && <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full flex items-center justify-center text-[6px] font-bold"
                    style={{ background: "#000", color: si.color, border: `1px solid ${si.color}` }}>{si.icon}</span>}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-white truncate">{p.name}</span>
                    {isCompared && <span style={{ color: "#f59e0b", fontSize: 9 }}>★</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px]" style={{ color: "#4d6688" }}>{p.team}</span>
                    <span className="text-[8px] font-bold px-0.5 rounded" style={{ color: TYPE_COLOR[p.type] }}>{TYPE_LABEL[p.type]}</span>
                  </div>
                </div>
              </div>
              <div className="text-right text-xs font-semibold tabular-nums" style={{ color: "#e5e5e5" }}>£{p.price.toFixed(1)}</div>
              <div className="text-right text-xs tabular-nums" style={{ color: "#6688aa" }}>{p.selected.toFixed(1)}%</div>
              <div className="text-right text-xs font-semibold tabular-nums" style={{ color: p.form >= 6 ? "#4ade80" : p.form >= 3 ? "#e5e5e5" : "#6688aa" }}>{p.form.toFixed(1)}</div>
              <div className="text-right text-xs font-semibold tabular-nums" style={{ color: "#f59e0b" }}>{p.epNext.toFixed(1)}</div>
              <div className="text-right text-xs font-bold tabular-nums text-white">{p.points}</div>
            </div>
          );
        })}

        {!loading && filtered.length === 0 && (
          <p className="text-center py-8 text-sm" style={{ color: "#4d6688" }}>No players found.</p>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-3 flex-wrap">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: page === 0 ? "#111" : "#1a2538", color: page === 0 ? "#333" : "#6688aa", border: "1px solid #1e3050" }}>←</button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => setPage(i)}
              className="w-8 h-8 rounded-lg text-xs font-semibold"
              style={{ background: page === i ? "#f59e0b" : "#1a2538", color: page === i ? "#000" : "#6688aa", border: `1px solid ${page === i ? "#f59e0b" : "#1e3050"}` }}>
              {i + 1}
            </button>
          ))}
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: page === totalPages - 1 ? "#111" : "#1a2538", color: page === totalPages - 1 ? "#333" : "#6688aa", border: "1px solid #1e3050" }}>→</button>
        </div>
      )}

      <p className="text-center text-[10px] mt-2 mb-1" style={{ color: "#2a3a50" }}>
        {filtered.length} players · sida {page + 1}/{totalPages || 1}
      </p>

      {infoId && <PlayerInfoModal playerId={infoId} onClose={() => setInfoId(null)} />}
      {searchFor && (
        <PlayerSearchModal
          allPlayers={allPlayers}
          title={searchFor === "A" ? "Choose player A" : "Choose player B"}
          onSelect={selectForCompare}
          onClose={() => setSearchFor(null)}
        />
      )}
      {showCompare && compareA && compareB && (
        <PlayerCompareModal playerA={compareA} playerB={compareB} onClose={() => setShowCompare(false)} />
      )}
    </>
  );
}

// ─── Scout tab ───────────────────────────────────────────────────────────────

function ScoutTab() {
  const [data, setData] = useState<ScoutData | null>(null);
  const [eliteData, setEliteData] = useState<EliteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const toggle = (key: string) => setOpenSection(v => v === key ? null : key);

  useEffect(() => {
    Promise.all([fetch("/api/fpl/scout"), fetch("/api/fpl/elite")])
      .then(([s, e]) => Promise.all([s.ok ? s.json() : null, e.ok ? e.json() : null]))
      .then(([s, e]) => { setData(s); setEliteData(e); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16"><div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "#f59e0b", borderTopColor: "transparent" }} /></div>;

  const nextGw = data ? (data.currentGw >= 38 ? 38 : data.currentGw + 1) : 1;

  return (
    <div>
      {/* Season Intel */}
      <section className="mb-6">
        <div className="flex items-baseline gap-2 mb-2">
          {ICONS.intel}
          <div>
            <h2 className="text-sm font-bold text-white">Season Intel 2026/27</h2>
            <p className="text-[10px]" style={{ color: "#6688aa" }}>Key info for the new season · Updated continuously</p>
          </div>
        </div>
        <div className="rounded-xl overflow-hidden" style={{ background: "#162030", border: "1px solid #1e3050" }}>
          {/* Managers */}
          <button className="w-full flex items-center justify-between px-4 py-3" onClick={() => toggle("managers")} style={{ borderBottom: "1px solid #1a2a40" }}>
            <div className="flex items-center gap-2">
              {ICONS.managers}
              <span className="text-sm font-semibold text-white">{NEW_MANAGERS.length} new managers</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: "#ef444422", color: "#ef4444" }}>OBS</span>
            </div>
            <span style={{ color: "#6688aa", fontSize: 12 }}>{openSection === "managers" ? "▲" : "▼"}</span>
          </button>
          {openSection === "managers" && NEW_MANAGERS.map((m, i) => (
            <div key={m.club} className="px-4 py-3" style={{ borderBottom: i < NEW_MANAGERS.length - 1 ? "1px solid #1a2a40" : "none" }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs">{m.flag}</span>
                <span className="text-sm font-bold text-white">{m.manager}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#1a2538", color: "#6688aa" }}>{m.club}</span>
              </div>
              <p className="text-[11px] mb-1" style={{ color: "#99bbdd" }}>{m.style}</p>
              <p className="text-[10px]" style={{ color: "#f59e0b" }}>FPL: {m.fplNote}</p>
            </div>
          ))}

          {/* Europe */}
          <button className="w-full flex items-center justify-between px-4 py-3" onClick={() => toggle("europe")} style={{ borderBottom: "1px solid #1a2a40" }}>
            <div className="flex items-center gap-2">
              {ICONS.europe}
              <span className="text-sm font-semibold text-white">9 clubs in Europe</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: "#a78bfa22", color: "#a78bfa" }}>Rotation</span>
            </div>
            <span style={{ color: "#6688aa", fontSize: 12 }}>{openSection === "europe" ? "▲" : "▼"}</span>
          </button>
          {openSection === "europe" && EUROPEAN_CLUBS.map((comp, ci) => (
            <div key={comp.competition} className="px-4 py-3" style={{ borderBottom: ci < EUROPEAN_CLUBS.length - 1 ? "1px solid #1a2a40" : "none" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: comp.color }}>{comp.competition}</p>
              <div className="space-y-1.5">
                {comp.clubs.map(club => (
                  <div key={club.name} className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white w-32 flex-shrink-0">{club.name}</span>
                    <span className="text-[10px]" style={{ color: "#6688aa" }}>{club.note}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Int. breaks */}
          <button className="w-full flex items-center justify-between px-4 py-3" onClick={() => toggle("breaks")}>
            <div className="flex items-center gap-2">
              {ICONS.calendar}
              <span className="text-sm font-semibold text-white">International breaks</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: "#22d3ee22", color: "#22d3ee" }}>3 st</span>
            </div>
            <span style={{ color: "#6688aa", fontSize: 12 }}>{openSection === "breaks" ? "▲" : "▼"}</span>
          </button>
          {openSection === "breaks" && INTERNATIONAL_BREAKS.map((b, i) => (
            <div key={b.label} className="px-4 py-3" style={{ borderTop: "1px solid #1a2a40" }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-white">{b.label}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: "#1a2538", color: "#f59e0b" }}>{b.duration}</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: "#0f1520", color: "#6688aa" }}>{b.after}</span>
                <span style={{ color: "#3d5570", fontSize: 10 }}>→ break →</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: "#0f1520", color: "#6688aa" }}>{b.before}</span>
                <span className="text-[10px]" style={{ color: "#6688aa" }}>({b.dates})</span>
              </div>
              <p className="text-[10px]" style={{ color: "#6688aa" }}>{b.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Live scout sections */}
      {data && (
        <>
          {eliteData && (
            <>
              <ScoutSection icon={ICONS.star} title="Elite 10 — Template" subtitle={`Most owned by world top ${eliteData.managersAnalyzed} · GW${eliteData.currentGw}`}>
                {eliteData.mostOwned.map(p => (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-2.5" style={{ borderTop: "1px solid #1a2a40" }}>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded w-8 text-center flex-shrink-0" style={{ background: (SCOUT_TYPE_COLOR[p.type] ?? "#888") + "22", color: SCOUT_TYPE_COLOR[p.type] ?? "#888" }}>{TYPE_LABEL[p.type]}</span>
                    <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-white truncate">{p.name}</p><p className="text-[10px]" style={{ color: "#6688aa" }}>{p.team}</p></div>
                    <div className="text-right flex-shrink-0"><p className="text-sm font-bold" style={{ color: "#f59e0b" }}>{p.count}/{p.outOf}</p><p className="text-[10px]" style={{ color: "#6688aa" }}>own</p></div>
                  </div>
                ))}
              </ScoutSection>
              <ScoutSection icon={ICONS.star} title="Elite Captain" subtitle={`Who the top ${eliteData.managersAnalyzed} are captaining`}>
                {eliteData.captainChoices.map(p => (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-2.5" style={{ borderTop: "1px solid #1a2a40" }}>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded w-8 text-center flex-shrink-0" style={{ background: "#f59e0b22", color: "#f59e0b" }}>C</span>
                    <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-white truncate">{p.name}</p><p className="text-[10px]" style={{ color: "#6688aa" }}>{p.team}</p></div>
                    <div className="text-right flex-shrink-0"><p className="text-sm font-bold" style={{ color: "#f59e0b" }}>{p.count}/{p.outOf}</p><p className="text-[10px]" style={{ color: "#6688aa" }}>captained</p></div>
                  </div>
                ))}
              </ScoutSection>
            </>
          )}
          <ScoutSection icon={ICONS.target} title="Captain Picks" subtitle={`Highest xPts for GW${nextGw}`}>
            {data.captainPicks.map(p => <ScoutPlayerRow key={p.id} player={p} stat={p.epNext.toFixed(1)} statLabel="xPts" />)}
          </ScoutSection>
          <ScoutSection icon={ICONS.fire} title="Hot Transfers" subtitle="Most transferred in this GW">
            {data.hotTransfersIn.map(p => <ScoutPlayerRow key={p.id} player={p} stat={`+${formatTransfers(p.transfersIn)}`} statLabel="transfers in" />)}
          </ScoutSection>
          <ScoutSection icon={ICONS.diamond} title="Differentials" subtitle="High xPts · Under 15% ownership">
            {data.differentials.map(p => <ScoutPlayerRow key={p.id} player={p} stat={p.epNext.toFixed(1)} statLabel={`${p.ownership.toFixed(1)}% owned`} />)}
          </ScoutSection>
          <ScoutSection icon={ICONS.bolt} title="ICT Leaders" subtitle="Influence · Creativity · Threat">
            {data.ictLeaders.map(p => <ScoutPlayerRow key={p.id} player={p} stat={p.ictIndex.toFixed(1)} statLabel="ICT index" />)}
          </ScoutSection>
          <ScoutSection icon={ICONS.money} title="Best Value" subtitle="Most points per £ this season">
            {data.bestValue.map(p => <ScoutPlayerRow key={p.id} player={p} stat={p.valueSeason.toFixed(1)} statLabel="value score" />)}
          </ScoutSection>
          <ScoutSection icon={ICONS.shield} title="Easy Fixtures" subtitle="Best xPts · FDR ≤ 2.5 next 3 GWs">
            {data.easyFixtures.map(p => <ScoutPlayerRow key={p.id} player={p} stat={p.epNext.toFixed(1)} statLabel={`avg FDR ${p.fdr.toFixed(1)}`} />)}
          </ScoutSection>
          <ScoutSection icon={ICONS.up} title="Price Risers" subtitle="Rising in price this GW">
            {data.priceRisers.map(p => <ScoutPlayerRow key={p.id} player={p} stat={`+£${(p.priceChange / 10).toFixed(1)}m`} statLabel={`now £${p.price.toFixed(1)}m`} />)}
          </ScoutSection>
          <ScoutSection icon={ICONS.down} title="Price Fallers" subtitle="Falling in price this GW">
            {data.priceFallers.map(p => <ScoutPlayerRow key={p.id} player={p} stat={`-£${Math.abs(p.priceChange / 10).toFixed(1)}m`} statLabel={`now £${p.price.toFixed(1)}m`} />)}
          </ScoutSection>
        </>
      )}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function StatsPage() {
  const [tab, setTab] = useState<"players" | "scout">("players");
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [playersLoading, setPlayersLoading] = useState(true);

  useEffect(() => {
    fetch("/api/fpl/players")
      .then(r => r.json())
      .then(d => { setAllPlayers(d.players ?? []); setPlayersLoading(false); })
      .catch(() => setPlayersLoading(false));
  }, []);

  return (
    <div className="min-h-screen pb-24" style={{ background: "#0c1420" }}>
      {/* Header */}
      <div className="sticky top-0 z-30 px-4 pt-4 pb-0" style={{ background: "#0c1420" }}>
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: "#f59e0b" }}>FPL</p>
        <h1 className="text-xl font-bold text-white mb-3">Stats</h1>

        {/* Tab toggle */}
        <div className="flex rounded-xl overflow-hidden mb-4" style={{ border: "1px solid #1e3050" }}>
          <button onClick={() => setTab("players")}
            className="flex-1 py-2.5 text-xs font-semibold tracking-wide uppercase"
            style={{ background: tab === "players" ? "#f59e0b" : "#162030", color: tab === "players" ? "#000" : "#555" }}>
            Players
          </button>
          <button onClick={() => setTab("scout")}
            className="flex-1 py-2.5 text-xs font-semibold tracking-wide uppercase"
            style={{ background: tab === "scout" ? "#f59e0b" : "#162030", color: tab === "scout" ? "#000" : "#555" }}>
            Scout
          </button>
        </div>
      </div>

      <div className="px-4">
        {tab === "players" && <PlayersTab allPlayers={allPlayers} loading={playersLoading} />}
        {tab === "scout" && <ScoutTab />}
      </div>
    </div>
  );
}
