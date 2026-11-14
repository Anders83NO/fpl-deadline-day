"use client";

import { useState, useEffect } from "react";
import Logo from "@/components/Logo";
import AuthModal from "@/components/AuthModal";
import DeadlineCountdown from "@/components/DeadlineCountdown";

interface TeamPreview {
  id: number;
  teamName: string;
  managerName: string;
  overallRank: number | null;
}

// Accepts a pasted FPL link (…/entry/123456/…) or a plain numeric ID.
function parseTeamId(input: string): string | null {
  const fromLink = input.match(/entry\/(\d{1,10})/);
  if (fromLink) return fromLink[1];
  const plain = input.trim().match(/^(\d{1,10})$/);
  return plain ? plain[1] : null;
}

const FEATURES = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" /><polygon points="10,8 16,12 10,16" />
      </svg>
    ),
    title: "Live Scores",
    desc: "Real-time Premier League scores with match minute, HT and FT states.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M7 16V4m0 0L3 8m4-4l4 4" /><path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    ),
    title: "Plan Transfers",
    desc: "Line up your squad and plan transfers with fixture and price data.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
      </svg>
    ),
    title: "Scout Tips",
    desc: "Captain picks, differentials, ICT leaders and price changes — all free.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
          { name: "Saka", code: 3, pos: "MID · ARS · £10.5m", tag: "IN", tagStyle: { background: "#0f2a10", color: "#4ade80" } },
          { name: "Palmer", code: 8, pos: "MID · CHE · £11.2m", tag: "OUT", tagStyle: { background: "#2a0f10", color: "#f87171" } },
        ].map((p) => (
          <div key={p.name} className="rounded-xl px-3 py-2.5 flex items-center gap-3" style={{ background: "#162030", border: "1px solid #1e2d42" }}>
            <img src={`https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${p.code}-110.webp`} alt="" width={30} height={34} style={{ objectFit: "contain", flexShrink: 0, filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.4))" }} />
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
          <span style={{ width: 28, height: 28, borderRadius: 999, background: "#1a2538", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#f0f2f5" /><path d="M12 7l4 3-1.5 4.5h-5L8 10z" fill="#0f1520" /><path d="M12 2v5M16 10l5-2M14.5 14.5l3 5M9.5 14.5l-3 5M8 10L3 8" stroke="#0f1520" strokeWidth="1.3" /></svg>
          </span>
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
          <span style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(245,158,11,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><polyline points="3,7 12,13 21,7" /></svg>
          </span>
          <div>
            <p style={{ color: "white", fontSize: 12, fontWeight: 700, margin: 0 }}>Email reminder</p>
            <p style={{ color: "#4d6a88", fontSize: 10, margin: 0 }}>24 hours before GW1 deadline</p>
          </div>
          <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 5, background: "#0f2010", color: "#4ade80", border: "1px solid #1a4020" }}>Active</span>
        </div>
        <div style={{ background: "#1a1200", border: "1px solid #3d2800", borderRadius: 10, padding: 12 }}>
          <p style={{ color: "#f59e0b", fontSize: 12, fontWeight: 700, margin: "0 0 4px", display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#f59e0b" aria-hidden="true"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10" /></svg>
            Ready to connect?
          </p>
          <p style={{ color: "#a07030", fontSize: 11, margin: 0 }}>Link your FPL team to see your real squad, captain picks and mini league standings.</p>
        </div>
      </div>
    ),
  },
];

const PREVIEW_ROWS: { name: string; code: number; gk?: boolean; pts: number; captain?: boolean }[][] = [
  [{ name: "Raya", code: 3, gk: true, pts: 6 }],
  [{ name: "Gabriel", code: 3, pts: 8 }, { name: "Van Dijk", code: 14, pts: 2 }, { name: "Gvardiol", code: 43, pts: 6 }],
  [{ name: "Saka", code: 3, pts: 22, captain: true }, { name: "Palmer", code: 8, pts: 5 }, { name: "Haaland", code: 43, pts: 9 }],
];

function PreviewPlayer({ name, code, gk, pts, captain }: { name: string; code: number; gk?: boolean; pts: number; captain?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1 w-[70px]">
      <div className="relative w-12 h-12 flex items-center justify-center">
        {captain && <span aria-hidden="true" className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle, rgba(245,158,11,0.55) 0%, rgba(245,158,11,0) 70%)" }} />}
        <img src={`https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${code}${gk ? "_1" : ""}-110.webp`} alt="" width={40} height={46}
          className="relative object-contain" style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.45))" }} />
        {captain && (
          <span className="absolute -top-0.5 -right-1 w-[18px] h-[18px] rounded-full text-[9px] font-extrabold flex items-center justify-center"
            style={{ background: "#f59e0b", color: "#000", boxShadow: "0 0 0 2px #0f1520" }}>C</span>
        )}
      </div>
      <div className="w-[64px] rounded-md overflow-hidden text-center" style={{ boxShadow: "0 4px 10px -2px rgba(0,0,0,0.5)" }}>
        <span className="block text-[10px] font-bold leading-tight py-[3px] truncate" style={{ background: "#fff", color: "#0f1520" }}>{name}</span>
        <span className="block text-[10.5px] font-extrabold tabular-nums py-[2px]"
          style={{ background: captain ? "#f59e0b" : "rgba(15,21,32,0.92)", color: captain ? "#000" : "#f59e0b" }}>{pts}</span>
      </div>
    </div>
  );
}

export default function LandingGate({ children }: { children: React.ReactNode }) {
  const [hasTeam, setHasTeam] = useState<boolean | null>(null);
  const [step, setStep] = useState<"hero" | "tour" | "search" | "confirm" | "manual">("hero");
  const [tourSlide, setTourSlide] = useState(0);
  const [linkInput, setLinkInput] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [selected, setSelected] = useState<TeamPreview | null>(null);
  const [manualId, setManualId] = useState("");
  const [manualError, setManualError] = useState("");
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    setHasTeam(!!localStorage.getItem("fpl_team_id"));
  }, []);

  // Paste-link step: look up the team as soon as a valid ID is recognised
  useEffect(() => {
    if (step !== "search") return;
    const id = parseTeamId(linkInput);
    if (!linkInput.trim()) return;
    if (!id) {
      const t = setTimeout(() => setLookupError("That doesn't look like an FPL link. It should contain /entry/ followed by a number."), 600);
      return () => clearTimeout(t);
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setLookingUp(true);
      try {
        const res = await fetch(`/api/fpl/entry?id=${id}`);
        const data = await res.json();
        if (cancelled) return;
        if (data.found) setSelected({ id: data.id, teamName: data.teamName, managerName: data.managerName, overallRank: data.overallRank });
        else if (res.status === 404) setLookupError(`We couldn't find a team with ID ${id}. Check the link and try again.`);
        else setLookupError("FPL isn't responding right now. Try again in a moment.");
      } catch {
        if (!cancelled) setLookupError("FPL isn't responding right now. Try again in a moment.");
      }
      if (!cancelled) setLookingUp(false);
    }, 350);
    return () => { cancelled = true; clearTimeout(t); setLookingUp(false); };
  }, [linkInput, step]);

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
    <div className="flex flex-col overflow-x-hidden w-full" style={{ minHeight: "calc(100dvh - 72px - env(safe-area-inset-bottom))" }}>

      {/* Hero */}
      {step === "hero" && (
        <div className="flex-1 flex flex-col w-full max-w-md mx-auto px-5 pb-10">
          {/* Top row: logo + live deadline */}
          <div className="flex items-center justify-between pt-5">
            <Logo size={34} showText={false} />
            <DeadlineCountdown />
          </div>

          {/* Headline + primary CTA — visible without scrolling */}
          <div className="flex flex-col items-center text-center pt-10 animate-fade-up">
            <h1 className="text-[30px] font-black text-white tracking-tight leading-[1.08]">
              Everything you need<br />
              for <span style={{ color: "#f59e0b" }}>FPL</span>. One app.
            </h1>
            <p className="text-[15px] mt-4 leading-relaxed" style={{ color: "#8aa4c2" }}>
              Live scores, transfer planner and deadline reminders.<br />Free, no ads.
            </p>
            <button
              onClick={() => setStep("manual")}
              className="w-full h-14 mt-7 rounded-full text-[15px] font-bold"
              style={{ background: "#f59e0b", color: "#000", boxShadow: "0 10px 30px -8px rgba(245,158,11,0.65)" }}
            >
              Connect my FPL team
            </button>
            <p className="text-xs mt-4" style={{ color: "#6688aa" }}>
              Just looking?{" "}
              <button
                onClick={() => { setTourSlide(0); setStep("tour"); }}
                className="underline underline-offset-2 font-semibold"
                style={{ color: "#c8d4e3" }}
              >
                Explore without connecting
              </button>
            </p>
          </div>

          {/* Product preview: example squad on the pitch */}
          <div className="relative mt-10 rounded-2xl overflow-hidden" style={{
            background: "repeating-linear-gradient(180deg, #1e6b35 0px, #1e6b35 44px, #1a5f2e 44px, #1a5f2e 88px)",
            border: "1px solid #2e7a3e",
            boxShadow: "inset 0 0 60px rgba(0,0,0,0.35), 0 16px 40px -16px rgba(0,0,0,0.7)",
          }}>
            <svg aria-hidden="true" className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 300" preserveAspectRatio="none">
              <rect x="110" y="0" width="180" height="60" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2" />
              <rect x="160" y="0" width="80" height="24" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2" />
              <path d="M 160 60 A 40 40 0 0 0 240 60" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2" />
              <path d="M 130 300 A 70 70 0 0 1 270 300" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2" />
            </svg>
            <span className="absolute top-2.5 left-3 text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded"
              style={{ background: "rgba(15,21,32,0.6)", color: "#c8d4e3" }}>Example</span>
            <div className="relative py-5 space-y-3">
              {PREVIEW_ROWS.map((row, r) => (
                <div key={r} className="flex justify-center gap-2">
                  {row.map((pl) => <PreviewPlayer key={pl.name} {...pl} />)}
                </div>
              ))}
            </div>
          </div>
          <p className="text-center text-xs mt-3" style={{ color: "#6688aa" }}>Your squad, live points and next fixtures on one pitch.</p>

          {/* Features — compact */}
          <div className="grid grid-cols-2 gap-2 mt-8">
            {FEATURES.map((f, i) => (
              <div key={i} className="card flex items-center gap-2.5 px-3 py-3">
                <span className="w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0" style={{ background: "rgba(245,158,11,0.1)" }}>{f.icon}</span>
                <p className="text-[13px] font-bold text-white leading-tight">{f.title}</p>
              </div>
            ))}
          </div>

          {/* Account — one line */}
          <div className="card mt-3 px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-xs leading-snug" style={{ color: "#8aa4c2" }}>
              <span className="text-white font-semibold">Free account:</span> deadline emails and plans saved across devices.
            </p>
            <button
              onClick={() => setShowAuth(true)}
              className="h-9 px-3.5 rounded-full text-xs font-bold flex-shrink-0"
              style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}
            >
              Create
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
          <div className="flex-1 flex flex-col w-full max-w-md mx-auto px-5 pt-6 pb-8">
            {/* Progress */}
            <div className="flex items-center gap-3 mb-7">
              <div className="flex gap-1.5 flex-1" role="progressbar" aria-valuemin={1} aria-valuemax={TOUR_SLIDES.length} aria-valuenow={tourSlide + 1}>
                {TOUR_SLIDES.map((_, i) => (
                  <div key={i} className="h-1 flex-1 rounded-full" style={{
                    background: i <= tourSlide ? "#f59e0b" : "#1e3050",
                    boxShadow: i === tourSlide ? "0 0 10px rgba(245,158,11,0.6)" : "none",
                    transition: "background-color 250ms, box-shadow 250ms",
                  }} />
                ))}
              </div>
              <span className="text-[11px] font-semibold tabular-nums" style={{ color: "#6688aa" }}>{tourSlide + 1}/{TOUR_SLIDES.length}</span>
            </div>

            <div key={tourSlide} className="flex-1 flex flex-col animate-fade-up">
              {/* Header */}
              <p className="eyebrow mb-2" style={{ color: "#f59e0b" }}>{slide.tag}</p>
              <h2 className="text-[26px] font-black text-white mb-2 leading-tight tracking-tight">{slide.title}</h2>
              <p className="text-[15px] mb-6 leading-relaxed" style={{ color: "#8aa4c2" }}>{slide.desc}</p>

              {/* Slide content */}
              <div className="card p-3.5">{slide.content}</div>
            </div>

            {/* Footer buttons */}
            <div className="mt-8 space-y-3">
              {isLast ? (
                <>
                  <button
                    onClick={() => setStep("manual")}
                    className="w-full h-14 rounded-full text-[15px] font-bold"
                    style={{ background: "#f59e0b", color: "#000", boxShadow: "0 10px 30px -8px rgba(245,158,11,0.65)" }}
                  >
                    Connect my FPL team
                  </button>
                  <button
                    onClick={skip}
                    className="w-full h-12 rounded-full text-sm font-semibold"
                    style={{ background: "#162030", color: "#c8d4e3", border: "1px solid #1e3050" }}
                  >
                    Continue without connecting
                  </button>
                </>
              ) : (
                <div className="flex gap-2.5">
                  <button
                    onClick={() => tourSlide === 0 ? setStep("hero") : setTourSlide(tourSlide - 1)}
                    className="h-14 pl-4 pr-5 rounded-full inline-flex items-center gap-1.5 text-sm font-bold whitespace-nowrap"
                    style={{ background: "#162030", color: "#c8d4e3", border: "1px solid #1e3050" }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15,18 9,12 15,6" /></svg>
                    Back
                  </button>
                  <button
                    onClick={() => setTourSlide(tourSlide + 1)}
                    className="flex-1 h-14 rounded-full inline-flex items-center justify-center gap-1.5 text-[15px] font-bold"
                    style={{ background: "#f59e0b", color: "#000", boxShadow: "0 10px 30px -8px rgba(245,158,11,0.65)" }}
                  >
                    Next
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9,18 15,12 9,6" /></svg>
                  </button>
                </div>
              )}
              {!isLast && (
                <button onClick={skip} className="w-full h-11 text-center text-xs font-medium underline underline-offset-2" style={{ color: "#6688aa" }}>
                  Skip — take me in
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {/* Paste-link step */}
      {step === "search" && (
        <div className="flex-1 flex flex-col w-full max-w-md mx-auto px-5 pt-6 animate-fade-up">
          <button onClick={() => setStep("manual")}
            className="self-start inline-flex items-center gap-1.5 h-9 pl-2.5 pr-3.5 rounded-full text-xs font-semibold mb-6"
            style={{ background: "#162030", border: "1px solid #1e3050", color: "#c8d4e3" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15,18 9,12 15,6" /></svg>
            Back
          </button>

          <div className="card p-5">
            <h2 className="text-lg font-bold text-white mb-4">Paste your FPL link</h2>
            <ol className="space-y-3">
              {[
                <>Open <strong className="text-white font-semibold">fantasy.premierleague.com</strong> in a browser and log in</>,
                <>Click <strong className="text-white font-semibold">Points</strong></>,
                <>Copy the whole address from the address bar and paste it below</>,
              ].map((body, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 tabular-nums"
                    style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}>{i + 1}</span>
                  <span className="text-[13px] leading-relaxed pt-0.5" style={{ color: "#8aa4c2" }}>{body}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="relative mt-5">
            <input
              type="url"
              inputMode="url"
              aria-label="FPL link or Team ID"
              aria-invalid={!!lookupError}
              aria-describedby={lookupError ? "link-error" : undefined}
              value={linkInput}
              onChange={(e) => { setLinkInput(e.target.value); setSelected(null); setLookupError(""); }}
              placeholder="https://fantasy.premierleague.com/entry/…"
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className="w-full h-14 pl-5 pr-12 rounded-2xl text-[15px] text-white outline-none placeholder:text-[#3d5570]"
              style={{ background: "#121b29", border: "1.5px solid #1e3050" }}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2" aria-hidden="true">
              {lookingUp ? (
                <span className="block w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: "#f59e0b", borderTopColor: "transparent" }} />
              ) : selected ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12" /></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3d5570" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
              )}
            </span>
          </div>

          {lookupError && !lookingUp && (
            <p id="link-error" role="alert" className="flex items-start gap-1.5 text-xs mt-2 px-1" style={{ color: "#ef4444" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true" className="mt-px flex-shrink-0"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              {lookupError}
            </p>
          )}

          {selected && !lookingUp && (
            <div className="card mt-4 p-4 animate-fade-up" style={{ borderColor: "rgba(74,222,128,0.35)" }} aria-live="polite">
              <p className="eyebrow mb-2" style={{ color: "#4ade80" }}>Is this your team?</p>
              <p className="text-lg font-bold text-white leading-tight">{selected.teamName}</p>
              <p className="text-sm mt-0.5" style={{ color: "#8aa4c2" }}>{selected.managerName}</p>
              <div className="flex gap-4 mt-3 text-[11px] tabular-nums" style={{ color: "#6688aa" }}>
                <span>ID <span className="text-white font-semibold">{selected.id}</span></span>
                {selected.overallRank != null && (
                  <span>Overall rank <span className="text-white font-semibold">{selected.overallRank.toLocaleString("en-GB")}</span></span>
                )}
              </div>
              <button onClick={confirm}
                className="w-full h-14 mt-4 rounded-full text-[15px] font-bold"
                style={{ background: "#f59e0b", color: "#000", boxShadow: "0 10px 30px -8px rgba(245,158,11,0.65)" }}>
                Yes, connect this team
              </button>
            </div>
          )}

          <div className="mt-auto pb-8 pt-6 space-y-1">
            <button onClick={() => setStep("manual")}
              className="w-full h-11 text-center text-sm font-semibold"
              style={{ color: "#f59e0b" }}>
              I know my Team ID →
            </button>
            <button onClick={skip} className="w-full h-11 text-center text-xs font-medium underline underline-offset-2" style={{ color: "#6688aa" }}>
              Skip — explore without connecting
            </button>
          </div>
        </div>
      )}

      {/* Manual ID step */}
      {step === "manual" && (
        <div className="flex-1 flex flex-col w-full max-w-md mx-auto px-5 pt-6 animate-fade-up">
          <div className="flex items-center justify-between gap-3 mb-6">
            <button onClick={() => setStep("hero")}
              aria-label="Back"
              className="w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0"
              style={{ background: "#162030", border: "1px solid #1e3050", color: "#c8d4e3" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15,18 9,12 15,6" /></svg>
            </button>
            <button onClick={() => { setLinkInput(""); setStep("search"); }}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs font-semibold"
              style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
              Easier: paste your FPL link instead
            </button>
          </div>

          <ManualIdGuide />

          <form onSubmit={(e) => { e.preventDefault(); confirmManual(); }} className="mt-5">
            <input
              type="number"
              inputMode="numeric"
              aria-label="FPL Team ID"
              aria-invalid={!!manualError}
              aria-describedby={manualError ? "manual-id-error" : undefined}
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              placeholder="e.g. 1213119"
              autoFocus
              className="w-full h-14 px-5 rounded-2xl text-lg font-semibold tabular-nums tracking-wide text-white outline-none placeholder:font-normal placeholder:text-[#3d5570]"
              style={{ background: "#121b29", border: `1.5px solid ${manualError ? "#ef4444" : "#1e3050"}` }}
            />
            {manualError && (
              <p id="manual-id-error" role="alert" className="flex items-center gap-1.5 text-xs mt-2 px-1" style={{ color: "#ef4444" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                {manualError}
              </p>
            )}
            <button type="submit"
              className="w-full h-14 mt-3 rounded-full text-[15px] font-bold"
              style={{ background: "#f59e0b", color: "#000", boxShadow: "0 10px 30px -8px rgba(245,158,11,0.65)" }}>
              Connect my team
            </button>
          </form>

          <div className="mt-auto pb-8 pt-6">
            <button onClick={skip} className="w-full h-11 text-center text-xs font-medium underline underline-offset-2" style={{ color: "#6688aa" }}>
              Skip — explore without connecting
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

function ManualIdGuide() {
  const step = (n: number, body: React.ReactNode) => (
    <li className="flex items-start gap-3">
      <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 tabular-nums"
        style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}>{n}</span>
      <span className="text-[13px] leading-relaxed pt-0.5" style={{ color: "#8aa4c2" }}>{body}</span>
    </li>
  );
  return (
    <div className="card p-5">
      <h2 className="text-lg font-bold text-white mb-4">How to find your Team ID</h2>
      <ol className="space-y-3">
        {step(1, <>Open <strong className="text-white font-semibold">fantasy.premierleague.com</strong> in a browser and log in</>)}
        {step(2, <>Click <strong className="text-white font-semibold">Pick Team</strong></>)}
        {step(3, <>Click <strong className="text-white font-semibold">Gameweek History</strong></>)}
        {step(4, <>Your ID is the number in the URL after <span className="font-mono text-white">/entry/</span>:</>)}
      </ol>
      <div className="mt-4 flex items-center gap-2 h-11 px-3 rounded-xl font-mono text-[12px] overflow-x-auto whitespace-nowrap"
        style={{ background: "#0f1520", border: "1px solid #1e3050", color: "#6688aa" }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-shrink-0"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
        <span>…/entry/<strong className="px-1 py-0.5 rounded font-bold" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>354716</strong>/history</span>
      </div>
    </div>
  );
}
