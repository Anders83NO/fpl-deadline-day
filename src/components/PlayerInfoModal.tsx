"use client";
import { useState, useEffect } from "react";

interface PointEvent { label: string; pts: number; }
interface GwEntry {
  gw: number; opponent: string; isHome: boolean;
  totalPoints: number; minutes: number; events: PointEvent[];
}
interface Fixture { gw: number; opponent: string; isHome: boolean; fdr: number; fdrColor: string; }
interface PlayerDetail {
  id: number; name: string; webName: string; photo: string | null;
  type: number; team: string; teamCode: number; price: number;
  totalPoints: number; form: string; epNext: string; selectedBy: string;
  ictIndex: string; pointsPerGame: string; status: string; news: string;
  history: GwEntry[]; fixtures: Fixture[];
}

const TYPE_LABEL: Record<number, string> = { 1: "GKP", 2: "DEF", 3: "MID", 4: "FWD" };
const FDR_STYLE: Record<string, { border: string; bg: string; color: string }> = {
  green:  { border: "#4ade80", bg: "#14290f", color: "#4ade80" },
  yellow: { border: "#f59e0b", bg: "#2a1a00", color: "#f59e0b" },
  red:    { border: "#ef4444", bg: "#290a0a", color: "#ef4444" },
};

function ptColor(pts: number) {
  if (pts > 0) return "#4ade80";
  if (pts < 0) return "#ef4444";
  return "#fff";
}

function totalColor(pts: number) {
  if (pts >= 9) return "#4ade80";
  if (pts <= 3) return "#ef4444";
  return "#fff";
}

export default function PlayerInfoModal({
  playerId,
  onClose,
}: {
  playerId: number;
  onClose: () => void;
}) {
  const [data, setData] = useState<PlayerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [openGw, setOpenGw] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/fpl/player?id=${playerId}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [playerId]);

  const photoUrl = data?.photo
    ? `https://resources.premierleague.com/premierleague/photos/players/110x140/p${data.photo}.png`
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-h-[90vh] overflow-y-auto"
        style={{ background: "#0f1520", borderRadius: "16px 16px 0 0", border: "1px solid #1e3050" }}
        onClick={e => e.stopPropagation()}
      >
        {loading && (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm" style={{ color: "#6688aa" }}>Loading...</p>
          </div>
        )}

        {!loading && data && (
          <>
            {/* Header */}
            <div style={{ background: "#1a2538", borderBottom: "1px solid #0f1520", padding: "16px" }}>
              <div className="flex items-end gap-3">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={data.webName}
                    style={{ width: 64, height: 80, objectFit: "cover", objectPosition: "top", borderRadius: 8, background: "#0f1520", flexShrink: 0 }}
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <div style={{ width: 64, height: 80, borderRadius: 8, background: "#1e3050", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 10, color: "#4d6a88" }}>{TYPE_LABEL[data.type]}</span>
                  </div>
                )}
                <div className="flex-1 pb-1">
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#fff", lineHeight: 1.2 }}>{data.name}</p>
                  <p style={{ margin: "3px 0 8px", fontSize: 12, color: "#6688aa" }}>
                    {TYPE_LABEL[data.type]} · {data.team} · £{data.price.toFixed(1)}m
                  </p>
                  {data.news && (
                    <p style={{ margin: "0 0 6px", fontSize: 11, color: "#f59e0b" }}>{data.news}</p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  style={{ width: 28, height: 28, borderRadius: "50%", background: "#0f1a2a", border: "1px solid #2a3d55", color: "#6688aa", fontSize: 16, lineHeight: 1, flexShrink: 0, alignSelf: "flex-start" }}
                >×</button>
              </div>
            </div>

            {/* Stats */}
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #0f1520" }}>
              <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4d6a88" }}>Season stats</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 8 }}>
                {[
                  { label: "Total pts", value: data.totalPoints, color: "#fff" },
                  { label: "Form", value: data.form, color: parseFloat(data.form) >= 6 ? "#4ade80" : "#fff" },
                  { label: "xPts next GW", value: data.epNext ?? "–", color: "#f59e0b" },
                  { label: "Owned by", value: `${parseFloat(data.selectedBy).toFixed(1)}%`, color: "#fff" },
                  { label: "Pts per game", value: data.pointsPerGame, color: "#fff" },
                  { label: "ICT index", value: data.ictIndex, color: "#fff" },
                ].map(s => (
                  <div key={s.label} style={{ background: "#1a2538", borderRadius: 8, padding: "10px 12px", border: "1px solid #1e3050" }}>
                    <p style={{ margin: 0, fontSize: 11, color: "#6688aa" }}>{s.label}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 18, fontWeight: 600, color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* GW History */}
            {data.history.length > 0 && (
              <div style={{ padding: "14px 16px", borderBottom: "1px solid #0f1520" }}>
                <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4d6a88" }}>GW history</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {data.history.map(h => (
                    <div key={h.gw} style={{ background: "#1a2538", borderRadius: 8, border: "1px solid #1e3050", overflow: "hidden" }}>
                      <button
                        style={{ width: "100%", display: "grid", gridTemplateColumns: "40px 1fr 36px", gap: 6, padding: "8px 10px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
                        onClick={() => setOpenGw(openGw === h.gw ? null : h.gw)}
                      >
                        <span style={{ fontSize: 12, color: "#6688aa" }}>GW{h.gw}</span>
                        <span style={{ fontSize: 12, color: "#fff" }}>{h.opponent} ({h.isHome ? "H" : "A"})</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: totalColor(h.totalPoints), textAlign: "right" }}>{h.totalPoints}</span>
                      </button>
                      {openGw === h.gw && (
                        <div style={{ borderTop: "1px solid #0f1520", padding: "8px 10px", display: "flex", flexDirection: "column", gap: 4 }}>
                          {h.events.map((ev, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ fontSize: 11, color: "#6688aa" }}>{ev.label}</span>
                              <span style={{ fontSize: 11, fontWeight: 600, color: ptColor(ev.pts) }}>
                                {ev.pts > 0 ? `+${ev.pts}` : ev.pts}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.history.length === 0 && (
              <div style={{ padding: "14px 16px", borderBottom: "1px solid #0f1520" }}>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4d6a88", marginBottom: 8 }}>GW history</p>
                <p style={{ margin: 0, fontSize: 12, color: "#4d6a88" }}>No data yet — available after GW1.</p>
              </div>
            )}

            {/* Fixtures */}
            {data.fixtures.length > 0 && (
              <div style={{ padding: "14px 16px" }}>
                <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4d6a88" }}>Next fixtures</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {data.fixtures.map(f => {
                    const s = FDR_STYLE[f.fdrColor] ?? FDR_STYLE.yellow;
                    return (
                      <div key={f.gw} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", background: "#1a2538", borderRadius: 6, borderLeft: `3px solid ${s.border}` }}>
                        <span style={{ fontSize: 11, color: "#4d6a88", width: 32 }}>GW{f.gw}</span>
                        <span style={{ fontSize: 12, color: "#fff", flex: 1 }}>{f.opponent} ({f.isHome ? "H" : "A"})</span>
                        <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: s.bg, color: s.color }}>FDR {f.fdr}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
