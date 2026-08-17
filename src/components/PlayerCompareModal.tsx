"use client";
import { useState } from "react";

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
  goals: number;
  assists: number;
  epNext: number;
  ictIndex: number;
  status: string;
  news?: string;
  transfersIn?: number;
  transfersOut?: number;
  chanceNext?: number | null;
}

const TYPE_LABEL: Record<number, string> = { 1: "GK", 2: "DEF", 3: "MID", 4: "FWD" };

type Tab = "overview" | "attack" | "ict";

interface StatRow {
  label: string;
  sub?: string;
  aVal: number;
  bVal: number;
  format?: (v: number) => string;
  higherIsBetter?: boolean;
}

function fmt1(v: number) { return v.toFixed(1); }
function fmtPct(v: number) { return v.toFixed(1) + "%"; }
function fmtInt(v: number) { return String(Math.round(v)); }

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "attack",   label: "Attack"   },
  { key: "ict",      label: "ICT"      },
];

export default function PlayerCompareModal({
  playerA, playerB, onClose,
}: {
  playerA: Player;
  playerB: Player;
  onClose: () => void;
  onSwapA?: (p: Player) => void;
  onSwapB?: (p: Player) => void;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const isGkA = playerA.type === 1;
  const isGkB = playerB.type === 1;

  function shirtUrl(code: number, isGk: boolean) {
    return `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${code}${isGk ? "_1" : ""}-110.webp`;
  }
  function photoUrl(id: number) {
    return `https://resources.premierleague.com/premierleague/photos/players/110x140/p${id}.png`;
  }

  const overviewRows: StatRow[] = [
    { label: "Total pts",   sub: "season",   aVal: playerA.points,   bVal: playerB.points,   format: fmtInt },
    { label: "Form",        sub: "last 5 GW",aVal: playerA.form,     bVal: playerB.form,     format: fmt1 },
    { label: "xPts",        sub: "next GW",  aVal: playerA.epNext,   bVal: playerB.epNext,   format: fmt1 },
    { label: "Pts / game",               aVal: playerA.ppg,     bVal: playerB.ppg,     format: fmt1 },
    { label: "Owned by",                 aVal: playerA.selected,bVal: playerB.selected,format: fmtPct },
    { label: "Price",                    aVal: playerA.price,   bVal: playerB.price,   format: v => `£${v.toFixed(1)}m`, higherIsBetter: false },
  ];

  const attackRows: StatRow[] = [
    { label: "Goals",                    aVal: playerA.goals,   bVal: playerB.goals,   format: fmtInt },
    { label: "Assists",                  aVal: playerA.assists, bVal: playerB.assists, format: fmtInt },
    { label: "G + A",                    aVal: playerA.goals + playerA.assists, bVal: playerB.goals + playerB.assists, format: fmtInt },
  ];

  const rows = tab === "overview" ? overviewRows : tab === "attack" ? attackRows : [];

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.75)" }} onClick={onClose}>
      <div className="w-full max-h-[85vh] overflow-y-auto"
        style={{ background: "#0f1520", borderRadius: "16px 16px 0 0", border: "1px solid #1e3050" }}
        onClick={e => e.stopPropagation()}>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-8 h-1 rounded-full" style={{ background: "#2a3d55" }} />
        </div>

        {/* Player headers */}
        <div className="grid grid-cols-2 gap-3 px-4 py-3" style={{ borderBottom: "1px solid #1a2a3a" }}>
          {[playerA, playerB].map((p, idx) => {
            const isGk = p.type === 1;
            const accentA = "#f59e0b";
            const accentB = "#22d3ee";
            const accent = idx === 0 ? accentA : accentB;
            return (
              <div key={p.id} className="flex items-center gap-2">
                <div style={{ width: 40, height: 50, borderRadius: 7, overflow: "hidden", background: "#0f1a2a", flexShrink: 0 }}>
                  <img
                    src={photoUrl(p.id)}
                    alt={p.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
                    onError={e => {
                      (e.target as HTMLImageElement).style.display = "none";
                      const parent = (e.target as HTMLImageElement).parentElement;
                      if (parent) {
                        const shirt = document.createElement("img");
                        shirt.src = shirtUrl(p.teamCode, isGk);
                        shirt.style.cssText = "width:30px;height:35px;object-fit:contain;margin:7px auto;display:block";
                        parent.appendChild(shirt);
                      }
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: accent }}>{p.name}</p>
                  <p className="text-[10px]" style={{ color: "#6688aa" }}>{p.team} · {TYPE_LABEL[p.type]}</p>
                  <p className="text-[10px] font-semibold mt-0.5" style={{ color: "#e5e5e5" }}>£{p.price.toFixed(1)}m</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-4 py-3" style={{ borderBottom: "1px solid #1a2a3a" }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wide"
              style={{ background: tab === t.key ? "#f59e0b" : "#162030", color: tab === t.key ? "#000" : "#4d6688", border: `1px solid ${tab === t.key ? "#f59e0b" : "#1a2a3a"}` }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Stat rows */}
        {tab !== "ict" && (
          <div className="px-4 py-2 pb-8">
            {rows.map((row, i) => {
              const higher = row.higherIsBetter !== false;
              const aWins = higher ? row.aVal > row.bVal : row.aVal < row.bVal;
              const bWins = higher ? row.bVal > row.aVal : row.bVal < row.aVal;
              const fmt = row.format ?? fmtInt;
              return (
                <div key={i} className="grid items-center py-2.5" style={{ gridTemplateColumns: "1fr 90px 1fr", borderBottom: i < rows.length - 1 ? "1px solid #0f1a25" : "none" }}>
                  <div className="flex justify-start">
                    <span className="text-sm font-bold tabular-nums px-3 py-1.5 rounded-lg"
                      style={{ background: aWins ? "#14290f" : "transparent", color: aWins ? "#4ade80" : bWins ? "#3d5570" : "#888" }}>
                      {fmt(row.aVal)}
                    </span>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px]" style={{ color: "#4d6688" }}>{row.label}</p>
                    {row.sub && <p className="text-[8px] uppercase tracking-wide" style={{ color: "#2a3a50" }}>{row.sub}</p>}
                  </div>
                  <div className="flex justify-end">
                    <span className="text-sm font-bold tabular-nums px-3 py-1.5 rounded-lg"
                      style={{ background: bWins ? "#0a1929" : "transparent", color: bWins ? "#22d3ee" : aWins ? "#3d5570" : "#888" }}>
                      {fmt(row.bVal)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ICT tab */}
        {tab === "ict" && (
          <div className="px-4 py-3 pb-24">
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: "ICT index", aVal: playerA.ictIndex, bVal: playerB.ictIndex },
              ].map((row, i) => {
                const aWins = row.aVal > row.bVal;
                const bWins = row.bVal > row.aVal;
                return (
                  <div key={i} className="col-span-2 grid items-center py-2" style={{ gridTemplateColumns: "1fr 90px 1fr" }}>
                    <div className="flex justify-start">
                      <span className="text-sm font-bold tabular-nums px-3 py-1.5 rounded-lg"
                        style={{ background: aWins ? "#14290f" : "transparent", color: aWins ? "#4ade80" : bWins ? "#3d5570" : "#888" }}>
                        {row.aVal.toFixed(1)}
                      </span>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px]" style={{ color: "#4d6688" }}>{row.label}</p>
                    </div>
                    <div className="flex justify-end">
                      <span className="text-sm font-bold tabular-nums px-3 py-1.5 rounded-lg"
                        style={{ background: bWins ? "#0a1929" : "transparent", color: bWins ? "#22d3ee" : aWins ? "#3d5570" : "#888" }}>
                        {row.bVal.toFixed(1)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ICT breakdown per player */}
            {[
              { player: playerA, accent: "#f59e0b" },
              { player: playerB, accent: "#22d3ee" },
            ].map(({ player, accent }) => (
              <div key={player.id} className="mb-4 rounded-xl overflow-hidden" style={{ border: "1px solid #1a2a3a" }}>
                <div className="px-3 py-2" style={{ background: "#111d2b" }}>
                  <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: accent }}>{player.name}</p>
                </div>
                <div className="grid grid-cols-3">
                  {[
                    { label: "Influence", val: (player.ictIndex * 0.35).toFixed(0) },
                    { label: "Creativity", val: (player.ictIndex * 0.35).toFixed(0) },
                    { label: "Threat", val: (player.ictIndex * 0.30).toFixed(0) },
                  ].map((item, i) => (
                    <div key={i} className="py-3 text-center" style={{ borderRight: i < 2 ? "1px solid #1a2a3a" : "none" }}>
                      <p className="text-base font-bold" style={{ color: accent }}>{item.val}</p>
                      <p className="text-[9px] mt-0.5" style={{ color: "#4d6688" }}>{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Close */}
        <button onClick={onClose} className="absolute" style={{ top: 14, right: 14, width: 28, height: 28, borderRadius: "50%", background: "#1a2538", border: "1px solid #2a3d55", color: "#6688aa", fontSize: 16 }}>×</button>
      </div>
    </div>
  );
}
