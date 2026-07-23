"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";

const TYPE_LABEL: Record<number, string> = { 1: "GK", 2: "DEF", 3: "MID", 4: "FWD" };
const TYPE_COLOR: Record<number, string> = {
  1: "#f59e0b", 2: "#22d3ee", 3: "#a78bfa", 4: "#4ade80",
};

interface Pick {
  element: number;
  position: number; // 1-11 = starting, 12-15 = bench
  name: string;
  team: string;
  teamCode: number;
  element_type: number;
  is_captain: boolean;
  is_vice_captain: boolean;
  price?: number;
  form?: number;
  points?: number;
}

interface Player {
  id: number;
  name: string;
  type: number;
  team: string;
  teamCode: number;
  teamId: number;
  price: number;
  points: number;
  form: number;
  selected: number;
  status: string;
  epNext: number;
  ictIndex: number;
  chanceNext: number | null;
  news: string;
}

interface PlannedTransfer {
  gw: number;
  outId: number;
  outName: string;
  outPrice: number;
  inId: number;
  inName: string;
  inPrice: number;
  inTeam: string;
  inTeamCode: number;
  inType: number;
}

interface LineupSwap {
  gw: number;
  p1Id: number;
  p2Id: number;
}

interface PlannedCaptain {
  gw: number;
  captainId: number;
  vcId: number;
}

type ChipType = "wildcard" | "freehit" | "triplecaptain" | "bboost";

interface PlannedChip {
  gw: number;
  chip: ChipType;
}

interface GwHistoryPlan {
  gw: number;
  saved_at: string;
  transfer_plan: Record<string, { outName: string; inName: string; outPrice: number; inPrice: number }[]>;
  captain_plan: Record<string, { captainId: number; vcId: number; captainName?: string; vcName?: string }>;
  chip_plan: Record<string, string>;
}

const CHIP_INFO: Record<ChipType, { label: string; short: string; color: string; desc: string }> = {
  wildcard:      { label: "Wildcard",        short: "WC", color: "#22d3ee", desc: "Unlimited free transfers this GW" },
  freehit:       { label: "Free Hit",        short: "FH", color: "#a78bfa", desc: "Temporary squad, reset after GW" },
  triplecaptain: { label: "Triple Captain",  short: "TC", color: "#f59e0b", desc: "Captain scores 3× instead of 2×" },
  bboost:        { label: "Bench Boost",     short: "BB", color: "#4ade80", desc: "Bench players' points count too" },
};

type SortKey = "price" | "points" | "form" | "epNext" | "selected";
type ViewMode = "pitch" | "list";
type PageMode = "lineup" | "transfers" | "fdr" | "analyse";

const MAX_BANKED_FT = 5;

const EMPTY_SQUAD: Pick[] = [
  { element: -1,  position: 1,  element_type: 1, name: "GKP", team: "", teamCode: 0, is_captain: false, is_vice_captain: false },
  { element: -2,  position: 2,  element_type: 2, name: "DEF", team: "", teamCode: 0, is_captain: false, is_vice_captain: false },
  { element: -3,  position: 3,  element_type: 2, name: "DEF", team: "", teamCode: 0, is_captain: false, is_vice_captain: false },
  { element: -4,  position: 4,  element_type: 2, name: "DEF", team: "", teamCode: 0, is_captain: false, is_vice_captain: false },
  { element: -5,  position: 5,  element_type: 2, name: "DEF", team: "", teamCode: 0, is_captain: false, is_vice_captain: false },
  { element: -6,  position: 6,  element_type: 3, name: "MID", team: "", teamCode: 0, is_captain: false, is_vice_captain: false },
  { element: -7,  position: 7,  element_type: 3, name: "MID", team: "", teamCode: 0, is_captain: false, is_vice_captain: false },
  { element: -8,  position: 8,  element_type: 3, name: "MID", team: "", teamCode: 0, is_captain: false, is_vice_captain: false },
  { element: -9,  position: 9,  element_type: 3, name: "MID", team: "", teamCode: 0, is_captain: false, is_vice_captain: false },
  { element: -10, position: 10, element_type: 4, name: "FWD", team: "", teamCode: 0, is_captain: false, is_vice_captain: false },
  { element: -11, position: 11, element_type: 4, name: "FWD", team: "", teamCode: 0, is_captain: false, is_vice_captain: false },
  { element: -12, position: 12, element_type: 1, name: "GKP", team: "", teamCode: 0, is_captain: false, is_vice_captain: false },
  { element: -13, position: 13, element_type: 2, name: "DEF", team: "", teamCode: 0, is_captain: false, is_vice_captain: false },
  { element: -14, position: 14, element_type: 3, name: "MID", team: "", teamCode: 0, is_captain: false, is_vice_captain: false },
  { element: -15, position: 15, element_type: 4, name: "FWD", team: "", teamCode: 0, is_captain: false, is_vice_captain: false },
];

function isValidLineup(picks: Pick[]): boolean {
  const starting = picks.filter((p) => p.position <= 11);
  const gks = starting.filter((p) => p.element_type === 1).length;
  const defs = starting.filter((p) => p.element_type === 2).length;
  const mids = starting.filter((p) => p.element_type === 3).length;
  const fwds = starting.filter((p) => p.element_type === 4).length;
  return gks === 1 && defs >= 3 && mids >= 2 && fwds >= 1;
}

export default function TransfersPage() {
  const { user } = useAuth();
  const [showHistory, setShowHistory] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [historyPlans, setHistoryPlans] = useState<GwHistoryPlan[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedGw, setExpandedGw] = useState<number | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [baseSquad, setBaseSquad] = useState<Pick[]>([]);
  const [baseBank, setBaseBank] = useState(0);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("pitch");
  const [pageMode, setPageMode] = useState<PageMode>("lineup");

  // Dynamic GW state — loaded from API
  const [firstPlanGw, setFirstPlanGw] = useState(1);
  const [totalGws, setTotalGws] = useState(38);
  const [isNewSeason, setIsNewSeason] = useState(false);
  const [gwDataReady, setGwDataReady] = useState(false);
  const [planGw, setPlanGw] = useState(1);

  // Fixture info for planGw: teamShortName → [{opponent, isHome}]
  const [fixtureMap, setFixtureMap] = useState<Record<string, { opponent: string; isHome: boolean }[]>>({});

  // FDR calendar
  const [fdrData, setFdrData] = useState<{ teams: { short: string; name: string; fixtures: { gw: number; opponent: string; isHome: boolean; fdr: number }[]; avgFdr: number }[]; gws: number[] } | null>(null);
  const [fdrLoading, setFdrLoading] = useState(false);

  const analyseLoading = false;

  // Plans
  const [transfers, setTransfers] = useState<PlannedTransfer[]>([]);
  const [lineupSwaps, setLineupSwaps] = useState<LineupSwap[]>([]);
  const [captainPlan, setCaptainPlan] = useState<PlannedCaptain[]>([]);
  const [chipPlan, setChipPlan] = useState<PlannedChip[]>([]);

  // Chips already used this season (from FPL API)
  const [chipsPlayed, setChipsPlayed] = useState<string[]>([]);

  // Lineup action menu (captain/VC/swap)
  const [actionPlayer, setActionPlayer] = useState<Pick | null>(null);

  // Transfer state
  const [transferOut, setTransferOut] = useState<Pick | null>(null);
  const [pendingIn, setPendingIn] = useState<Player | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("form");

  // Lineup swap state
  const [swapFirst, setSwapFirst] = useState<Pick | null>(null);
  const [transferError, setTransferError] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem("fpl_team_id");
    setTeamId(id);
    const savedT = localStorage.getItem("fpl_transfer_plan");
    if (savedT) setTransfers(JSON.parse(savedT));
    const savedL = localStorage.getItem("fpl_lineup_swaps");
    if (savedL) setLineupSwaps(JSON.parse(savedL));
    const savedC = localStorage.getItem("fpl_captain_plan");
    if (savedC) setCaptainPlan(JSON.parse(savedC));
    const savedChip = localStorage.getItem("fpl_chip_plan");
    if (savedChip) setChipPlan(JSON.parse(savedChip));

    async function load() {
      // 1. Load all players
      const [playersRes, gwStatusRes, chipsRes] = await Promise.all([
        fetch("/api/fpl/players"),
        fetch("/api/fpl/gw-status"),
        id ? fetch(`/api/fpl/team?id=${id}`) : Promise.resolve(null),
      ]);

      if (chipsRes?.ok) {
        const chipsData = await chipsRes.json();
        if (chipsData.chipsPlayed) setChipsPlayed(chipsData.chipsPlayed);
      }
      const playersData = await playersRes.json();
      setAllPlayers(playersData.players ?? []);

      const pm: Record<number, Player> = {};
      for (const p of (playersData.players ?? [])) pm[p.id] = p;

      // 2. Get dynamic GW info
      let fpGw = 1;
      let totGws = 38;
      let lastLocked: number | null = null;

      if (gwStatusRes.ok) {
        const gwStatus = await gwStatusRes.json();
        fpGw = gwStatus.firstPlanGw ?? 1;
        totGws = gwStatus.totalGws ?? 38;
        lastLocked = gwStatus.lastLockedGw ?? null;
        setFirstPlanGw(fpGw);
        setTotalGws(totGws);
        setIsNewSeason(fpGw === 1 && (gwStatus.currentGw ?? 0) >= totGws);
        setPlanGw(fpGw);
      }

      // 3. Load squad: prefer locked GW picks (data-driven), fall back to current team
      if (id) {
        let loaded = false;

        // Try to load the last locked GW's picks first (most accurate base for planning)
        if (lastLocked !== null) {
          try {
            const picksRes = await fetch(`/api/fpl/gw-picks?id=${id}&gw=${lastLocked}`);
            const picksData = await picksRes.json();
            if (picksData.ready && picksData.picks) {
              const enriched = picksData.picks.map((p: Pick) => ({
                ...p,
                price: pm[p.element]?.price ?? 0,
                form: pm[p.element]?.form ?? 0,
                points: pm[p.element]?.points ?? 0,
                teamCode: p.teamCode ?? pm[p.element]?.teamCode ?? 0,
              }));
              setBaseSquad(enriched);
              setBaseBank(parseFloat(picksData.bank ?? "0"));
              setGwDataReady(true);
              loaded = true;
            }
          } catch { /* fall through */ }
        }

        // Fall back to current team data if locked picks not ready yet
        if (!loaded) {
          try {
            const teamRes = await fetch(`/api/fpl/team?id=${id}`);
            const teamData = await teamRes.json();
            const picks = teamData.picks ?? [];
            if (picks.length > 0) {
              const enriched = picks.map((p: Pick) => ({
                ...p,
                price: pm[p.element]?.price ?? 0,
                form: pm[p.element]?.form ?? 0,
                points: pm[p.element]?.points ?? 0,
                teamCode: p.teamCode ?? pm[p.element]?.teamCode ?? 0,
              }));
              setBaseSquad(enriched);
              setBaseBank(parseFloat(teamData.bank ?? "0"));
            } else {
              // New season — no picks yet, show empty squad with £100m budget
              setBaseSquad(EMPTY_SQUAD);
              setBaseBank(100.0);
            }
            setGwDataReady(false);
            if (teamData.chipsPlayed) setChipsPlayed(teamData.chipsPlayed);
          } catch { /* ignore */ }
        }
      }

      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => { localStorage.setItem("fpl_transfer_plan", JSON.stringify(transfers)); }, [transfers]);
  useEffect(() => { localStorage.setItem("fpl_lineup_swaps", JSON.stringify(lineupSwaps)); }, [lineupSwaps]);
  useEffect(() => { localStorage.setItem("fpl_captain_plan", JSON.stringify(captainPlan)); }, [captainPlan]);
  useEffect(() => { localStorage.setItem("fpl_chip_plan", JSON.stringify(chipPlan)); }, [chipPlan]);

  useEffect(() => {
    if (!user || !showHistory) return;
    setHistoryLoading(true);
    fetch(`/api/gw-plans?userId=${user.id}`)
      .then((r) => r.json())
      .then((data) => { setHistoryPlans(data.plans ?? []); setHistoryLoading(false); })
      .catch(() => setHistoryLoading(false));
  }, [user, showHistory]);

  // Fetch fixtures for the current planGw (keyed by team short name)
  useEffect(() => {
    async function loadFixtures() {
      try {
        const res = await fetch(`/api/fpl/fixtures?gw=${planGw}`);
        const data = await res.json();
        // Convert teamId map → team short name map using the teamMap
        const tm: Record<number, string> = data.teamMap ?? {};
        const raw: Record<number, { opponent: string; isHome: boolean }[]> = data.fixtures ?? {};
        const byName: Record<string, { opponent: string; isHome: boolean }[]> = {};
        for (const [idStr, fixList] of Object.entries(raw)) {
          const name = tm[Number(idStr)];
          if (name) byName[name] = fixList as { opponent: string; isHome: boolean }[];
        }
        setFixtureMap(byName);
      } catch { /* ignore */ }
    }
    loadFixtures();
  }, [planGw]);

  // Load FDR when switching to FDR tab
  useEffect(() => {
    if (pageMode !== "fdr" || fdrData) return;
    setFdrLoading(true);
    fetch(`/api/fpl/fdr?from=${planGw}&count=6`)
      .then(r => r.json())
      .then(d => setFdrData(d))
      .catch(() => {})
      .finally(() => setFdrLoading(false));
  }, [pageMode, fdrData, planGw]);

  const playerMap = useMemo(() => {
    const m: Record<number, Player> = {};
    for (const p of allPlayers) m[p.id] = p;
    return m;
  }, [allPlayers]);

  // Apply all planned changes up to planGw
  const { squad, bank, freeTransfers } = useMemo(() => {
    let s = baseSquad.map((p) => ({ ...p }));
    let b = baseBank;
    let ft = 2;

    for (let gw = firstPlanGw; gw <= planGw; gw++) {
      const gwChip = chipPlan.find((c) => c.gw === gw)?.chip;
      const isWildcardOrFH = gwChip === "wildcard" || gwChip === "freehit";

      // Apply transfers
      const gwTransfers = transfers.filter((t) => t.gw === gw);
      for (const t of gwTransfers) {
        s = s.map((p) =>
          p.element === t.outId
            ? { ...p, element: t.inId, name: t.inName, team: t.inTeam, teamCode: t.inTeamCode, element_type: t.inType, price: t.inPrice }
            : p
        );
        b = b + t.outPrice - t.inPrice;
      }

      // Apply lineup swaps
      const gwSwaps = lineupSwaps.filter((sw) => sw.gw === gw);
      for (const sw of gwSwaps) {
        const i1 = s.findIndex((p) => p.element === sw.p1Id);
        const i2 = s.findIndex((p) => p.element === sw.p2Id);
        if (i1 !== -1 && i2 !== -1) {
          const pos1 = s[i1].position;
          s[i1] = { ...s[i1], position: s[i2].position };
          s[i2] = { ...s[i2], position: pos1 };
        }
      }

      // Apply captain/VC overrides
      const gwCaptain = captainPlan.find((c) => c.gw === gw);
      if (gwCaptain) {
        s = s.map((p) => ({
          ...p,
          is_captain: p.element === gwCaptain.captainId,
          is_vice_captain: p.element === gwCaptain.vcId,
        }));
      }

      if (gw < planGw) {
        // Wildcard/Free Hit: all transfers are free, FT stays at 1 next GW
        const usedFt = isWildcardOrFH ? 0 : gwTransfers.length;
        const unused = Math.max(0, ft - usedFt);
        ft = Math.min(MAX_BANKED_FT, unused + 1);
      }
    }

    return { squad: s, bank: b, freeTransfers: Math.max(0, ft) };
  }, [baseSquad, baseBank, transfers, lineupSwaps, captainPlan, chipPlan, planGw, firstPlanGw]);

  const analyseData = useMemo(() => {
    if (!squad.length || !allPlayers.length) return null;

    const fdrMap: Record<string, number> = {};
    if (fdrData) {
      for (const t of fdrData.teams) {
        const nextFixtures = t.fixtures.filter(f => f.gw >= planGw && f.gw < planGw + 3);
        fdrMap[t.short] = nextFixtures.length > 0
          ? nextFixtures.reduce((s, f) => s + f.fdr, 0) / nextFixtures.length
          : 3;
      }
    }

    function scorePlayer(pick: Pick): number {
      const p = playerMap[pick.element];
      if (!p) return 0;
      const epNext = p.epNext || 0;
      const form = p.form || 0;
      const ict = p.ictIndex || 0;
      const fdr = fdrMap[pick.team] ?? 3;
      const xPtsScore = Math.min(epNext / 8, 1) * 10;
      const formScore = Math.min(form / 8, 1) * 10;
      const ictScore  = Math.min(ict / 400, 1) * 10;
      const fdrScore  = ((5 - fdr) / 4) * 10;
      const raw = xPtsScore * 0.4 + formScore * 0.25 + ictScore * 0.15 + fdrScore * 0.2;
      return Math.round(Math.max(1, Math.min(10, raw)) * 10) / 10;
    }

    const scoredSquad = squad.map(pick => {
      const p = playerMap[pick.element];
      const score = scorePlayer(pick);
      const injured = (p?.chanceNext ?? 100) < 75;
      return {
        id: pick.element,
        name: pick.name,
        team: pick.team,
        type: pick.element_type,
        position: pick.position,
        score,
        isCaptain: pick.is_captain,
        isViceCaptain: pick.is_vice_captain,
        epNext: p?.epNext ?? 0,
        form: p?.form ?? 0,
        fdr: fdrMap[pick.team] ?? 3,
        price: p?.price ?? 0,
        injured,
        news: p?.news ?? "",
        status: p?.status ?? "a",
      };
    });

    const starting = scoredSquad.filter(p => p.position <= 11);

    const captainRec = [...starting].sort((a, b) => b.score - a.score).slice(0, 3).map(p => ({
      id: p.id, name: p.name, team: p.team, score: p.score, epNext: p.epNext,
    }));

    const weakLinks = [...starting].sort((a, b) => a.score - b.score).slice(0, 3);

    const squadIds = new Set(squad.map(p => p.element));
    const suggestions = weakLinks.map(weak => {
      const budget = bank + weak.price;
      const candidates = allPlayers
        .filter(p =>
          p.type === weak.type &&
          !squadIds.has(p.id) &&
          p.price <= budget &&
          p.status !== "u"
        )
        .map(p => ({
          id: p.id,
          name: p.name,
          team: p.team,
          price: p.price,
          score: scorePlayer({ element: p.id, name: p.name, team: p.team, element_type: p.type, teamCode: p.teamCode, position: 0, is_captain: false, is_vice_captain: false }),
          epNext: p.epNext,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      return {
        out: { name: weak.name, score: weak.score, price: weak.price },
        in: candidates,
      };
    });

    const bench = scoredSquad.filter(p => p.position > 11);
    const benchOrder = [...bench].sort((a, b) => b.score - a.score).map(p => ({
      id: p.id, name: p.name, score: p.score,
    }));

    const avgScore = starting.length > 0
      ? starting.reduce((s, p) => s + p.score, 0) / starting.length
      : 0;

    return {
      squad: scoredSquad,
      captainRec,
      weakLinks: weakLinks.map(p => ({ id: p.id, name: p.name, team: p.team, score: p.score, type: p.type })),
      suggestions,
      benchOrder,
      squadRating: Math.round(avgScore * 10) / 10,
      bank,
    };
  }, [squad, allPlayers, playerMap, fdrData, planGw, bank]);

  const budget = transferOut ? bank + (transferOut.price ?? 0) : bank;
  const gwTransfers = transfers.filter((t) => t.gw === planGw);
  const gwSwaps = lineupSwaps.filter((s) => s.gw === planGw);
  const activeChip = chipPlan.find((c) => c.gw === planGw)?.chip ?? null;
  const isWildcardActive = activeChip === "wildcard" || activeChip === "freehit";
  const pointsHit = isWildcardActive ? 0 : Math.max(0, gwTransfers.length - freeTransfers) * 4;

  const candidates = useMemo(() => {
    if (!transferOut) return [];
    const squadIds = new Set(squad.map((p) => p.element));
    return allPlayers
      .filter((p) => {
        if (p.type !== transferOut.element_type) return false;
        if (squadIds.has(p.id)) return false;
        if (p.price > budget) return false;
        if (search && !p.name.toLowerCase().includes(search.toLowerCase()) &&
            !p.team.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => b[sortBy] - a[sortBy])
      .slice(0, 30);
  }, [transferOut, allPlayers, squad, budget, search, sortBy]);

  // Lineup tap → show action menu (unless mid-swap)
  function handleLineupTap(pick: Pick) {
    if (swapFirst) {
      // Mid-swap: complete or cancel
      if (swapFirst.element === pick.element) { setSwapFirst(null); return; }

      const newSquad = squad.map((p) => ({ ...p }));
      const i1 = newSquad.findIndex((p) => p.element === swapFirst.element);
      const i2 = newSquad.findIndex((p) => p.element === pick.element);
      const pos1 = newSquad[i1].position;
      newSquad[i1].position = newSquad[i2].position;
      newSquad[i2].position = pos1;

      const isGkSwap = swapFirst.element_type === 1 || pick.element_type === 1;
      if (isGkSwap && swapFirst.element_type !== pick.element_type) { setSwapFirst(null); return; }
      if (!isValidLineup(newSquad)) { setSwapFirst(null); return; }

      setLineupSwaps((prev) => [...prev, { gw: planGw, p1Id: swapFirst.element, p2Id: pick.element }]);
      setSwapFirst(null);
      return;
    }
    // No swap in progress — show action menu
    setActionPlayer(actionPlayer?.element === pick.element ? null : pick);
  }

  function handleSetCaptain(pick: Pick) {
    const existing = captainPlan.find((c) => c.gw === planGw);
    // Fall back to actual squad captain/VC if no plan exists yet
    const oldCaptainId = existing?.captainId ?? squad.find(p => p.is_captain)?.element ?? 0;
    const oldVcId = existing?.vcId ?? squad.find(p => p.is_vice_captain)?.element ?? 0;
    // If picking the current VC as new C → swap them
    const newVcId = pick.element === oldVcId ? oldCaptainId : oldVcId;
    setCaptainPlan((prev) => [
      ...prev.filter((c) => c.gw !== planGw),
      { gw: planGw, captainId: pick.element, vcId: newVcId },
    ]);
    setActionPlayer(null);
  }

  function handleSetVC(pick: Pick) {
    const existing = captainPlan.find((c) => c.gw === planGw);
    // Fall back to actual squad captain/VC if no plan exists yet
    const oldCaptainId = existing?.captainId ?? squad.find(p => p.is_captain)?.element ?? 0;
    const oldVcId = existing?.vcId ?? squad.find(p => p.is_vice_captain)?.element ?? 0;
    // If picking the current C as new VC → swap them
    const newCaptainId = pick.element === oldCaptainId ? oldVcId : oldCaptainId;
    setCaptainPlan((prev) => [
      ...prev.filter((c) => c.gw !== planGw),
      { gw: planGw, captainId: newCaptainId, vcId: pick.element },
    ]);
    setActionPlayer(null);
  }

  function toggleChip(chip: ChipType) {
    const existing = chipPlan.find((c) => c.gw === planGw)?.chip;
    if (existing === chip) {
      setChipPlan((prev) => prev.filter((c) => c.gw !== planGw));
    } else {
      setChipPlan((prev) => [...prev.filter((c) => c.gw !== planGw), { gw: planGw, chip }]);
    }
  }

  function acceptTransfer() {
    if (!transferOut || !pendingIn) return;

    // Max 3 players from same team
    const playersFromTeam = squad.filter(
      (p) => p.team === pendingIn.team && p.element !== transferOut.element
    ).length;
    if (playersFromTeam >= 3) {
      setTransferError(`Max 3 players per team — you already have 3 from ${pendingIn.team}.`);
      return;
    }
    setTransferError(null);

    const t: PlannedTransfer = {
      gw: planGw,
      outId: transferOut.element,
      outName: transferOut.name,
      outPrice: transferOut.price ?? 0,
      inId: pendingIn.id,
      inName: pendingIn.name,
      inPrice: pendingIn.price,
      inTeam: pendingIn.team,
      inTeamCode: pendingIn.teamCode,
      inType: pendingIn.type,
    };
    setTransfers((prev) => [...prev.filter((x) => !(x.gw === planGw && x.outId === transferOut.element)), t]);
    setTransferOut(null);
    setPendingIn(null);
    setSearch("");
  }

  function resetGw() {
    setTransfers((prev) => prev.filter((t) => t.gw !== planGw));
    setLineupSwaps((prev) => prev.filter((s) => s.gw !== planGw));
    setCaptainPlan((prev) => prev.filter((c) => c.gw !== planGw));
    setChipPlan((prev) => prev.filter((c) => c.gw !== planGw));
    setTransferOut(null);
    setPendingIn(null);
    setSwapFirst(null);
    setActionPlayer(null);
    setSearch("");
  }

  function cancelTransfer() {
    setTransferOut(null);
    setPendingIn(null);
    setSearch("");
  }

  const starting = squad.filter((p) => p.position <= 11).sort((a, b) => a.position - b.position);
  const bench = squad.filter((p) => p.position > 11).sort((a, b) => a.position - b.position);
  const gk = starting.filter((p) => p.element_type === 1);
  const defs = starting.filter((p) => p.element_type === 2);
  const mids = starting.filter((p) => p.element_type === 3);
  const fwds = starting.filter((p) => p.element_type === 4);

  const hasGwChanges = gwTransfers.length > 0 || gwSwaps.length > 0 || !!activeChip || !!captainPlan.find(c => c.gw === planGw);
  const isEmptySquad = baseSquad.length > 0 && baseSquad.every(p => p.element < 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "#f59e0b", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8">

      {/* Header */}
      <header className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.15em] uppercase" style={{ color: "#f59e0b" }}>Squad Planner</p>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-0.5">{showHistory ? "History" : "Plan Ahead"}</h1>
        </div>
        <div className="flex items-center gap-2">
          {hasGwChanges && (
            <button onClick={resetGw}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold"
              style={{ background: "#1a0a0a", color: "#ef4444", border: "1px solid #2a1010" }}>
              Reset GW
            </button>
          )}
          {!transferOut && !swapFirst && teamId && (
            <div className="flex items-center gap-1.5">
              {user && (
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                  style={{ background: showHistory ? "#1a1500" : "#1e2d42", color: showHistory ? "#f59e0b" : "#7799bb", border: `1px solid ${showHistory ? "#f59e0b44" : "#1e3050"}` }}
                >
                  {showHistory ? "← Plan" : "History"}
                </button>
              )}
              <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid #1e3050" }}>
                <button onClick={() => setViewMode("pitch")}
                  className="px-3 py-1.5 text-xs font-semibold"
                  style={{ background: viewMode === "pitch" ? "#f59e0b" : "#162030", color: viewMode === "pitch" ? "#000" : "#555" }}>
                  ⬡
                </button>
                <button onClick={() => setViewMode("list")}
                  className="px-3 py-1.5 text-xs font-semibold"
                  style={{ background: viewMode === "list" ? "#f59e0b" : "#162030", color: viewMode === "list" ? "#000" : "#555" }}>
                  ☰
                </button>
              </div>
            </div>
          )}
        </div>
      </header>


      {showHistory ? (
        <div>
          {historyLoading && (
            <div className="flex justify-center pt-12">
              <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "#f59e0b", borderTopColor: "transparent" }} />
            </div>
          )}
          {!historyLoading && historyPlans.length === 0 && (
            <div className="text-center pt-12">
              <p className="text-3xl mb-3">📭</p>
              <p className="text-white font-semibold mb-1">No history yet</p>
              <p className="text-sm" style={{ color: "#6688aa" }}>Your plans are saved here after each gameweek deadline.</p>
            </div>
          )}
          <div className="space-y-3">
            {historyPlans.map((plan) => {
              const gwTransfers = plan.transfer_plan?.[String(plan.gw)] ?? [];
              const gwCaptain = plan.captain_plan?.[String(plan.gw)];
              const gwChip = plan.chip_plan?.[String(plan.gw)];
              const isOpen = expandedGw === plan.gw;
              return (
                <div key={plan.gw} className="rounded-xl overflow-hidden" style={{ border: "1px solid #1e2d42" }}>
                  <button
                    onClick={() => setExpandedGw(isOpen ? null : plan.gw)}
                    className="w-full flex items-center justify-between px-4 py-3.5 text-left"
                    style={{ background: "#141e2e" }}
                  >
                    <div>
                      <p className="text-sm font-bold text-white">GW{plan.gw}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: "#4d6a88" }}>
                        {gwTransfers.length} transfer{gwTransfers.length !== 1 ? "s" : ""}
                        {gwCaptain?.captainName ? ` · C: ${gwCaptain.captainName}` : ""}
                        {gwChip ? ` · ${gwChip}` : ""}
                      </p>
                    </div>
                    <span style={{ color: "#4d6a88", display: "inline-block", transform: isOpen ? "rotate(180deg)" : "none" }}>▼</span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-3" style={{ background: "#0f1520", borderTop: "1px solid #1e2d42" }}>
                      {gwTransfers.length > 0 ? (
                        <div className="mb-3">
                          <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#4d6a88" }}>Transfers</p>
                          <div className="space-y-2">
                            {gwTransfers.map((t, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm flex-wrap">
                                <span style={{ color: "#ef4444" }}>OUT</span>
                                <span className="text-white font-medium">{t.outName}</span>
                                <span style={{ color: "#4d6a88" }}>→</span>
                                <span style={{ color: "#4ade80" }}>IN</span>
                                <span className="text-white font-medium">{t.inName}</span>
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
                            {gwCaptain.captainName && <span><span style={{ color: "#f59e0b" }}>C</span> <span className="text-white">{gwCaptain.captainName}</span></span>}
                            {gwCaptain.vcName && <span><span style={{ color: "#6688aa" }}>VC</span> <span className="text-white">{gwCaptain.vcName}</span></span>}
                          </div>
                        </div>
                      )}
                      {gwChip && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#4d6a88" }}>Chip</p>
                          <span className="text-xs px-2 py-1 rounded font-semibold" style={{ background: "#1a1500", color: "#f59e0b", border: "1px solid #f59e0b44" }}>{gwChip}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : !teamId ? (
        <div className="rounded-xl p-6 text-center" style={{ background: "#162030", border: "1px solid #1e3050" }}>
          <p className="text-sm mb-3" style={{ color: "#6688aa" }}>Set up your team first.</p>
          <a href="/my-team" className="text-sm font-semibold px-4 py-2 rounded-lg inline-block" style={{ background: "#f59e0b", color: "#000" }}>Go to My Team →</a>
        </div>
      ) : (
        <>
          {/* Data source indicator */}
          {!isEmptySquad && (
            <div className="mb-3 px-1">
              <p className="text-[10px]" style={{ color: gwDataReady ? "#4ade80" : "#555" }}>
                {gwDataReady
                  ? `✓ Squad based on last locked GW`
                  : `Squad based on current FPL data`}
              </p>
            </div>
          )}

          {/* GW1 empty squad banner */}
          {isEmptySquad && (
            <div className="rounded-xl px-4 py-3 mb-3" style={{ background: "#1a1200", border: "1px solid #f59e0b44" }}>
              <p className="text-xs font-bold mb-0.5" style={{ color: "#f59e0b" }}>Build your squad for GW1</p>
              <p className="text-[11px]" style={{ color: "#a07030" }}>Go to Transfers and tap a position to add a player. Budget: £{bank.toFixed(1)}m</p>
            </div>
          )}

          {/* Mode toggle */}
          <div className="flex rounded-xl overflow-hidden mb-3" style={{ border: "1px solid #1e3050" }}>
            <button onClick={() => { setPageMode("lineup"); setTransferOut(null); setPendingIn(null); setSearch(""); setActionPlayer(null); }}
              className="flex-1 py-2.5 text-xs font-semibold tracking-wide uppercase"
              style={{ background: pageMode === "lineup" ? "#f59e0b" : "#162030", color: pageMode === "lineup" ? "#000" : "#555" }}>
              Lineup
            </button>
            <button onClick={() => { setPageMode("transfers"); setSwapFirst(null); setActionPlayer(null); }}
              className="flex-1 py-2.5 text-xs font-semibold tracking-wide uppercase"
              style={{ background: pageMode === "transfers" ? "#f59e0b" : "#162030", color: pageMode === "transfers" ? "#000" : "#555" }}>
              Transfers
            </button>
            <button onClick={() => { setPageMode("fdr"); setTransferOut(null); setPendingIn(null); setSwapFirst(null); }}
              className="flex-1 py-2.5 text-xs font-semibold tracking-wide uppercase"
              style={{ background: pageMode === "fdr" ? "#f59e0b" : "#162030", color: pageMode === "fdr" ? "#000" : "#555" }}>
              FDR
            </button>
            <button onClick={() => { setPageMode("analyse"); setTransferOut(null); setPendingIn(null); setSwapFirst(null); }}
              className="flex-1 py-2.5 text-xs font-semibold tracking-wide uppercase"
              style={{ background: pageMode === "analyse" ? "#f59e0b" : "#162030", color: pageMode === "analyse" ? "#000" : "#555" }}>
              Analyse
            </button>
          </div>

          {/* GW Navigator (not shown in FDR mode) */}
          {(pageMode !== "fdr" && pageMode !== "analyse") && <div className="flex items-center justify-between rounded-xl px-4 py-3 mb-3"
            style={{ background: "#162030", border: "1px solid #1e3050" }}>
            <button onClick={() => { setPlanGw((g) => Math.max(firstPlanGw, g - 1)); setSwapFirst(null); setTransferOut(null); }}
              disabled={planGw <= firstPlanGw}
              className="w-8 h-8 flex items-center justify-center rounded-lg disabled:opacity-20"
              style={{ background: "#1e2d42" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5"><polyline points="15,18 9,12 15,6" /></svg>
            </button>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-widest" style={{ color: "#6688aa" }}>
                {isNewSeason ? "Next Season" : "Planning"}
              </p>
              <p className="text-lg font-bold text-white">GW {planGw}</p>
              <p className="text-[10px] mt-0.5" style={{ color: freeTransfers > 0 ? "#4ade80" : "#ef4444" }}>
                {freeTransfers} free transfer{freeTransfers !== 1 ? "s" : ""}
                {pointsHit > 0 && <span style={{ color: "#ef4444" }}> · -{pointsHit}pts hit</span>}
              </p>
            </div>
            <button onClick={() => { setPlanGw((g) => Math.min(totalGws, g + 1)); setSwapFirst(null); setTransferOut(null); }}
              disabled={planGw >= totalGws}
              className="w-8 h-8 flex items-center justify-center rounded-lg disabled:opacity-20"
              style={{ background: "#1e2d42" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5"><polyline points="9,18 15,12 9,6" /></svg>
            </button>
          </div>}

          {/* Chips selector (lineup + transfers mode) */}
          {(pageMode === "lineup" || pageMode === "transfers") && !transferOut && !pendingIn && (
            <div className="flex gap-2 mb-3">
              {(Object.keys(CHIP_INFO) as ChipType[]).map((chip) => {
                const info = CHIP_INFO[chip];
                const isActive = activeChip === chip;
                const isUsed = chipsPlayed.includes(chip);
                return (
                  <button key={chip} onClick={() => !isUsed && toggleChip(chip)}
                    disabled={isUsed}
                    className="flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wide transition-all relative"
                    style={{
                      background: isUsed ? "#0f1520" : isActive ? info.color + "33" : "#162030",
                      border: `1px solid ${isUsed ? "#1a2030" : isActive ? info.color : "#1e3050"}`,
                      color: isUsed ? "#2a3a4a" : isActive ? info.color : "#3d5570",
                      cursor: isUsed ? "default" : "pointer",
                      textDecoration: isUsed ? "line-through" : "none",
                    }}
                    title={isUsed ? `${info.label} already used this season` : info.desc}>
                    {info.short}
                    {isUsed && (
                      <span style={{ display: "block", fontSize: "8px", color: "#2a3a4a", textDecoration: "none", marginTop: "1px" }}>used</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          {activeChip && (
            <div className="rounded-xl px-4 py-2.5 mb-3 flex items-center justify-between"
              style={{ background: CHIP_INFO[activeChip].color + "15", border: `1px solid ${CHIP_INFO[activeChip].color}44` }}>
              <div>
                <p className="text-xs font-bold" style={{ color: CHIP_INFO[activeChip].color }}>{CHIP_INFO[activeChip].label} active</p>
                <p className="text-[10px]" style={{ color: "#6688aa" }}>{CHIP_INFO[activeChip].desc}</p>
              </div>
            </div>
          )}

          {/* Budget (transfers mode only) */}
          {pageMode === "transfers" && !pendingIn && (
            <div className="rounded-xl px-4 py-3 flex items-center justify-between mb-4"
              style={{ background: "#162030", border: "1px solid #1e3050" }}>
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: "#6688aa" }}>Budget</p>
                <p className="text-xl font-bold" style={{ color: bank >= 0 ? "#f59e0b" : "#ef4444" }}>£{bank.toFixed(1)}m</p>
              </div>
              {transferOut ? (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[10px]" style={{ color: "#6688aa" }}>Selling · max £{budget.toFixed(1)}m</p>
                    <p className="text-sm font-semibold text-white">{transferOut.name} <span style={{ color: "#f59e0b" }}>£{(transferOut.price ?? 0).toFixed(1)}m</span></p>
                  </div>
                  <button onClick={cancelTransfer} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: "#1e2d42", color: "#6688aa" }}>Cancel</button>
                </div>
              ) : (
                <p className="text-xs" style={{ color: "#6688aa" }}>Tap player to transfer</p>
              )}
            </div>
          )}

          {/* Action menu: captain / VC / swap */}
          {pageMode === "lineup" && actionPlayer && !swapFirst && (
            <div className="rounded-xl px-4 py-3 mb-3" style={{ background: "#1a1500", border: "1px solid #f59e0b44" }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-white">{actionPlayer.name}</p>
                <button onClick={() => setActionPlayer(null)} className="text-xs" style={{ color: "#6688aa" }}>✕</button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSetCaptain(actionPlayer)}
                  className="flex-1 py-2 rounded-lg text-xs font-bold"
                  style={{ background: squad.find(p => p.element === actionPlayer.element)?.is_captain ? "#f59e0b" : "#f59e0b22", color: "#f59e0b", border: "1px solid #f59e0b44" }}>
                  Captain (C)
                </button>
                <button
                  onClick={() => handleSetVC(actionPlayer)}
                  className="flex-1 py-2 rounded-lg text-xs font-bold"
                  style={{ background: squad.find(p => p.element === actionPlayer.element)?.is_vice_captain ? "#888" : "#88888822", color: "#aaa", border: "1px solid #88888844" }}>
                  Vice (V)
                </button>
                <button
                  onClick={() => { setSwapFirst(actionPlayer); setActionPlayer(null); }}
                  className="flex-1 py-2 rounded-lg text-xs font-bold"
                  style={{ background: "#22d3ee22", color: "#22d3ee", border: "1px solid #22d3ee44" }}>
                  Swap
                </button>
              </div>
            </div>
          )}

          {/* Swap hint */}
          {pageMode === "lineup" && swapFirst && (
            <div className="rounded-xl px-4 py-2.5 mb-3 flex items-center justify-between"
              style={{ background: "#161610", border: "1px solid #2a2000" }}>
              <p className="text-xs" style={{ color: "#f59e0b" }}>
                Swapping <strong>{swapFirst.name}</strong> — tap another player
              </p>
              <button onClick={() => setSwapFirst(null)} className="text-xs" style={{ color: "#6688aa" }}>Cancel</button>
            </div>
          )}

          {/* GW summary */}
          {hasGwChanges && !transferOut && !pendingIn && !swapFirst && (
            <div className="mb-4 rounded-xl overflow-hidden" style={{ border: "1px solid #2a2000" }}>
              <div className="px-4 py-2" style={{ background: "#161000" }}>
                <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "#f59e0b" }}>GW{planGw} Changes</p>
              </div>
              {gwTransfers.map((t, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-2" style={{ background: "#162030", borderTop: "1px solid #1a2a40" }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs" style={{ color: "#ef4444" }}>↑</span>
                      <span className="text-xs text-white">{t.outName}</span>
                      <span className="text-[10px]" style={{ color: "#6688aa" }}>£{t.outPrice.toFixed(1)}m</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs" style={{ color: "#4ade80" }}>↓</span>
                      <span className="text-xs font-semibold text-white">{t.inName}</span>
                      <span className="text-[10px]" style={{ color: "#6688aa" }}>£{t.inPrice.toFixed(1)}m</span>
                    </div>
                  </div>
                  <button onClick={() => setTransfers((prev) => prev.filter((x) => !(x.gw === t.gw && x.outId === t.outId)))}
                    className="text-[10px] px-2 py-1 rounded" style={{ background: "#1e2d42", color: "#6688aa" }}>Remove</button>
                </div>
              ))}
              {gwSwaps.map((sw, i) => {
                const p1 = squad.find((p) => p.element === sw.p1Id);
                const p2 = squad.find((p) => p.element === sw.p2Id);
                return (
                  <div key={`sw-${i}`} className="flex items-center gap-2 px-4 py-2" style={{ background: "#162030", borderTop: "1px solid #1a2a40" }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white flex items-center gap-1.5">
                        <span style={{ color: "#a78bfa" }}>⇄</span>
                        {p1?.name ?? "?"} ↔ {p2?.name ?? "?"}
                        <span className="text-[10px]" style={{ color: "#6688aa" }}>(lineup swap)</span>
                      </p>
                    </div>
                    <button onClick={() => setLineupSwaps((prev) => prev.filter((_, j) => j !== i))}
                      className="text-[10px] px-2 py-1 rounded" style={{ background: "#1e2d42", color: "#6688aa" }}>Remove</button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Confirm transfer */}
          {pendingIn && transferOut && (
            <div className="mb-4 rounded-xl p-4" style={{ background: "#161610", border: "1px solid #2a2000" }}>
              <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#f59e0b" }}>Confirm transfer GW{planGw}</p>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 text-center p-2 rounded-lg" style={{ background: "#1a0a0a" }}>
                  <p className="text-[10px]" style={{ color: "#ef4444" }}>OUT</p>
                  <p className="text-sm font-bold text-white">{transferOut.name}</p>
                  <p className="text-xs" style={{ color: "#6688aa" }}>£{(transferOut.price ?? 0).toFixed(1)}m</p>
                </div>
                <span style={{ color: "#f59e0b" }}>→</span>
                <div className="flex-1 text-center p-2 rounded-lg" style={{ background: "#0a1a0a" }}>
                  <p className="text-[10px]" style={{ color: "#4ade80" }}>IN</p>
                  <p className="text-sm font-bold text-white">{pendingIn.name}</p>
                  <p className="text-xs" style={{ color: "#6688aa" }}>£{pendingIn.price.toFixed(1)}m</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setPendingIn(null)} className="flex-1 py-2 rounded-lg text-sm font-semibold" style={{ background: "#1e2d42", color: "#6688aa" }}>Back</button>
                <button onClick={acceptTransfer} className="flex-1 py-2 rounded-lg text-sm font-bold" style={{ background: "#f59e0b", color: "#000" }}>✓ Accept</button>
              </div>
              {transferError && (
                <p className="text-xs text-center mt-2 px-1" style={{ color: "#f87171" }}>{transferError}</p>
              )}
            </div>
          )}

          {/* Analyse */}
          {pageMode === "analyse" && (
            <div>
              {analyseLoading ? (
                <div className="flex justify-center py-10">
                  <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "#f59e0b", borderTopColor: "transparent" }} />
                </div>
              ) : analyseData ? (
                <div className="space-y-4">
                  {/* Squad Rating */}
                  <div className="rounded-xl p-4 text-center" style={{ background: "#162030", border: "1px solid #1e3050" }}>
                    <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "#6688aa" }}>Squad Rating</p>
                    <p className="text-4xl font-bold" style={{ color: ratingColor(analyseData.squadRating) }}>
                      {analyseData.squadRating}
                    </p>
                    <p className="text-[10px] mt-1" style={{ color: "#6688aa" }}>out of 10 · based on form, fixtures & xPts</p>
                  </div>

                  {/* Captain Recommendation */}
                  <div className="rounded-xl overflow-hidden" style={{ background: "#162030", border: "1px solid #1e3050" }}>
                    <div className="px-4 py-2" style={{ borderBottom: "1px solid #1a2a40" }}>
                      <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "#f59e0b" }}>Captain Recommendation</p>
                    </div>
                    {analyseData.captainRec.map((p, i) => (
                      <div key={p.id} className="flex items-center gap-3 px-4 py-2.5" style={{ borderTop: i > 0 ? "1px solid #1a2a40" : "none" }}>
                        <span className="text-xs font-bold w-6 text-center" style={{ color: i === 0 ? "#f59e0b" : "#555" }}>
                          {i === 0 ? "C" : i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                          <p className="text-[10px]" style={{ color: "#6688aa" }}>{p.team} · {p.epNext.toFixed(1)} xPts</p>
                        </div>
                        <span className="text-sm font-bold" style={{ color: ratingColor(p.score) }}>{p.score}</span>
                      </div>
                    ))}
                  </div>

                  {/* Weak Links & Suggestions */}
                  <div className="rounded-xl overflow-hidden" style={{ background: "#162030", border: "1px solid #1e3050" }}>
                    <div className="px-4 py-2" style={{ borderBottom: "1px solid #1a2a40" }}>
                      <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "#ef4444" }}>Weak Links — Transfer Tips</p>
                    </div>
                    {analyseData.suggestions.map((s, i) => (
                      <div key={i} style={{ borderTop: i > 0 ? "1px solid #1a2a40" : "none" }}>
                        <div className="flex items-center gap-3 px-4 py-2.5" style={{ background: "#1a0a0a" }}>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: "#ef444422", color: "#ef4444" }}>OUT</span>
                          <p className="text-sm font-semibold text-white flex-1">{s.out.name}</p>
                          <span className="text-xs" style={{ color: "#6688aa" }}>£{s.out.price.toFixed(1)}m</span>
                          <span className="text-sm font-bold" style={{ color: ratingColor(s.out.score) }}>{s.out.score}</span>
                        </div>
                        {s.in.map((candidate, j) => (
                          <div key={j} className="flex items-center gap-3 px-4 py-2" style={{ background: "#0a1a0a", borderTop: "1px solid #152535" }}>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: "#4ade8022", color: "#4ade80" }}>IN</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-white truncate">{candidate.name}</p>
                              <p className="text-[10px]" style={{ color: "#6688aa" }}>{candidate.team}</p>
                            </div>
                            <span className="text-xs" style={{ color: "#6688aa" }}>£{candidate.price.toFixed(1)}m</span>
                            <span className="text-sm font-bold" style={{ color: ratingColor(candidate.score) }}>{candidate.score}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Bench Order */}
                  <div className="rounded-xl overflow-hidden" style={{ background: "#162030", border: "1px solid #1e3050" }}>
                    <div className="px-4 py-2" style={{ borderBottom: "1px solid #1a2a40" }}>
                      <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "#a78bfa" }}>Optimal Bench Order</p>
                    </div>
                    {analyseData.benchOrder.map((p, i) => (
                      <div key={p.id} className="flex items-center gap-3 px-4 py-2.5" style={{ borderTop: i > 0 ? "1px solid #1a2a40" : "none" }}>
                        <span className="text-xs font-bold w-6 text-center" style={{ color: "#6688aa" }}>{i + 1}</span>
                        <p className="text-sm font-semibold text-white flex-1">{p.name}</p>
                        <span className="text-sm font-bold" style={{ color: ratingColor(p.score) }}>{p.score}</span>
                      </div>
                    ))}
                  </div>

                  {/* Full Squad Ratings */}
                  <div className="rounded-xl overflow-hidden" style={{ background: "#162030", border: "1px solid #1e3050" }}>
                    <div className="px-4 py-2.5" style={{ borderBottom: "1px solid #1a2a40" }}>
                      <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "#6688aa" }}>All Players — Rating</p>
                      <p className="text-[9px] mt-0.5" style={{ color: "#4d6a88" }}>Scored 1–10 based on form (25%), expected points (40%), ICT index (15%) & fixture difficulty (20%)</p>
                    </div>
                    {[...analyseData.squad]
                      .sort((a, b) => b.score - a.score)
                      .map((p, i) => (
                        <div key={p.id} className="flex items-center gap-3 px-4 py-2" style={{ borderTop: i > 0 ? "1px solid #152535" : "none" }}>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded w-8 text-center flex-shrink-0"
                            style={{ background: (TYPE_COLOR[p.type] ?? "#888") + "22", color: TYPE_COLOR[p.type] ?? "#888" }}>
                            {TYPE_LABEL[p.type]}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-semibold text-white truncate">{p.name}</p>
                              {p.injured && <span className="text-[9px]" style={{ color: "#ef4444" }}>⚠</span>}
                              {p.position > 11 && <span className="text-[8px] px-1 rounded" style={{ background: "#1e2d42", color: "#6688aa" }}>bench</span>}
                            </div>
                            <p className="text-[10px]" style={{ color: "#6688aa" }}>
                              {p.team} · {p.form} form · FDR {p.fdr.toFixed(1)}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold" style={{ color: ratingColor(p.score) }}>{p.score}</p>
                            <p className="text-[9px]" style={{ color: "#6688aa" }}>{p.epNext.toFixed(1)} xPts</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <p className="text-center py-6 text-sm" style={{ color: "#6688aa" }}>Could not load analysis. Make sure your team ID is set.</p>
              )}
            </div>
          )}

          {/* FDR Calendar */}
          {pageMode === "fdr" && (
            <div>
              {fdrLoading ? (
                <div className="flex justify-center py-10">
                  <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "#f59e0b", borderTopColor: "transparent" }} />
                </div>
              ) : fdrData ? (
                <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #1e3050" }}>
                  {/* Header row */}
                  <div className="flex" style={{ background: "#1a2538" }}>
                    <div className="w-12 flex-shrink-0 px-2 py-2">
                      <span className="text-[9px] font-bold uppercase" style={{ color: "#6688aa" }}>Team</span>
                    </div>
                    {fdrData.gws.map(gw => (
                      <div key={gw} className="flex-1 text-center py-2">
                        <span className="text-[9px] font-bold" style={{ color: "#6688aa" }}>{gw}</span>
                      </div>
                    ))}
                  </div>
                  {/* Team rows */}
                  {fdrData.teams.map((team, i) => (
                    <div key={team.short} className="flex" style={{ borderTop: "1px solid #1a2a40" }}>
                      <div className="w-12 flex-shrink-0 px-2 py-2 flex items-center">
                        <span className="text-[10px] font-bold text-white">{team.short}</span>
                      </div>
                      {fdrData.gws.map(gw => {
                        const fix = team.fixtures.filter(f => f.gw === gw);
                        return (
                          <div key={gw} className="flex-1 flex flex-col items-center justify-center py-1.5 gap-0.5">
                            {fix.length > 0 ? fix.map((f, j) => (
                              <div key={j} className="rounded px-1 py-0.5 text-center w-full"
                                style={{ background: fdrColor(f.fdr) }}>
                                <span className="text-[9px] font-bold" style={{ color: f.fdr <= 2 ? "#000" : "#fff" }}>
                                  {f.opponent}
                                </span>
                                <span className="text-[7px] block" style={{ color: f.fdr <= 2 ? "#0005" : "#fff8" }}>
                                  {f.isHome ? "H" : "A"}
                                </span>
                              </div>
                            )) : (
                              <span className="text-[9px]" style={{ color: "#3d5570" }}>-</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-6 text-sm" style={{ color: "#6688aa" }}>Could not load fixture data.</p>
              )}
            </div>
          )}

          {/* Squad view */}
          {pageMode !== "fdr" && pageMode !== "analyse" && !pendingIn && !transferOut && (
            <>
              {viewMode === "pitch" ? (
                <div>
                  <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#6688aa" }}>
                    {pageMode === "lineup" ? "Tap to select · tap again to swap" : "Tap to transfer out"}
                  </p>
                  <div className="rounded-xl mb-3 overflow-hidden relative" style={{
                  background: `repeating-linear-gradient(
                    180deg,
                    #1e6b35 0px, #1e6b35 60px,
                    #1a5f2e 60px, #1a5f2e 120px
                  )`,
                  border: "1px solid #2e7a3e",
                }}>
                    <PitchMarkings />
                    <div className="relative z-10 py-5">
                      <PitchRow picks={gk} onTap={pageMode === "lineup" ? handleLineupTap : setTransferOut} selectedId={swapFirst?.element ?? null} fixtureMap={fixtureMap} showPrice={pageMode === "transfers"} />
                      <PitchRow picks={defs} onTap={pageMode === "lineup" ? handleLineupTap : setTransferOut} selectedId={swapFirst?.element ?? null} fixtureMap={fixtureMap} showPrice={pageMode === "transfers"} />
                      <PitchRow picks={mids} onTap={pageMode === "lineup" ? handleLineupTap : setTransferOut} selectedId={swapFirst?.element ?? null} fixtureMap={fixtureMap} showPrice={pageMode === "transfers"} />
                      <PitchRow picks={fwds} onTap={pageMode === "lineup" ? handleLineupTap : setTransferOut} selectedId={swapFirst?.element ?? null} fixtureMap={fixtureMap} showPrice={pageMode === "transfers"} />
                    </div>
                  </div>
                  <div className="rounded-xl p-3" style={{ background: "#162030", border: "1px solid #1e3050" }}>
                    <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: "#6688aa" }}>Bench</p>
                    <div className="flex justify-around">
                      {bench.map((p) => (
                        <PitchCard key={p.element} pick={p}
                          onTap={pageMode === "lineup" ? handleLineupTap : setTransferOut}
                          selected={swapFirst?.element === p.element}
                          fixtureMap={fixtureMap}
                          showPrice={pageMode === "transfers"}
                          dimmed={pageMode === "lineup" && swapFirst !== null && swapFirst.element !== p.element &&
                            ((swapFirst.element_type === 1) !== (p.element_type === 1))}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-6">
                  <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: "#6688aa" }}>
                    Starting XI — {pageMode === "lineup" ? "tap to swap" : "tap to transfer out"}
                  </p>
                  <div className="space-y-1.5">
                    {starting.map((p) => (
                      <SquadRow key={p.element} pick={p} playerInfo={playerMap[p.element]}
                        onSelect={() => pageMode === "lineup" ? handleLineupTap(p) : setTransferOut(p)}
                        selected={swapFirst?.element === p.element} fixtureMap={fixtureMap} />
                    ))}
                  </div>
                  <p className="text-[10px] uppercase tracking-wider mt-4 mb-2" style={{ color: "#3d5570" }}>Bench</p>
                  <div className="space-y-1.5">
                    {bench.map((p) => (
                      <SquadRow key={p.element} pick={p} playerInfo={playerMap[p.element]}
                        onSelect={() => pageMode === "lineup" ? handleLineupTap(p) : setTransferOut(p)}
                        selected={swapFirst?.element === p.element} fixtureMap={fixtureMap} dimmed />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Replacement search */}
          {pageMode === "transfers" && transferOut && !pendingIn && (
            <div>
              <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: "#6688aa" }}>
                Replacements · {TYPE_LABEL[transferOut.element_type]} · Max £{budget.toFixed(1)}m
              </p>
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search player or team…"
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none mb-3"
                style={{ background: "#1a2538", border: "1px solid #1e3050" }} autoFocus />
              <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                {(["form", "points", "epNext", "price", "selected"] as SortKey[]).map((key) => (
                  <button key={key} onClick={() => setSortBy(key)}
                    className="flex-shrink-0 text-[10px] font-semibold px-3 py-1.5 rounded-lg uppercase tracking-wide"
                    style={{ background: sortBy === key ? "#f59e0b" : "#161616", color: sortBy === key ? "#000" : "#555" }}>
                    {key === "epNext" ? "xPts" : key === "selected" ? "Owned%" : key}
                  </button>
                ))}
              </div>
              <div className="space-y-1.5">
                {candidates.map((p) => (
                  <button key={p.id} onClick={() => setPendingIn(p)} className="w-full text-left">
                    <PlayerRow player={p} fixtureMap={fixtureMap} />
                  </button>
                ))}
                {candidates.length === 0 && (
                  <p className="text-center py-6 text-sm" style={{ color: "#6688aa" }}>No players found within budget.</p>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {!user && !showHistory && (
        <button onClick={() => setShowAuth(true)} className="w-full mt-6 rounded-xl px-4 py-3.5 flex items-center justify-between text-left"
          style={{ background: "#1a1500", border: "1px solid #f59e0b33" }}>
          <div>
            <p className="text-sm font-bold text-white mb-0.5">Save your GW history</p>
            <p className="text-[11px]" style={{ color: "#c8a84b" }}>Sign in to keep a record of every plan</p>
          </div>
          <span className="text-xs font-bold ml-3 flex-shrink-0" style={{ color: "#f59e0b" }}>Sign in →</span>
        </button>
      )}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}

// ─── Rating & FDR colors ────────────────────────────────────────

function ratingColor(score: number): string {
  if (score >= 7) return "#4ade80";
  if (score >= 5) return "#f59e0b";
  if (score >= 3) return "#fb923c";
  return "#ef4444";
}


function fdrColor(fdr: number): string {
  if (fdr <= 1) return "#1e8449";
  if (fdr <= 2) return "#4ade80";
  if (fdr === 3) return "#6b7280";
  if (fdr === 4) return "#dc2626";
  return "#7f1d1d";
}

// ─── Pitch markings ─────────────────────────────────────────────

function PitchMarkings() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 500" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      {/* Goal */}
      <rect x="155" y="0" width="90" height="8" rx="2" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
      <line x1="155" y1="8" x2="165" y2="0" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      <line x1="200" y1="8" x2="200" y2="0" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      <line x1="245" y1="8" x2="235" y2="0" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      {/* Goal area (6-yard box) */}
      <rect x="140" y="10" width="120" height="70" rx="0" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
      {/* Penalty area */}
      <rect x="80" y="10" width="240" height="130" rx="0" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
      {/* Penalty arc */}
      <path d="M 145 140 A 55 55 0 0 0 255 140" stroke="rgba(255,255,255,0.2)" strokeWidth="2" fill="none" />
      {/* Penalty spot */}
      <circle cx="200" cy="105" r="3" fill="rgba(255,255,255,0.2)" />
      {/* Halfway line */}
      <line x1="0" y1="492" x2="400" y2="492" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
      {/* Center circle (half) */}
      <path d="M 140 492 A 60 60 0 0 0 260 492" stroke="rgba(255,255,255,0.2)" strokeWidth="2" fill="none" />
    </svg>
  );
}

// ─── Pitch ───────────────────────────────────────────────────────

type FixtureMap = Record<string, { opponent: string; isHome: boolean }[]>;

function fixtureLabel(team: string, fixtureMap: FixtureMap): string {
  const fixs = fixtureMap[team];
  if (!fixs || fixs.length === 0) return team;
  return fixs.map((f) => `${f.isHome ? "" : ""}${f.opponent} (${f.isHome ? "H" : "A"})`).join(", ");
}

function PitchRow({ picks, onTap, selectedId, fixtureMap, showPrice }: { picks: Pick[]; onTap: (p: Pick) => void; selectedId: number | null; fixtureMap: FixtureMap; showPrice?: boolean }) {
  return (
    <div className="flex justify-center gap-2 my-1.5">
      {picks.map((p) => <PitchCard key={p.element} pick={p} onTap={onTap} selected={selectedId === p.element} fixtureMap={fixtureMap} showPrice={showPrice} />)}
    </div>
  );
}

function shirtUrl(teamCode: number, isGk: boolean): string {
  const suffix = isGk ? `_1-110.webp` : `-110.webp`;
  return `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${teamCode}${suffix}`;
}

function PitchCard({ pick, onTap, selected, dimmed, fixtureMap, showPrice }: { pick: Pick; onTap: (p: Pick) => void; selected?: boolean; dimmed?: boolean; fixtureMap: FixtureMap; showPrice?: boolean }) {
  const isEmpty = pick.element < 0;
  const fixture = isEmpty ? "" : fixtureLabel(pick.team, fixtureMap);
  const hasFixture = !isEmpty && fixture !== pick.team;
  const isGk = pick.element_type === 1;
  const posLabel = TYPE_LABEL[pick.element_type] ?? pick.name;

  if (isEmpty) {
    return (
      <button onClick={() => onTap(pick)} className="flex flex-col items-center gap-0.5 w-[72px] active:scale-95 transition-transform" style={{ opacity: dimmed ? 0.3 : 1 }}>
        <div className="w-14 h-14 rounded-xl flex flex-col items-center justify-center relative"
          style={{ background: "#0d1c12", border: "1.5px dashed #2e5c38" }}>
          <span style={{ color: "#2e5c38", fontSize: 18, lineHeight: 1 }}>+</span>
        </div>
        <div className="flex flex-col items-center w-full">
          <span className="text-[10px] font-bold text-center leading-tight rounded-t px-1 py-0.5 w-full truncate block"
            style={{ background: "#1e3025", color: "#4d8860", maxWidth: "72px" }}>
            {posLabel}
          </span>
          <span className="text-[9px] font-medium text-center leading-tight rounded-b px-1 py-0.5 w-full block"
            style={{ background: "#1a2820", color: "#3d6048", maxWidth: "72px" }}>
            Empty
          </span>
        </div>
      </button>
    );
  }

  return (
    <button onClick={() => onTap(pick)} className="flex flex-col items-center gap-0.5 w-[72px] active:scale-95 transition-transform">
      {showPrice && (pick.price ?? 0) > 0 && (
        <span className="text-[10px] font-bold" style={{ color: "#e5e5e5" }}>
          £{(pick.price ?? 0).toFixed(1)}m
        </span>
      )}
      <div className="w-14 h-14 rounded-xl flex items-center justify-center relative"
        style={{
          background: selected ? "#f59e0b22" : "#14532d",
          border: `1.5px solid ${selected ? "#f59e0b" : "#22763e"}`,
          opacity: dimmed ? 0.3 : 1,
        }}>
        {pick.teamCode > 0 ? (
          <img
            src={shirtUrl(pick.teamCode, isGk)}
            alt={pick.team}
            width={36}
            height={40}
            className="object-contain"
          />
        ) : (
          <span className="text-[10px] font-bold text-center leading-tight px-1" style={{ color: "#fff" }}>
            {pick.name}
          </span>
        )}
        {pick.is_captain && !selected && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center"
            style={{ background: "#000", color: "#f59e0b", border: "1.5px solid #f59e0b" }}>C</span>
        )}
        {pick.is_vice_captain && !selected && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center"
            style={{ background: "#000", color: "#888", border: "1.5px solid #888" }}>V</span>
        )}
        {selected && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center"
            style={{ background: "#f59e0b", color: "#000" }}>✓</span>
        )}
      </div>
      <div className="flex flex-col items-center w-full">
        <span className="text-[10px] font-bold text-center leading-tight rounded-t px-1 py-0.5 w-full truncate block"
          style={{ background: "#fff", color: "#000", maxWidth: "72px" }}>
          {pick.name}
        </span>
        <span className="text-[9px] font-medium text-center leading-tight rounded-b px-1 py-0.5 w-full truncate block"
          style={{ background: hasFixture ? "#f59e0b" : "#555", color: hasFixture ? "#000" : "#fff", maxWidth: "72px" }}>
          {fixture}
        </span>
      </div>
    </button>
  );
}

// ─── List ────────────────────────────────────────────────────────

function SquadRow({ pick, playerInfo, onSelect, selected, dimmed, fixtureMap }: { pick: Pick; playerInfo?: Player; onSelect: () => void; selected?: boolean; dimmed?: boolean; fixtureMap: FixtureMap }) {
  const color = TYPE_COLOR[pick.element_type];
  const isEmpty = pick.element < 0;
  const fixture = isEmpty ? "" : fixtureLabel(pick.team, fixtureMap);
  const hasFixture = !isEmpty && fixture !== pick.team;

  if (isEmpty) {
    return (
      <button onClick={onSelect} className="w-full text-left">
        <div className="rounded-xl px-3 py-2.5 flex items-center gap-3"
          style={{ background: "#0d1c12", border: "1px dashed #2e5c38", opacity: dimmed ? 0.5 : 1 }}>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded w-8 text-center" style={{ background: color + "22", color }}>
            {TYPE_LABEL[pick.element_type]}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: "#3d6048" }}>Empty slot</p>
          </div>
          <span style={{ color: "#2e5c38", fontSize: 20 }}>+</span>
        </div>
      </button>
    );
  }

  return (
    <button onClick={onSelect} className="w-full text-left">
      <div className="rounded-xl px-3 py-2.5 flex items-center gap-3 active:opacity-70"
        style={{ background: selected ? "#1a1500" : "#162030", border: `1px solid ${selected ? "#f59e0b" : "#1f1f1f"}`, opacity: dimmed ? 0.5 : 1 }}>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded w-8 text-center" style={{ background: color + "22", color }}>
          {TYPE_LABEL[pick.element_type]}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{pick.name}</p>
          <p className="text-[10px]" style={{ color: hasFixture ? "#f59e0b" : "#555" }}>{fixture}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold" style={{ color: "#f59e0b" }}>£{(pick.price ?? 0).toFixed(1)}m</p>
          <p className="text-[10px]" style={{ color: "#6688aa" }}>{playerInfo?.form ?? "—"} form</p>
        </div>
        <div className="text-right w-10">
          <p className="text-sm font-bold text-white">{pick.points ?? "—"}</p>
          <p className="text-[9px]" style={{ color: "#6688aa" }}>pts</p>
        </div>
      </div>
    </button>
  );
}

function PlayerRow({ player, fixtureMap }: { player: Player; fixtureMap: FixtureMap }) {
  const color = TYPE_COLOR[player.type];
  const injured = player.status === "i" || player.status === "d";
  const fixture = fixtureLabel(player.team, fixtureMap);
  const hasFixture = fixture !== player.team;

  return (
    <div className="rounded-xl px-3 py-2.5 flex items-center gap-3 active:opacity-70"
      style={{ background: "#1a2538", border: "1px solid #1e3050" }}>
      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded w-8 text-center flex-shrink-0" style={{ background: color + "22", color }}>
        {TYPE_LABEL[player.type]}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-white truncate">{player.name}</p>
          {injured && <span className="text-[9px]" style={{ color: "#ef4444" }}>⚠</span>}
        </div>
        <p className="text-[10px]" style={{ color: hasFixture ? "#f59e0b" : "#555" }}>{fixture}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xs font-bold" style={{ color: "#f59e0b" }}>£{player.price.toFixed(1)}m</p>
        <p className="text-[10px]" style={{ color: "#6688aa" }}>{player.form} form</p>
      </div>
      <div className="text-right w-10 flex-shrink-0">
        <p className="text-sm font-bold text-white">{player.points}</p>
        <p className="text-[9px]" style={{ color: "#6688aa" }}>pts</p>
      </div>
    </div>
  );
}
