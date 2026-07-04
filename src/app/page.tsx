"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";

interface Match {
  id: number;
  home: string;
  homeCrest: string;
  away: string;
  awayCrest: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  minute: number | null;
  utcDate: string;
  matchday: number;
}

function isLive(status: string) {
  return ["1H", "2H", "HT", "ET", "BT", "P", "LIVE", "IN_PLAY", "PAUSED"].includes(status);
}

function isFinished(status: string) {
  return ["FT", "FINISHED", "AET", "PEN"].includes(status);
}

function isHalfTime(status: string) {
  return ["HT", "PAUSED"].includes(status);
}

type MatchState = "ns" | "live" | "ht" | "ft" | "postponed";

function getMatchState(status: string): MatchState {
  if (["NS", "TBD", "TIMED", "SCHEDULED"].includes(status)) return "ns";
  if (isFinished(status)) return "ft";
  if (isHalfTime(status)) return "ht";
  if (isLive(status)) return "live";
  if (["POSTPONED", "CANCELLED", "SUSPENDED"].includes(status)) return "postponed";
  return "ns";
}

function getCurrentSeason(): number {
  const now = new Date();
  return now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
}
const CURRENT_SEASON = getCurrentSeason();
const PREV_SEASON = CURRENT_SEASON - 1;

// Cache fetched GW data to avoid hitting rate limits when browsing history
const gwCache = new Map<string, { matches: Match[]; currentMatchday: number; season: string; seasonYear: number; matchday: number }>();

export default function Home() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [gw, setGw] = useState<number | null>(null);
  const [currentGw, setCurrentGw] = useState<number>(38);
  const [seasonYear, setSeasonYear] = useState<number>(CURRENT_SEASON);
  const [season, setSeason] = useState<string>("");
  const [fplPoints, setFplPoints] = useState<number | null>(null);
  const [fplGw, setFplGw] = useState<number | null>(null);
  const [fetchError, setFetchError] = useState(false);
  const [timezone, setTimezone] = useState("Europe/London");

  useEffect(() => {
    setTimezone(localStorage.getItem("fpl_timezone") ?? "Europe/London");
  }, []);

  useEffect(() => {
    async function loadFpl() {
      const id = localStorage.getItem("fpl_team_id");
      if (!id) return;
      try {
        const res = await fetch(`/api/fpl/team?id=${id}`);
        const json = await res.json();
        setFplPoints(json.gw_points);
        setFplGw(json.gw);
      } catch {}
    }
    loadFpl();
  }, []);

  useEffect(() => {
    async function loadMatches() {
      const cacheKey = `${seasonYear}-${gw ?? "current"}`;
      const cached = gwCache.get(cacheKey);

      // Use cache for historical GWs (all matches finished)
      if (cached && cached.matches.length > 0 && cached.matches.every(m => isFinished(m.status))) {
        setMatches(cached.matches);
        setCurrentGw(cached.currentMatchday);
        setSeason(cached.season);
        if (!gw) setGw(cached.matchday);
        setLoading(false);
        return;
      }

      setLoading(true);
      setFetchError(false);
      try {
        const params = new URLSearchParams();
        if (gw) params.set("gw", String(gw));
        params.set("season", String(seasonYear));
        const res = await fetch(`/api/matches?${params}`);
        if (!res.ok) throw new Error("API error");
        const json = await res.json();
        if (!json.matches) throw new Error("No data");
        setMatches(json.matches ?? []);
        setCurrentGw(json.currentMatchday ?? 38);
        setSeason(json.season ?? "");
        if (!gw) setGw(json.matchday ?? json.currentMatchday ?? 38);
        if (json.seasonYear) setSeasonYear(json.seasonYear);

        // Cache the result
        gwCache.set(cacheKey, {
          matches: json.matches ?? [],
          currentMatchday: json.currentMatchday ?? 38,
          season: json.season ?? "",
          seasonYear: json.seasonYear ?? seasonYear,
          matchday: json.matchday ?? gw ?? 1,
        });
      } catch {
        setFetchError(true);
      }
      setLoading(false);
    }
    loadMatches();
    const interval = setInterval(loadMatches, 30000);
    return () => clearInterval(interval);
  }, [gw, seasonYear]);

  function changeGw(dir: number) {
    const current = gw ?? currentGw;
    const next = current + dir;

    // Wrap backwards to previous season's GW38
    if (next < 1 && seasonYear > PREV_SEASON) {
      setSeasonYear((s) => s - 1);
      setGw(38);
      return;
    }
    // Wrap forwards to next season's GW1 — only if it's not the future
    if (next > 38 && seasonYear < CURRENT_SEASON) {
      setSeasonYear((s) => s + 1);
      setGw(1);
      return;
    }
    if (next < 1 || next > 38) return;
    setGw(next);
  }

  // Can go forward only if we're not already at current season's latest GW
  const canGoForward = gw !== null && (gw < 38 || seasonYear < CURRENT_SEASON);
  const canGoBack = gw !== null && (gw > 1 || seasonYear > PREV_SEASON);

  const liveMatches = matches.filter((m) => isLive(m.status));
  const hasLive = liveMatches.length > 0;

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4">

      {/* Header */}
      {hasLive && (
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-medium" style={{ color: "#f59e0b" }}>LIVE</span>
        </div>
      )}

      {/* Gameweek navigator */}
      <div className="flex items-center justify-between mb-4 rounded-xl px-4 py-3"
        style={{ background: "#162030", border: "1px solid #1e3050" }}>
        <button
          onClick={() => changeGw(-1)}
          disabled={!canGoBack}
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-opacity disabled:opacity-20"
          style={{ background: "#1e2d42" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5"><polyline points="15,18 9,12 15,6"/></svg>
        </button>

        <div className="text-center">
          <p className="text-[10px] uppercase tracking-widest" style={{ color: "#6688aa" }}>Gameweek</p>
          <p className="text-lg font-bold text-white">{gw ?? "—"}</p>
          {season && (
            <p className="text-[10px] mt-0.5" style={{ color: "#4d6a88" }}>{season}</p>
          )}
        </div>

        <button
          onClick={() => changeGw(1)}
          disabled={!canGoForward}
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-opacity disabled:opacity-20"
          style={{ background: "#1e2d42" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5"><polyline points="9,18 15,12 9,6"/></svg>
        </button>
      </div>

      {/* Matches */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "#f59e0b", borderTopColor: "transparent" }} />
        </div>
      ) : fetchError ? (
        <div className="rounded-xl p-8 text-center mb-8" style={{ background: "#162030", border: "1px solid #1e3050" }}>
          <p className="text-sm mb-3" style={{ color: "#6688aa" }}>Could not load matches.</p>
          <button
            onClick={() => setGw(gw)}
            className="text-xs font-semibold px-4 py-2 rounded-lg"
            style={{ background: "#1e2d42", color: "#f59e0b" }}
          >
            Tap to retry
          </button>
        </div>
      ) : matches.length === 0 ? (
        <div className="rounded-xl p-8 text-center mb-8" style={{ background: "#162030", border: "1px solid #1e3050" }}>
          <p className="text-sm" style={{ color: "#6688aa" }}>No matches for GW{gw}.</p>
        </div>
      ) : (
        <section className="mb-8 space-y-2">
          {matches.map((m) => (
            <MatchCard key={m.id} match={m} timezone={timezone} />
          ))}
        </section>
      )}

      {/* My FPL Points */}
      <section className="mb-8">
        <h2 className="text-[11px] font-semibold tracking-[0.12em] uppercase mb-3" style={{ color: "#6688aa" }}>
          My FPL Team
        </h2>
        <div className="rounded-xl p-5 flex items-center justify-between"
          style={{ background: "#162030", border: "1px solid #1e3050" }}>
          <div>
            <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: "#6688aa" }}>
              {fplGw ? `GW${fplGw} Points` : "GW Points"}
            </p>
            <p className="text-5xl font-bold tracking-tight" style={{ color: "#f59e0b" }}>
              {fplPoints ?? "—"}
            </p>
            {!fplPoints && <p className="text-xs mt-1" style={{ color: "#6688aa" }}>Enter your FPL ID to track</p>}
          </div>
          <Link href="/my-team"
            className="text-xs font-semibold px-4 py-2 rounded-lg tracking-wide"
            style={{ background: "#f59e0b", color: "#000" }}>
            {fplPoints ? "VIEW →" : "SET UP →"}
          </Link>
        </div>
      </section>

      {/* Scout */}
      <section>
        <h2 className="text-[11px] font-semibold tracking-[0.12em] uppercase mb-3" style={{ color: "#6688aa" }}>
          Scout Tips
        </h2>
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #1e3050" }}>
          {[
            { label: "Captain", value: "—", sub: "Top recommendation" },
            { label: "Transfer In", value: "—", sub: "Most transferred" },
            { label: "Differential", value: "—", sub: "Low ownership pick" },
          ].map((tip, i, arr) => (
            <div key={i} className="flex items-center justify-between px-4 py-3"
              style={{ background: "#162030", borderBottom: i < arr.length - 1 ? "1px solid #1a2a40" : "none" }}>
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: "#6688aa" }}>{tip.label}</p>
                <p className="text-sm font-semibold text-white mt-0.5">{tip.value}</p>
              </div>
              <p className="text-[11px]" style={{ color: "#3d5570" }}>{tip.sub}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}

function MatchCard({ match: m, timezone }: { match: Match; timezone: string }) {
  const state = getMatchState(m.status);
  const kickoff = new Date(m.utcDate).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: timezone });

  // Border and background per state
  const cardStyle = {
    ns:         { bg: "#162030",     border: "#2a2520" },
    live:       { bg: "#0f0e00",  border: "#3a2e00" },
    ht:         { bg: "#0a0f14",  border: "#1a2a3a" },
    ft:         { bg: "#162030",     border: "#2a2520" },
    postponed:  { bg: "#162030",     border: "#2a2520" },
  }[state];

  // Centre status badge
  const StatusBadge = () => {
    if (state === "ns") {
      return <span className="text-sm font-medium" style={{ color: "#4d6a88" }}>{kickoff}</span>;
    }
    if (state === "postponed") {
      return <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#6688aa" }}>PPD</span>;
    }

    const scoreEl = (
      <span className="text-white font-bold text-lg leading-none tabular-nums">
        {m.homeScore ?? 0} – {m.awayScore ?? 0}
      </span>
    );

    if (state === "live") {
      return (
        <div className="flex flex-col items-center gap-0.5">
          {scoreEl}
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-bold tabular-nums" style={{ color: "#f59e0b" }}>
              {m.minute ? `${m.minute}'` : "LIVE"}
            </span>
          </div>
        </div>
      );
    }

    if (state === "ht") {
      return (
        <div className="flex flex-col items-center gap-0.5">
          {scoreEl}
          <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#60a5fa" }}>HT</span>
        </div>
      );
    }

    // FT
    return (
      <div className="flex flex-col items-center gap-0.5">
        {scoreEl}
        <span className="text-[10px] font-semibold" style={{ color: "#4d6a88" }}>FT</span>
      </div>
    );
  };

  return (
    <Link href={`/match/${m.id}`}>
      <div className="rounded-xl px-4 py-3 flex items-center active:opacity-70 transition-opacity"
        style={{ background: cardStyle.bg, border: `1px solid ${cardStyle.border}` }}>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          {m.homeCrest && <Image src={m.homeCrest} alt={m.home} width={20} height={20} className="object-contain flex-shrink-0" />}
          <span className={`text-sm font-semibold truncate ${state === "ft" ? "opacity-60" : "text-white"}`}>{m.home}</span>
        </div>

        <div className="flex flex-col items-center mx-3 min-w-[72px]">
          <StatusBadge />
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className={`text-sm font-semibold truncate ${state === "ft" ? "opacity-60" : "text-white"}`}>{m.away}</span>
          {m.awayCrest && <Image src={m.awayCrest} alt={m.away} width={20} height={20} className="object-contain flex-shrink-0" />}
        </div>
      </div>
    </Link>
  );
}
