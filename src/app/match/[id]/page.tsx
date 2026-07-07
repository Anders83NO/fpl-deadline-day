"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface Player { name: string; position: string; number: number }
interface Event { minute: number; team: string; scorer: string; assist: string | null; type: string }

interface MatchDetail {
  id: number;
  status: string;
  minute: number | null;
  home: string;
  homeCrest: string;
  away: string;
  awayCrest: string;
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
  upgradeRequired: boolean;
}

type Tab = "events" | "lineups";

function statusLabel(status: string, minute: number | null) {
  if (["1H", "2H", "ET", "P"].includes(status)) return minute ? `${minute}'` : "LIVE";
  if (status === "HT") return "HT";
  if (["FT", "AET", "PEN"].includes(status)) return "FT";
  if (["NS", "TBD"].includes(status)) return "Upcoming";
  if (["PST", "CANC", "ABD"].includes(status)) return status;
  return status;
}

function isLive(status: string) {
  return ["1H", "2H", "HT", "ET", "BT", "P"].includes(status);
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
  const finished = data.status === "FINISHED";

  return (
    <div className="max-w-lg mx-auto">

      {/* Back */}
      <div className="px-4 pt-5 pb-2">
        <Link href="/" className="text-xs flex items-center gap-1" style={{ color: "#6688aa" }}>
          ← Back
        </Link>
      </div>

      {/* Score header */}
      <div className="px-4 py-8 flex flex-col items-center" style={{ background: "#162030", borderBottom: "1px solid #1f1f1f" }}>
        <div className="flex items-center justify-between w-full max-w-xs">

          <div className="flex flex-col items-center gap-2 flex-1">
            {data.homeCrest && (
              <Image src={data.homeCrest} alt={data.home} width={48} height={48} className="object-contain" />
            )}
            <span className="text-xs font-semibold text-white text-center">{data.home}</span>
            {data.homeFormation && (
              <span className="text-[10px]" style={{ color: "#6688aa" }}>{data.homeFormation}</span>
            )}
          </div>

          <div className="flex flex-col items-center mx-4">
            <div className="text-5xl font-bold tracking-tight text-white">
              {data.homeScore ?? 0} – {data.awayScore ?? 0}
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
            {data.awayCrest && (
              <Image src={data.awayCrest} alt={data.away} width={48} height={48} className="object-contain" />
            )}
            <span className="text-xs font-semibold text-white text-center">{data.away}</span>
            {data.awayFormation && (
              <span className="text-[10px]" style={{ color: "#6688aa" }}>{data.awayFormation}</span>
            )}
          </div>
        </div>

        <div className="flex gap-4 mt-5">
          {data.venue && (
            <span className="text-[10px]" style={{ color: "#4d6a88" }}>📍 {data.venue}</span>
          )}
          {data.referee && (
            <span className="text-[10px]" style={{ color: "#4d6a88" }}>🟡 {data.referee}</span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex sticky top-0 z-10" style={{ background: "#162030", borderBottom: "1px solid #1f1f1f" }}>
        {(["events", "lineups"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-3 text-xs font-semibold tracking-wider uppercase transition-colors"
            style={{
              color: tab === t ? "#f59e0b" : "#555",
              borderBottom: tab === t ? "2px solid #f59e0b" : "2px solid transparent",
            }}
          >
            {t === "events" ? "Goals & Events" : "Lineups"}
          </button>
        ))}
      </div>

      <div className="px-4 py-4">

        {/* Events */}
        {tab === "events" && (
          <div>
            {data.events.length === 0 ? (
              <p className="text-center py-8 text-sm" style={{ color: "#6688aa" }}>No events yet.</p>
            ) : (
              <div className="space-y-1">
                {data.events.map((e, i) => {
                  const isHome = e.team === data.home;
                  return (
                    <div key={i} className={`flex items-center gap-3 py-2.5 ${isHome ? "" : "flex-row-reverse"}`}
                      style={{ borderBottom: "1px solid #161616" }}>
                      <div className="w-8 flex-shrink-0 text-center">
                        <span className="text-xs font-bold" style={{ color: "#f59e0b" }}>{e.minute}'</span>
                      </div>
                      <div className={`flex-1 ${isHome ? "" : "text-right"}`}>
                        <p className="text-sm font-semibold text-white flex items-center gap-1.5 ${isHome ? '' : 'justify-end'}">
                          <span>⚽</span> {e.scorer}
                        </p>
                        {e.assist && (
                          <p className="text-[11px] mt-0.5" style={{ color: "#6688aa" }}>
                            Assist: {e.assist}
                          </p>
                        )}
                      </div>
                      <div className="w-6 flex-shrink-0 flex justify-center">
                        {isHome
                          ? data.homeCrest && <Image src={data.homeCrest} alt={data.home} width={16} height={16} className="object-contain" />
                          : data.awayCrest && <Image src={data.awayCrest} alt={data.away} width={16} height={16} className="object-contain" />
                        }
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Lineups */}
        {tab === "lineups" && (
          <div className="space-y-6">

            {/* Starting XI */}
            <div>
              <div className="grid grid-cols-2 gap-x-4">
                <p className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: "#f59e0b" }}>
                  {data.home}
                </p>
                <p className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: "#f59e0b" }}>
                  {data.away}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-x-4">
                <div className="space-y-1.5">
                  {data.homeLineup.map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[10px] w-5 text-right flex-shrink-0 font-mono" style={{ color: "#4d6a88" }}>{p.number}</span>
                      <span className="text-xs text-white truncate">{p.name}</span>
                      <span className="text-[9px] ml-auto flex-shrink-0 font-semibold" style={{ color: "#3d5570" }}>{p.position}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-1.5">
                  {data.awayLineup.map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[10px] w-5 text-right flex-shrink-0 font-mono" style={{ color: "#4d6a88" }}>{p.number}</span>
                      <span className="text-xs text-white truncate">{p.name}</span>
                      <span className="text-[9px] ml-auto flex-shrink-0 font-semibold" style={{ color: "#3d5570" }}>{p.position}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ borderTop: "1px solid #1a2a40" }} />

            {/* Bench */}
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
          </div>
        )}
      </div>


    </div>
  );
}
