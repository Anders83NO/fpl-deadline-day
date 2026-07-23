"use client";

import { useState, useEffect, useCallback } from "react";
import Logo from "@/components/Logo";
import AuthModal from "@/components/AuthModal";

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

const TOUR_SLIDES = [
  {
    tag: "Transfers",
    title: "Plan your perfect GW",
    desc: "See who to bring in based on fixtures, form and price. Save your plan before the deadline.",
    content: (
      <div className="space-y-2">
        <div className="rounded-xl px-3 py-2.5 flex justify-between items-center" style={{ background: "#0f1520" }}>
          <span style={{ color: "#6688aa", fontSize: 11 }}>Free transfers</span>
          <span style={{ color: "white", fontSize: 13, fontWeight: 700 }}>2 <span style={{ color: "#4d6a88", fontSize: 10 }}>banked</span></span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[
            { label: "WC", style: { background: "#1a1200", color: "#f59e0b", border: "1px solid #3d2800" } },
            { label: "BB", style: { background: "#0f1520", color: "#2a3a4a", border: "1px solid #1e2d42", textDecoration: "line-through" } },
            { label: "TC", style: { background: "#162030", color: "#3d5570", border: "1px solid #1e2d42" } },
            { label: "FH", style: { background: "#162030", color: "#3d5570", border: "1px solid #1e2d42" } },
          ].map((c) => (
            <div key={c.label} style={{ ...c.style, flex: 1, borderRadius: 8, padding: "6px 4px", fontSize: 11, fontWeight: 700, textAlign: "center" }}>{c.label}</div>
          ))}
        </div>
        {[
          { name: "Saka", pos: "MID · ARS · £10.5m", tag: "IN", tagStyle: { background: "#0f2a10", color: "#4ade80" } },
          { name: "Palmer", pos: "MID · CHE · £11.2m", tag: "OUT", tagStyle: { background: "#2a0f10", color: "#f87171" } },
        ].map((p) => (
          <div key={p.name} className="rounded-xl px-3 py-2.5 flex items-center gap-3" style={{ background: "#162030", border: "1px solid #1e2d42" }}>
            <div style={{ width: 30, height: 30, borderRadius: 7, background: "#1e3050", flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ color: "white", fontSize: 12, fontWeight: 700, margin: 0 }}>{p.name}</p>
              <p style={{ color: "#4d6a88", fontSize: 10, margin: 0 }}>{p.pos}</p>
            </div>
            <span style={{ ...p.tagStyle, fontSize: 10, fontWeight: 700, padding: "3px 7px", borderRadius: 5 }}>{p.tag}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    tag: "Live GW",
    title: "Follow every match",
    desc: "Live scores, goals and assists updated in real time while your GW points tick up.",
    content: (
      <div className="space-y-2">
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#1a0f0f", border: "1px solid #7f1d1d", borderRadius: 6, padding: "3px 8px", fontSize: 10, fontWeight: 700, color: "#f87171" }}>
            <span style={{ width: 5, height: 5, background: "#f87171", borderRadius: "50%", display: "inline-block" }} />
            LIVE
          </span>
          <span style={{ color: "#4d6a88", fontSize: 11 }}>GW1 · 3 matches in play</span>
        </div>
        {[
          { home: "Arsenal", away: "Chelsea", score: "2 – 1", live: true },
          { home: "Man City", away: "Liverpool", score: "0 – 0", live: true },
          { home: "Newcastle", away: "Brentford", score: "15:00", live: false },
        ].map((m) => (
          <div key={m.home} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#162030", border: "1px solid #1e2d42", borderRadius: 10, padding: "10px 12px", opacity: m.live ? 1 : 0.5 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#c8d8e8", width: 76 }}>{m.home}</span>
            <span style={{ background: "#0d1623", borderRadius: 6, padding: "4px 10px", fontSize: 14, fontWeight: 800, color: "white" }}>{m.score}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#c8d8e8", width: 76, textAlign: "right" }}>{m.away}</span>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#162030", border: "1px solid #1e2d42", borderRadius: 12, padding: "10px 12px" }}>
          <span style={{ fontSize: 16 }}>⚽</span>
          <div style={{ flex: 1 }}>
            <p style={{ color: "white", fontSize: 11, fontWeight: 700, margin: 0 }}>Saka 67&apos; · Arsenal</p>
            <p style={{ color: "#4d6a88", fontSize: 10, margin: 0 }}>Assist: Martinelli</p>
          </div>
          <span style={{ background: "#1a1200", color: "#f59e0b", fontSize: 10, fontWeight: 700, padding: "3px 7px", borderRadius: 5 }}>+5</span>
        </div>
      </div>
    ),
  },
  {
    tag: "Deadline",
    title: "Never miss a deadline",
    desc: "Always know exactly how long you have left. Get an email reminder 24h before each GW.",
    content: (
      <div className="space-y-3">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
          {[["02","days"],["14","hrs"],["38","min"],["51","sec"]].map(([n,l]) => (
            <div key={l} style={{ background: "#162030", border: "1px solid #1e2d42", borderRadius: 12, padding: "14px 6px", textAlign: "center" }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#f59e0b", lineHeight: 1 }}>{n}</div>
              <div style={{ fontSize: 10, color: "#4d6a88", marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ background: "#162030", border: "1px solid #1e2d42", borderRadius: 10, padding: 12, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>📧</span>
          <div>
            <p style={{ color: "white", fontSize: 12, fontWeight: 700, margin: 0 }}>Email reminder</p>
            <p style={{ color: "#4d6a88", fontSize: 10, margin: 0 }}>24 hours before GW1 deadline</p>
          </div>
          <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 5, background: "#0f2010", color: "#4ade80", border: "1px solid #1a4020" }}>Active</span>
        </div>
        <div style={{ background: "#1a1200", border: "1px solid #3d2800", borderRadius: 10, padding: 12 }}>
          <p style={{ color: "#f59e0b", fontSize: 12, fontWeight: 700, margin: "0 0 4px" }}>⚡ Ready to connect?</p>
          <p style={{ color: "#a07030", fontSize: 11, margin: 0 }}>Link your FPL team to see your real squad, captain picks and mini league standings.</p>
        </div>
      </div>
    ),
  },
];

export default function LandingGate({ children }: { children: React.ReactNode }) {
  const [hasTeam, setHasTeam] = useState<boolean | null>(null);
  const [step, setStep] = useState<"hero" | "tour" | "search" | "confirm" | "manual">("hero");
  const [tourSlide, setTourSlide] = useState(0);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [manualId, setManualId] = useState("");
  const [manualError, setManualError] = useState("");
  const [fallback, setFallback] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

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

  function confirmManual() {
    setManualError("");
    const id = manualId.trim();
    if (!id || isNaN(Number(id))) {
      setManualError("Enter a valid numeric Team ID.");
      return;
    }
    localStorage.setItem("fpl_team_id", id);
    localStorage.setItem("fpl_onboarding_done", "1");
    window.location.href = "/transfers";
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
        <div className="flex-1 flex flex-col px-5 pb-8">
          <div className="flex flex-col items-center pt-16 pb-6">
            <Logo size={64} showText={false} />
            <h1 className="text-3xl font-black text-white mt-5 text-center tracking-tight leading-tight">
              Everything you need<br />
              for <span style={{ color: "#f59e0b" }}>FPL</span>. One app.
            </h1>
            <p className="text-sm mt-3 text-center leading-relaxed" style={{ color: "#555e70" }}>
              Stop jumping between the FPL app, livescore sites and X.<br />Get it all here — for free.
            </p>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            {FEATURES.map((f, i) => (
              <div key={i} className="rounded-xl p-3.5" style={{ background: "#141e2e", border: "1px solid #1e2d42" }}>
                <div className="mb-1.5">{f.icon}</div>
                <p className="text-sm font-bold text-white mb-1">{f.title}</p>
                <p className="text-[11px] leading-snug" style={{ color: "#4d6a88" }}>{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Account upsell */}
          <div className="rounded-xl px-4 py-3.5 mb-5" style={{ background: "#1a1500", border: "1px solid #f59e0b44" }}>
            <p className="text-[10px] font-bold tracking-widest uppercase mb-2.5" style={{ color: "#f59e0b" }}>With a free account</p>
            <div className="space-y-2">
              {[
                { title: "Deadline reminders", desc: "Email 24h and 2h before each GW deadline" },
                { title: "Plans saved across devices", desc: "Transfers, captain and chip picks synced" },
                { title: "GW history", desc: "See what you planned last week — automatically saved" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" className="flex-shrink-0 mt-0.5"><polyline points="20,6 9,17 4,12" /></svg>
                  <div>
                    <p className="text-xs font-semibold text-white">{item.title}</p>
                    <p className="text-[11px]" style={{ color: "#8a6d30" }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-2.5">
            <button
              onClick={() => setStep("manual")}
              className="w-full py-3.5 rounded-xl text-sm font-bold"
              style={{ background: "#f59e0b", color: "#000" }}
            >
              Connect my FPL team
            </button>
            <button
              onClick={() => setShowAuth(true)}
              className="w-full py-3 rounded-xl text-sm font-semibold"
              style={{ background: "#141e2e", color: "#f0f0f0", border: "1px solid #1e3050" }}
            >
              Create free account
            </button>
            <button
              onClick={() => { setTourSlide(0); setStep("tour"); }}
              className="w-full text-center text-xs py-2"
              style={{ color: "#3d5570" }}
            >
              Explore without connecting
            </button>
          </div>
        </div>
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      {/* Tour step */}
      {step === "tour" && (() => {
        const slide = TOUR_SLIDES[tourSlide];
        const isLast = tourSlide === TOUR_SLIDES.length - 1;
        return (
          <div className="flex-1 flex flex-col px-5 pt-5 pb-6" style={{ maxWidth: 440, margin: "0 auto", width: "100%" }}>
            {/* Progress dots */}
            <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
              {TOUR_SLIDES.map((_, i) => (
                <div key={i} style={{ height: 3, flex: 1, borderRadius: 2, background: i <= tourSlide ? "#f59e0b" : "#1e2d42", transition: "background 0.2s" }} />
              ))}
            </div>

            {/* Header */}
            <p className="text-[11px] font-bold tracking-[0.12em] uppercase mb-1" style={{ color: "#f59e0b" }}>{slide.tag}</p>
            <h2 className="text-xl font-extrabold text-white mb-1 leading-tight">{slide.title}</h2>
            <p className="text-sm mb-4 leading-relaxed" style={{ color: "#4d6a88" }}>{slide.desc}</p>

            {/* Slide content */}
            <div className="flex-1">{slide.content}</div>

            {/* Footer buttons */}
            <div className="mt-4 space-y-3">
              {isLast ? (
                <>
                  <button
                    onClick={() => setStep("manual")}
                    className="w-full py-3.5 rounded-xl text-sm font-bold"
                    style={{ background: "#f59e0b", color: "#000" }}
                  >
                    Connect my FPL team
                  </button>
                  <button
                    onClick={skip}
                    className="w-full py-3 rounded-xl text-sm font-semibold"
                    style={{ background: "#162030", color: "#6688aa", border: "1px solid #1e2d42" }}
                  >
                    Continue without connecting
                  </button>
                </>
              ) : (
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => tourSlide === 0 ? setStep("hero") : setTourSlide(tourSlide - 1)}
                    style={{ background: "#162030", color: "#c8d8e8", border: "1px solid #2a3d55", borderRadius: 12, padding: "14px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => setTourSlide(tourSlide + 1)}
                    style={{ flex: 1, background: "#f59e0b", color: "#000", border: "none", borderRadius: 12, padding: 14, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
                  >
                    Next →
                  </button>
                </div>
              )}
              {!isLast && (
                <button onClick={skip} className="w-full text-center text-xs py-1" style={{ color: "#3d5570" }}>
                  Skip — take me in
                </button>
              )}
            </div>
          </div>
        );
      })()}

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
                className="w-full text-center text-sm py-3 font-semibold underline underline-offset-2"
                style={{ color: "#f59e0b" }}>
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
      <ol className="text-xs space-y-1" style={{ color: "#6688aa" }}>
        <li>1. Open <strong className="text-white">fantasy.premierleague.com</strong> in a browser and log in</li>
        <li>2. Click <strong className="text-white">Points</strong> or <strong className="text-white">Transfer History</strong></li>
        <li>3. Your ID is the number in the URL after <span className="font-mono text-white">/entry/</span>:</li>
      </ol>
      <p className="font-mono text-[11px] mt-2 px-2 py-1.5 rounded" style={{ background: "#0f1520", color: "#f59e0b" }}>
        …/entry/<strong>354716</strong>/history
      </p>
    </div>
  );
}
