"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface Player { name: string; pos: string; number: number }
interface Event {
  minute: number;
  extraMinute: number | null;
  type: string;
  detail: string;
  player: string | null;
  assist: string | null;
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
  if (type === "Var") return "📺";
  return "•";
}

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
        <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: "#f59e0b", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!data) return <p className="text-center p-8" style={{ color: "#6688aa" }}>Match not found.</p>;

  const live = isLive(data.status);
  const finished = isFinished(data.status);

  // Filter meaningful events
  const displayEvents = data.events.filter(e =>
    ["Goal", "Card", "subst"].includes(e.type) &&
    !(e.type === "Card" && e.detail === "Yellow Card" && false) // show all cards
  );

  return (
    <div className="max-w-lg mx-auto pb-24">

      {/* Back */}
      <div className="px-4 pt-5 pb-2">
        <Link href="/" className="text-xs flex items-center gap-1" style={{ color: "#6688aa" }}>← Back</Link>
      </div>

      {/* Score header */}
      <div className="px-4 py-8 flex flex-col items-center" style={{ background: "#162030", borderBottom: "1px solid #1a2a40" }}>
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
            <div className="text-xs font-semibold mt-2 tracking-wider" style={{ color: live ? "#f59e0b" : "#555" }}>
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
            style={{ color: tab === t ? "#f59e0b" : "#555", borderBottom: tab === t ? "2px solid #f59e0b" : "2px solid transparent" }}>
            {t === "events" ? "Goals & Events" : "Lineups"}
          </button>
        ))}
      </div>

      <div className="px-4 py-4">

        {/* Events tab */}
        {tab === "events" && (
          <div>
            {displayEvents.length === 0 ? (
              <p className="text-center py-8 text-sm" style={{ color: "#6688aa" }}>No events yet.</p>
            ) : (
              <div>
                {displayEvents.map((e, i) => {
                  const isHome = e.teamId === data.homeTeamId;
                  const icon = eventIcon(e.type, e.detail);
                  const minuteStr = e.extraMinute ? `${e.minute}+${e.extraMinute}'` : `${e.minute}'`;
                  return (
                    <div key={i} className={`flex items-center gap-3 py-2.5 ${isHome ? "" : "flex-row-reverse"}`}
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
          <div className="space-y-6">
            {data.homeLineup.length === 0 && data.awayLineup.length === 0 ? (
              <p className="text-center py-8 text-sm" style={{ color: "#6688aa" }}>Lineups not available yet.</p>
            ) : (
              <>
                <div>
                  <div className="grid grid-cols-2 gap-x-4 mb-2">
                    <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "#f59e0b" }}>{data.home}</p>
                    <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "#f59e0b" }}>{data.away}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4">
                    <div className="space-y-1.5">
                      {data.homeLineup.map((p, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-[10px] w-5 text-right flex-shrink-0 font-mono" style={{ color: "#4d6a88" }}>{p.number}</span>
                          <span className="text-xs text-white truncate">{p.name}</span>
                          <span className="text-[9px] ml-auto flex-shrink-0 font-bold" style={{ color: "#3d5570" }}>{p.pos}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1.5">
                      {data.awayLineup.map((p, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-[10px] w-5 text-right flex-shrink-0 font-mono" style={{ color: "#4d6a88" }}>{p.number}</span>
                          <span className="text-xs text-white truncate">{p.name}</span>
                          <span className="text-[9px] ml-auto flex-shrink-0 font-bold" style={{ color: "#3d5570" }}>{p.pos}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid #1a2a40" }} />

                <div>
                  <p className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: "#3d5570" }}>Bench</p>
                  <div className="grid grid-cols-2 gap-x-4">
                    <div className="space-y-1.5">
                      {data.homeBench.map((p, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-[10px] w-5 text-right flex-shrink-0 font-mono" style={{ color: "#3d5570" }}>{p.number}</span>
                          <span className="text-xs truncate" style={{ color: "#6688aa" }}>{p.name}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1.5">
                      {data.awayBench.map((p, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-[10px] w-5 text-right flex-shrink-0 font-mono" style={{ color: "#3d5570" }}>{p.number}</span>
                          <span className="text-xs truncate" style={{ color: "#6688aa" }}>{p.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
