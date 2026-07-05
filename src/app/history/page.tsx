"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface Transfer {
  outPlayer: string;
  inPlayer: string;
  outPrice: number;
  inPrice: number;
}

interface GwPlan {
  gw: number;
  season: string;
  saved_at: string;
  transfer_plan: Record<string, Transfer[]>;
  captain_plan: Record<string, { captainId: number; vcId: number; captainName: string; vcName: string }>;
  chip_plan: Record<string, string>;
}

export default function HistoryPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<GwPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetch(`/api/gw-plans?userId=${user.id}`)
      .then((r) => r.json())
      .then((data) => { setPlans(data.plans ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-16 text-center">
        <p className="text-2xl mb-2">📋</p>
        <p className="text-white font-semibold mb-1">Sign in to see your history</p>
        <p className="text-sm" style={{ color: "#6688aa" }}>Your GW plans are saved automatically when you're logged in.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-10">
      <header className="mb-8">
        <p className="text-[11px] font-semibold tracking-[0.15em] uppercase" style={{ color: "#f59e0b" }}>History</p>
        <h1 className="text-2xl font-bold tracking-tight text-white mt-0.5">My GW plans</h1>
      </header>

      {loading && (
        <div className="flex justify-center pt-12">
          <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "#f59e0b", borderTopColor: "transparent" }} />
        </div>
      )}

      {!loading && plans.length === 0 && (
        <div className="text-center pt-12">
          <p className="text-3xl mb-3">📭</p>
          <p className="text-white font-semibold mb-1">No history yet</p>
          <p className="text-sm" style={{ color: "#6688aa" }}>Your plans will be saved here after each gameweek deadline.</p>
        </div>
      )}

      <div className="space-y-3">
        {plans.map((plan) => {
          const gwTransfers = plan.transfer_plan?.[String(plan.gw)] ?? [];
          const gwCaptain = plan.captain_plan?.[String(plan.gw)];
          const gwChip = plan.chip_plan?.[String(plan.gw)];
          const isOpen = expanded === plan.gw;

          return (
            <div key={plan.gw} className="rounded-xl overflow-hidden" style={{ border: "1px solid #1e2d42" }}>
              <button
                onClick={() => setExpanded(isOpen ? null : plan.gw)}
                className="w-full flex items-center justify-between px-4 py-3.5 text-left"
                style={{ background: "#141e2e" }}
              >
                <div>
                  <p className="text-sm font-bold text-white">GW{plan.gw}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "#4d6a88" }}>
                    {gwTransfers.length} transfer{gwTransfers.length !== 1 ? "s" : ""}
                    {gwCaptain ? ` · C: ${gwCaptain.captainName}` : ""}
                    {gwChip ? ` · ${gwChip}` : ""}
                  </p>
                </div>
                <span className="text-xs transition-transform" style={{ color: "#4d6a88", transform: isOpen ? "rotate(180deg)" : "none" }}>▼</span>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-2" style={{ background: "#0f1520", borderTop: "1px solid #1e2d42" }}>
                  {gwTransfers.length > 0 ? (
                    <div className="mb-3">
                      <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#4d6a88" }}>Transfers</p>
                      <div className="space-y-2">
                        {gwTransfers.map((t: Transfer, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <span style={{ color: "#ef4444" }}>OUT</span>
                            <span className="text-white font-medium">{t.outPlayer}</span>
                            <span style={{ color: "#4d6a88" }}>→</span>
                            <span style={{ color: "#4ade80" }}>IN</span>
                            <span className="text-white font-medium">{t.inPlayer}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm mb-3" style={{ color: "#4d6a88" }}>No transfers planned</p>
                  )}

                  {gwCaptain && (
                    <div className="mb-3">
                      <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#4d6a88" }}>Captain</p>
                      <div className="flex gap-4 text-sm">
                        <span><span style={{ color: "#f59e0b" }}>C</span> <span className="text-white">{gwCaptain.captainName}</span></span>
                        <span><span style={{ color: "#6688aa" }}>VC</span> <span className="text-white">{gwCaptain.vcName}</span></span>
                      </div>
                    </div>
                  )}

                  {gwChip && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#4d6a88" }}>Chip</p>
                      <span className="text-xs px-2 py-1 rounded font-semibold" style={{ background: "#1a1500", color: "#f59e0b", border: "1px solid #f59e0b44" }}>
                        {gwChip}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
