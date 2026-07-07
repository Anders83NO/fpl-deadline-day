"use client";

import { useState, useEffect, useCallback } from "react";
import Logo from "@/components/Logo";

interface SearchResult {
  id: number;
  teamName: string;
  managerName: string;
}

const FEATURES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8">
        <circle cx="12" cy="12" r="10" /><polygon points="10,8 16,12 10,16" />
      </svg>
    ),
    title: "Live Scores",
    desc: "Real-time Premier League scores with match minute, HT and FT states.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8">
        <path d="M7 16V4m0 0L3 8m4-4l4 4" /><path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    ),
    title: "Plan Transfers",
    desc: "Line up your squad and plan transfers with fixture and price data.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8">
        <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
      </svg>
    ),
    title: "Scout Tips",
    desc: "Captain picks, differentials, ICT leaders and price changes — all free.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8">
        <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
      </svg>
    ),
    title: "My Team",
    desc: "Track your GW points, team value and overall rank in one place.",
  },
];

export default function LandingGate({ children }: { children: React.ReactNode }) {
  const [hasTeam, setHasTeam] = useState<boolean | null>(null);
  const [step, setStep] = useState<"hero" | "search" | "confirm" | "manual">("hero");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [manualId, setManualId] = useState("");
  const [manualError, setManualError] = useState("");
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    setHasTeam(!!localStorage.getItem("fpl_team_id"));
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/fpl/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.fallback) {
        setFallback(true);
        setResults([]);
      } else {
        setResults(data.results ?? []);
        setFallback(false);
      }
    } catch {
      setFallback(true);
    }
    setSearching(false);
  }, []);

  useEffect(() => {
    if (step !== "search") return;
    const t = setTimeout(() => search(query), 400);
    return () => clearTimeout(t);
  }, [query, search, step]);

  function confirm() {
    if (!selected) return;
    localStorage.setItem("fpl_team_id", String(selected.id));
    localStorage.setItem("fpl_onboarding_done", "1");
    window.location.href = "/transfers";
  }

  async function confirmManual() {
    setManualError("");
    const id = manualId.trim();
    if (!id || isNaN(Number(id))) {
      setManualError("Enter a valid numeric Team ID.");
      return;
    }
    try {
      const res = await fetch(`/api/fpl/team?id=${id}`);
      if (!res.ok) throw new Error();
      localStorage.setItem("fpl_team_id", id);
      localStorage.setItem("fpl_onboarding_done", "1");
      window.location.href = "/transfers";
    } catch {
      setManualError("Couldn't find that Team ID. Double-check and try again.");
    }
  }

  function skip() {
    localStorage.setItem("fpl_onboarding_done", "1");
    setHasTeam(true);
  }

  // Still loading from localStorage
  if (hasTeam === null) return null;

  // Already connected — render the app
  if (hasTeam) return <>{children}</>;

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden w-full" style={{ background: "#0f1520" }}>

      {/* Hero */}
      {step === "hero" && (
        <div className="flex-1 flex flex-col px-6">
          <div className="flex flex-col items-center pt-20 pb-8">
            <Logo size={72} showText={false} />
            <h1 className="text-3xl font-black text-white mt-6 text-center tracking-tight leading-tight">
              Everything you need<br />
              for <span style={{ color: "#f59e0b" }}>FPL</span>. One app.
            </h1>
            <p className="text-sm mt-3 text-center leading-relaxed" style={{ color: "#666" }}>
              Stop jumping between the FPL app, livescore sites<br />
              and X. Get it all here — for free.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3 mt-2 mb-8">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-start gap-3.5 px-1">
                <div className="mt-0.5 flex-shrink-0">{f.icon}</div>
                <div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#6688aa" }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-auto pb-6 space-y-3">
            <button
              onClick={() => setStep("search")}
              className="w-full py-3.5 rounded-xl text-sm font-bold"
              style={{ background: "#f59e0b", color: "#000" }}
            >
              Connect my FPL team
            </button>
            <button
              onClick={skip}
              className="w-full text-center text-xs py-2"
              style={{ color: "#4d6a88" }}
            >
              Explore without connecting
            </button>
          </div>
        </div>
      )}

      {/* Search step */}
      {step === "search" && (
        <div className="flex-1 flex flex-col px-6 pt-12">
          <button onClick={() => setStep("hero")}
            className="flex items-center gap-1.5 text-xs mb-6" style={{ color: "#6688aa" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15,18 9,12 15,6" /></svg>
            Back
          </button>

          {!fallback ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#f59e0b" }}>
                Find your team
              </p>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Your name or team name…"
                autoFocus
                className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none mb-3"
                style={{ background: "#1a2538", border: "1px solid #1e3050" }}
              />

              {searching && (
                <div className="flex justify-center py-4">
                  <div className="w-4 h-4 rounded-full border-2 animate-spin"
                    style={{ borderColor: "#f59e0b", borderTopColor: "transparent" }} />
                </div>
              )}

              {results.length > 0 && (
                <div className="rounded-xl overflow-hidden mb-4" style={{ border: "1px solid #1e3050" }}>
                  {results.map((r, i) => (
                    <button key={r.id} onClick={() => { setSelected(r); setStep("confirm"); }}
                      className="w-full text-left px-4 py-3 flex items-center justify-between active:opacity-70"
                      style={{ background: "#162030", borderTop: i > 0 ? "1px solid #1a2a40" : "none" }}>
                      <div>
                        <p className="text-sm font-semibold text-white">{r.teamName}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#6688aa" }}>{r.managerName}</p>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="#f59e0b" strokeWidth="2.5">
                        <polyline points="9,18 15,12 9,6" />
                      </svg>
                    </button>
                  ))}
                </div>
              )}

              {query.length >= 2 && !searching && results.length === 0 && (
                <p className="text-sm text-center py-4" style={{ color: "#6688aa" }}>
                  No results. Try your manager name instead.
                </p>
              )}

              <button onClick={() => setStep("manual")}
                className="w-full text-center text-xs py-3"
                style={{ color: "#4d6a88" }}>
                I know my Team ID → enter manually
              </button>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#f59e0b" }}>
                Search unavailable — enter your ID
              </p>
              <ManualIdGuide />
              <input
                type="number"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                placeholder="e.g. 1213119"
                autoFocus
                className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none mb-2"
                style={{ background: "#1a2538", border: "1px solid #1e3050" }}
              />
              {manualError && <p className="text-xs mb-2" style={{ color: "#ef4444" }}>{manualError}</p>}
              <button onClick={confirmManual}
                className="w-full py-3.5 rounded-xl text-sm font-bold"
                style={{ background: "#f59e0b", color: "#000" }}>
                Connect my team
              </button>
            </>
          )}

          <div className="mt-auto pb-6 pt-4">
            <button onClick={skip} className="w-full text-center text-xs py-2" style={{ color: "#3d5570" }}>
              Skip — explore without connecting
            </button>
          </div>
        </div>
      )}

      {/* Manual ID step */}
      {step === "manual" && (
        <div className="flex-1 flex flex-col px-6 pt-12">
          <button onClick={() => { setStep("search"); setFallback(false); }}
            className="flex items-center gap-1.5 text-xs mb-6" style={{ color: "#6688aa" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15,18 9,12 15,6" /></svg>
            Back to search
          </button>

          <ManualIdGuide />

          <input
            type="number"
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            placeholder="e.g. 1213119"
            autoFocus
            className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none mb-2"
            style={{ background: "#1a2538", border: "1px solid #1e3050" }}
          />
          {manualError && <p className="text-xs mb-2" style={{ color: "#ef4444" }}>{manualError}</p>}
          <button onClick={confirmManual}
            className="w-full py-3.5 rounded-xl text-sm font-bold"
            style={{ background: "#f59e0b", color: "#000" }}>
            Connect my team
          </button>

          <div className="mt-auto pb-6 pt-4">
            <button onClick={skip} className="w-full text-center text-xs py-2" style={{ color: "#3d5570" }}>
              Skip — explore without connecting
            </button>
          </div>
        </div>
      )}

      {/* Confirm step */}
      {step === "confirm" && selected && (
        <div className="flex-1 flex flex-col px-6 pt-12">
          <button onClick={() => { setStep("search"); setSelected(null); setQuery(""); setResults([]); }}
            className="flex items-center gap-1.5 text-xs mb-6" style={{ color: "#6688aa" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15,18 9,12 15,6" /></svg>
            Back to search
          </button>

          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#f59e0b" }}>
            Is this your team?
          </p>
          <div className="rounded-xl p-5 mb-4" style={{ background: "#162030", border: "1px solid #1e3050" }}>
            <p className="text-lg font-bold text-white">{selected.teamName}</p>
            <p className="text-sm mt-0.5" style={{ color: "#6688aa" }}>{selected.managerName}</p>
            <p className="text-xs mt-2 font-mono" style={{ color: "#3d5570" }}>ID: {selected.id}</p>
          </div>
          <button onClick={confirm}
            className="w-full py-3.5 rounded-xl text-sm font-bold mb-3"
            style={{ background: "#f59e0b", color: "#000" }}>
            Yes, connect this team
          </button>
          <button onClick={() => { setStep("search"); setSelected(null); setQuery(""); setResults([]); }}
            className="w-full py-3 rounded-xl text-sm font-semibold"
            style={{ background: "#1a2538", color: "#6688aa" }}>
            Not me — search again
          </button>
        </div>
      )}
    </div>
  );
}

function ManualIdGuide() {
  return (
    <div className="rounded-xl p-4 mb-4" style={{ background: "#1a2538", border: "1px solid #1e3050" }}>
      <p className="text-xs font-semibold mb-2" style={{ color: "#f59e0b" }}>How to find your Team ID</p>
      <div className="space-y-3">
        <div>
          <p className="text-xs font-semibold mb-1" style={{ color: "#99bbdd" }}>📱 On your phone</p>
          <ol className="text-xs space-y-0.5" style={{ color: "#666" }}>
            <li>1. Open <strong className="text-white">Safari or Chrome</strong></li>
            <li>2. Go to <strong className="text-white">fantasy.premierleague.com</strong></li>
            <li>3. Log in → tap <strong className="text-white">Points</strong></li>
            <li>4. Your ID is in the address bar:</li>
            <li className="pl-3 font-mono text-[11px]" style={{ color: "#f59e0b" }}>…/entry/<strong>1213119</strong>/event/…</li>
          </ol>
        </div>
        <div style={{ borderTop: "1px solid #0f1520", paddingTop: "10px" }}>
          <p className="text-xs font-semibold mb-1" style={{ color: "#99bbdd" }}>💻 Desktop</p>
          <ol className="text-xs space-y-0.5" style={{ color: "#666" }}>
            <li>1. Go to <strong className="text-white">fantasy.premierleague.com</strong></li>
            <li>2. Click <strong className="text-white">Points</strong> — check the URL:</li>
            <li className="pl-3 font-mono text-[11px]" style={{ color: "#f59e0b" }}>…/entry/<strong>1213119</strong>/event/…</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
