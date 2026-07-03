"use client";

import { useState, useEffect, useCallback } from "react";
import Logo from "@/components/Logo";

interface SearchResult {
  id: number;
  teamName: string;
  managerName: string;
}

export default function Onboarding() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState<"search" | "confirm" | "manual">("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [manualId, setManualId] = useState("");
  const [manualError, setManualError] = useState("");
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem("fpl_onboarding_done");
    if (!done) setShow(true);
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
    const t = setTimeout(() => search(query), 400);
    return () => clearTimeout(t);
  }, [query, search]);

  function selectResult(r: SearchResult) {
    setSelected(r);
    setStep("confirm");
  }

  function confirm() {
    if (!selected) return;
    localStorage.setItem("fpl_team_id", String(selected.id));
    localStorage.setItem("fpl_onboarding_done", "1");
    setShow(false);
    window.location.reload();
  }

  async function confirmManual() {
    setManualError("");
    const id = manualId.trim();
    if (!id || isNaN(Number(id))) {
      setManualError("Please enter a valid numeric Team ID.");
      return;
    }
    // Quick validation — try to fetch the team
    try {
      const res = await fetch(`/api/fpl/team?id=${id}`);
      if (!res.ok) throw new Error();
      localStorage.setItem("fpl_team_id", id);
      localStorage.setItem("fpl_onboarding_done", "1");
      setShow(false);
      window.location.reload();
    } catch {
      setManualError("Couldn't find that Team ID. Double-check and try again.");
    }
  }

  function skip() {
    localStorage.setItem("fpl_onboarding_done", "1");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: "#0a0a0a" }}>

      {/* Top */}
      <div className="flex flex-col items-center pt-16 pb-8 px-6">
        <Logo size={64} showText={false} />
        <h1 className="text-2xl font-bold text-white mt-5 text-center tracking-tight">
          Welcome to<br />
          <span style={{ color: "#f59e0b" }}>FPL Deadline Day</span>
        </h1>
        <p className="text-sm mt-2 text-center" style={{ color: "#555" }}>
          Connect your FPL team to track points,<br />plan transfers and get scout tips.
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 overflow-y-auto">

        {step === "search" && (
          <>
            {!fallback ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#f59e0b" }}>
                  Search your team
                </p>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Your name or team name…"
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none mb-3"
                  style={{ background: "#161616", border: "1px solid #1f1f1f" }}
                />

                {searching && (
                  <div className="flex justify-center py-4">
                    <div className="w-4 h-4 rounded-full border-2 animate-spin"
                      style={{ borderColor: "#f59e0b", borderTopColor: "transparent" }} />
                  </div>
                )}

                {results.length > 0 && (
                  <div className="rounded-xl overflow-hidden mb-4" style={{ border: "1px solid #1f1f1f" }}>
                    {results.map((r, i) => (
                      <button key={r.id} onClick={() => selectResult(r)}
                        className="w-full text-left px-4 py-3 flex items-center justify-between active:opacity-70"
                        style={{ background: "#111", borderTop: i > 0 ? "1px solid #1a1a1a" : "none" }}>
                        <div>
                          <p className="text-sm font-semibold text-white">{r.teamName}</p>
                          <p className="text-xs mt-0.5" style={{ color: "#555" }}>{r.managerName}</p>
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
                  <p className="text-sm text-center py-4" style={{ color: "#555" }}>
                    No results. Try your manager name instead.
                  </p>
                )}

                <button onClick={() => setStep("manual")}
                  className="w-full text-center text-xs py-3"
                  style={{ color: "#444" }}>
                  I know my Team ID → enter manually
                </button>
              </>
            ) : (
              /* Fallback: search not available, go straight to manual */
              <>
                <div className="rounded-xl p-4 mb-4" style={{ background: "#161616", border: "1px solid #1f1f1f" }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: "#f59e0b" }}>How to find your Team ID</p>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold mb-1" style={{ color: "#aaa" }}>📱 Easiest on mobile</p>
                      <ol className="text-xs space-y-0.5" style={{ color: "#666" }}>
                        <li>1. Open <strong className="text-white">Safari or Chrome</strong></li>
                        <li>2. Go to <strong className="text-white">fantasy.premierleague.com</strong></li>
                        <li>3. Log in → tap <strong className="text-white">Points</strong></li>
                        <li>4. Your ID is in the address bar:</li>
                        <li className="pl-3 font-mono text-[11px]" style={{ color: "#f59e0b" }}>…/entry/<strong>1213119</strong>/event/…</li>
                      </ol>
                    </div>
                    <div style={{ borderTop: "1px solid #2a2a2a", paddingTop: "10px" }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: "#aaa" }}>💻 Desktop</p>
                      <ol className="text-xs space-y-0.5" style={{ color: "#666" }}>
                        <li>1. Go to <strong className="text-white">fantasy.premierleague.com</strong></li>
                        <li>2. Click <strong className="text-white">Points</strong> — check the URL:</li>
                        <li className="pl-3 font-mono text-[11px]" style={{ color: "#f59e0b" }}>…/entry/<strong>1213119</strong>/event/…</li>
                      </ol>
                    </div>
                  </div>
                </div>
                <input
                  type="number"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  placeholder="e.g. 1213119"
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none mb-2"
                  style={{ background: "#161616", border: "1px solid #1f1f1f" }}
                />
                {manualError && <p className="text-xs mb-2" style={{ color: "#ef4444" }}>{manualError}</p>}
                <button onClick={confirmManual}
                  className="w-full py-3.5 rounded-xl text-sm font-bold mb-3"
                  style={{ background: "#f59e0b", color: "#000" }}>
                  Connect my team →
                </button>
              </>
            )}
          </>
        )}

        {step === "manual" && (
          <>
            <button onClick={() => setStep("search")}
              className="flex items-center gap-1.5 text-xs mb-4" style={{ color: "#555" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15,18 9,12 15,6" /></svg>
              Back to search
            </button>

            <div className="rounded-xl p-4 mb-4" style={{ background: "#161616", border: "1px solid #1f1f1f" }}>
              <p className="text-xs font-semibold mb-2" style={{ color: "#f59e0b" }}>How to find your Team ID</p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold mb-1" style={{ color: "#aaa" }}>📱 FPL App</p>
                  <ol className="text-xs space-y-0.5" style={{ color: "#666" }}>
                    <li>1. Go to <strong className="text-white">Points</strong> tab</li>
                    <li>2. Tap the <strong className="text-white">share icon</strong> (top right)</li>
                    <li>3. Copy link — the number is your ID:</li>
                    <li className="pl-3 font-mono text-[11px]" style={{ color: "#f59e0b" }}>…/entry/<strong>1213119</strong>/event/…</li>
                  </ol>
                </div>
                <div style={{ borderTop: "1px solid #2a2a2a", paddingTop: "10px" }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: "#aaa" }}>💻 Web browser</p>
                  <ol className="text-xs space-y-0.5" style={{ color: "#666" }}>
                    <li>1. Go to <strong className="text-white">fantasy.premierleague.com</strong></li>
                    <li>2. Click <strong className="text-white">Points</strong> — check the URL:</li>
                    <li className="pl-3 font-mono text-[11px]" style={{ color: "#f59e0b" }}>…/entry/<strong>1213119</strong>/event/…</li>
                  </ol>
                </div>
              </div>
            </div>

            <input
              type="number"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              placeholder="e.g. 1213119"
              autoFocus
              className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none mb-2"
              style={{ background: "#161616", border: "1px solid #1f1f1f" }}
            />
            {manualError && <p className="text-xs mb-2" style={{ color: "#ef4444" }}>{manualError}</p>}
            <button onClick={confirmManual}
              className="w-full py-3.5 rounded-xl text-sm font-bold"
              style={{ background: "#f59e0b", color: "#000" }}>
              Connect my team →
            </button>
          </>
        )}

        {step === "confirm" && selected && (
          <>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#f59e0b" }}>
              Is this you?
            </p>
            <div className="rounded-xl p-5 mb-4" style={{ background: "#111", border: "1px solid #1f1f1f" }}>
              <p className="text-lg font-bold text-white">{selected.teamName}</p>
              <p className="text-sm mt-0.5" style={{ color: "#555" }}>{selected.managerName}</p>
              <p className="text-xs mt-2 font-mono" style={{ color: "#333" }}>ID: {selected.id}</p>
            </div>
            <button onClick={confirm}
              className="w-full py-3.5 rounded-xl text-sm font-bold mb-3"
              style={{ background: "#f59e0b", color: "#000" }}>
              ✓ Yes, that&apos;s me
            </button>
            <button onClick={() => { setStep("search"); setSelected(null); setQuery(""); setResults([]); }}
              className="w-full py-3 rounded-xl text-sm font-semibold"
              style={{ background: "#161616", color: "#555" }}>
              Not me — search again
            </button>
          </>
        )}
      </div>

      {/* Skip */}
      <div className="px-6 pb-10 pt-4">
        <button onClick={skip}
          className="w-full text-center text-xs py-2"
          style={{ color: "#333" }}>
          Skip for now — I&apos;ll set up later in Settings
        </button>
      </div>
    </div>
  );
}
