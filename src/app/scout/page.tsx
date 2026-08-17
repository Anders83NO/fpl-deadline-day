// Redirect to /stats — Scout is now a tab inside Stats
import { redirect } from "next/navigation";
export default function ScoutRedirect() { redirect("/stats"); }

// ─── Old code below (kept for reference, never reached) ──────────────────────
// @ts-nocheck
"use client";

import { useEffect, useState } from "react";

const IC = ({ d, vb = "0 0 24 24" }: { d: string; vb?: string }) => (
  <svg width="15" height="15" viewBox={vb} fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d={d} />
  </svg>
);

const ICONS = {
  intel:    <IC d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2M18 14h-8M15 18h-5M10 6h8v4h-8z" />,
  managers: <IC d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />,
  europe:   <IC d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />,
  calendar: <IC d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />,
  star:     <IC d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />,
  target:   <IC d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />,
  fire:     <IC d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 0 1-7 7 7 7 0 0 1-7-7c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />,
  diamond:  <IC d="M2.7 10.3a2.4 2.4 0 0 0 0 3.41l7.56 7.57a2.4 2.4 0 0 0 3.4 0l7.57-7.57a2.4 2.4 0 0 0 0-3.4L13.67 2.72a2.4 2.4 0 0 0-3.41 0z" />,
  bolt:     <IC d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
  money:    <IC d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM12 6v2M12 16v2M8 12h8M8 10h1a3 3 0 0 1 0 6H8" />,
  shield:   <IC d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  up:       <IC d="M3 17l4-8 4 4 4-6 4 8" />,
  down:     <IC d="M3 7l4 8 4-4 4 6 4-8" />,
};

// ─── Season Intel (static, manually updated) ────────────────────────────────

const NEW_MANAGERS = [
  {
    club: "Chelsea",
    manager: "Xabi Alonso",
    flag: "🇪🇸",
    style: "Possession-based, tactical flexibility. Won Bundesliga with Leverkusen undefeated.",
    fplNote: "Big squad rotation expected early. Wait for settled XI before investing.",
  },
  {
    club: "Liverpool",
    manager: "Andoni Iraola",
    flag: "🇪🇸",
    style: "Intense high press, aggressive gegenpressing. Made his name at Bournemouth.",
    fplNote: "Press-triggering midfielders and high-energy forwards likely to shine.",
  },
  {
    club: "Manchester City",
    manager: "Enzo Maresca",
    flag: "🇮🇹",
    style: "Possession-based, structured build-up. Won PL title with Chelsea in 24/25.",
    fplNote: "System players could carry over. Watch who fits Maresca's mould.",
  },
  {
    club: "Newcastle",
    manager: "Matthias Jaissle",
    flag: "🇩🇪",
    style: "High press, compact 4-3-3. Won Saudi League with Al Ahli. RB-school coach.",
    fplNote: "Unknown quantity in PL. Avoid Newcastle assets until system is clear.",
  },
  {
    club: "Nott'm Forest",
    manager: "Oliver Glasner",
    flag: "🇦🇹",
    style: "Intense pressing, dynamic attacking play. Won FA Cup with Crystal Palace.",
    fplNote: "Forest attacking players could be undervalued given new ambition.",
  },
  {
    club: "Crystal Palace",
    manager: "Pierre Sage",
    flag: "🇫🇷",
    style: "Attack-minded, won Conference League with Palace. Previously promoted Lyon to CL.",
    fplNote: "Palace assets could be undervalued early in the season.",
  },
  {
    club: "Bournemouth",
    manager: "Marco Rose",
    flag: "🇩🇪",
    style: "Gegenpressing 4-2-3-1, high tempo. Experience from RB Leipzig & Dortmund.",
    fplNote: "High-press style suits physical forwards and box-to-box midfielders.",
  },
  {
    club: "Fulham",
    manager: "Álvaro Arbeloa",
    flag: "🇪🇸",
    style: "Former Real Madrid defender. Coached Real Madrid Castilla. First senior PL job.",
    fplNote: "Big unknown. Avoid Fulham assets until style and first XI becomes clear.",
  },
  {
    club: "Ipswich",
    manager: "Gary O'Neil",
    flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    style: "Defensive structure, pragmatic. Solid record at Wolves and Bournemouth.",
    fplNote: "Ipswich fighting relegation — avoid assets unless clear first-team role.",
  },
];

const EUROPEAN_CLUBS = [
  {
    competition: "Champions League",
    color: "#3b82f6",
    clubs: [
      { name: "Arsenal", note: "Top seeds, deep run expected" },
      { name: "Manchester City", note: "New manager + UCL = rotation risk" },
      { name: "Manchester United", note: "Europa League last season, now UCL" },
      { name: "Aston Villa", note: "Building on last season's run" },
      { name: "Liverpool", note: "New manager Iraola + UCL from day 1" },
    ],
  },
  {
    competition: "Europa League",
    color: "#f59e0b",
    clubs: [
      { name: "Bournemouth", note: "First ever European campaign" },
      { name: "Crystal Palace", note: "As Conference League winners → UEL" },
      { name: "Sunderland", note: "Historic return to European football" },
    ],
  },
  {
    competition: "Conference League",
    color: "#22d3ee",
    clubs: [
      { name: "Brighton", note: "Smaller squad depth, rotation likely" },
    ],
  },
];

const INTERNATIONAL_BREAKS = [
  {
    label: "Autumn (merged Sep/Oct)",
    after: "GW5",
    before: "GW6",
    dates: "~20 Sep – 10 Oct 2026",
    duration: "3 weeks",
    note: "Sep & Oct windows merged — longest break of the season",
  },
  {
    label: "November",
    after: "GW10",
    before: "GW11",
    dates: "~7 – 21 Nov 2026",
    duration: "2 weeks",
    note: "Standard international window",
  },
  {
    label: "March / Spring",
    after: "GW28",
    before: "GW29",
    dates: "~20 Mar – 10 Apr 2027",
    duration: "3 weeks",
    note: "Mid-season break — good window for DGW planning",
  },
];

function SeasonIntel() {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const toggle = (key: string) => setOpenSection(v => v === key ? null : key);

  return (
    <section className="mb-6">
      <div className="flex items-baseline gap-2 mb-2">
        {ICONS.intel}
        <div>
          <h2 className="text-sm font-bold text-white">Season Intel 2026/27</h2>
          <p className="text-[10px]" style={{ color: "#6688aa" }}>
            Key info for the new season · Updated continuously
          </p>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: "#162030", border: "1px solid #1e3050" }}>

        {/* New Managers */}
        <button
          className="w-full flex items-center justify-between px-4 py-3"
          onClick={() => toggle("managers")}
          style={{ borderBottom: "1px solid #1a2a40" }}
        >
          <div className="flex items-center gap-2">
            {ICONS.managers}
            <span className="text-sm font-semibold text-white">{NEW_MANAGERS.length} new managers</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: "#ef444422", color: "#ef4444" }}>
              OBS
            </span>
          </div>
          <span style={{ color: "#6688aa", fontSize: 12 }}>{openSection === "managers" ? "▲" : "▼"}</span>
        </button>
        {openSection === "managers" && (
          <div>
            {NEW_MANAGERS.map((m, i) => (
              <div key={m.club} className="px-4 py-3" style={{ borderBottom: i < NEW_MANAGERS.length - 1 ? "1px solid #1a2a40" : "none" }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs">{m.flag}</span>
                  <span className="text-sm font-bold text-white">{m.manager}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#1a2538", color: "#6688aa" }}>{m.club}</span>
                </div>
                <p className="text-[11px] mb-1" style={{ color: "#99bbdd" }}>{m.style}</p>
                <p className="text-[10px]" style={{ color: "#f59e0b" }}>FPL: {m.fplNote}</p>
              </div>
            ))}
          </div>
        )}

        {/* European Clubs */}
        <button
          className="w-full flex items-center justify-between px-4 py-3"
          onClick={() => toggle("europe")}
          style={{ borderBottom: "1px solid #1a2a40" }}
        >
          <div className="flex items-center gap-2">
            {ICONS.europe}
            <span className="text-sm font-semibold text-white">9 clubs in Europe</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: "#a78bfa22", color: "#a78bfa" }}>
              Rotation
            </span>
          </div>
          <span style={{ color: "#6688aa", fontSize: 12 }}>{openSection === "europe" ? "▲" : "▼"}</span>
        </button>
        {openSection === "europe" && (
          <div>
            {EUROPEAN_CLUBS.map((comp, ci) => (
              <div key={comp.competition} className="px-4 py-3" style={{ borderBottom: ci < EUROPEAN_CLUBS.length - 1 ? "1px solid #1a2a40" : "none" }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: comp.color }}>
                  {comp.competition}
                </p>
                <div className="space-y-1.5">
                  {comp.clubs.map(club => (
                    <div key={club.name} className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white w-32 flex-shrink-0">{club.name}</span>
                      <span className="text-[10px]" style={{ color: "#6688aa" }}>{club.note}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* International Breaks */}
        <button
          className="w-full flex items-center justify-between px-4 py-3"
          onClick={() => toggle("breaks")}
        >
          <div className="flex items-center gap-2">
            {ICONS.calendar}
            <span className="text-sm font-semibold text-white">International breaks</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: "#22d3ee22", color: "#22d3ee" }}>
              3 st
            </span>
          </div>
          <span style={{ color: "#6688aa", fontSize: 12 }}>{openSection === "breaks" ? "▲" : "▼"}</span>
        </button>
        {openSection === "breaks" && (
          <div>
            {INTERNATIONAL_BREAKS.map((b, i) => (
              <div key={b.label} className="px-4 py-3" style={{ borderTop: "1px solid #1a2a40" }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-white">{b.label}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: "#1a2538", color: "#f59e0b" }}>
                    {b.duration}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: "#0f1520", color: "#6688aa" }}>
                    {b.after}
                  </span>
                  <span style={{ color: "#3d5570", fontSize: 10 }}>→ break →</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: "#0f1520", color: "#6688aa" }}>
                    {b.before}
                  </span>
                  <span className="text-[10px]" style={{ color: "#6688aa" }}>({b.dates})</span>
                </div>
                <p className="text-[10px]" style={{ color: "#6688aa" }}>{b.note}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

const TYPE_LABEL: Record<number, string> = { 1: "GK", 2: "DEF", 3: "MID", 4: "FWD" };
const TYPE_COLOR: Record<number, string> = {
  1: "#f59e0b",
  2: "#22d3ee",
  3: "#a78bfa",
  4: "#4ade80",
};

interface ScoutPlayer {
  id: number;
  name: string;
  team: string;
  type: number;
  epNext: number;
  form: number;
  ownership: number;
  transfersIn: number;
  transfersOut: number;
  priceChange: number;
  price: number;
  totalPoints: number;
  ppg: number;
  valueSeason: number;
  ictIndex: number;
  influence: number;
  creativity: number;
  threat: number;
  chanceNext: number | null;
  news: string;
  fdr: number;
}

interface ScoutData {
  currentGw: number;
  captainPicks: ScoutPlayer[];
  hotTransfersIn: ScoutPlayer[];
  differentials: ScoutPlayer[];
  priceRisers: ScoutPlayer[];
  priceFallers: ScoutPlayer[];
  ictLeaders: ScoutPlayer[];
  bestValue: ScoutPlayer[];
  easyFixtures: ScoutPlayer[];
}

function formatTransfers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}

function PlayerRow({
  player,
  stat,
  statLabel,
}: {
  player: ScoutPlayer;
  stat: string;
  statLabel: string;
}) {
  const color = TYPE_COLOR[player.type];
  const injured = player.chanceNext !== null && player.chanceNext < 75;

  return (
    <div
      className="flex items-center gap-3 px-4 py-3"
      style={{ borderTop: "1px solid #1a2a40" }}
    >
      <span
        className="text-[9px] font-bold px-1.5 py-0.5 rounded w-8 text-center flex-shrink-0"
        style={{ background: color + "22", color }}
      >
        {TYPE_LABEL[player.type]}
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-white truncate">{player.name}</p>
          {injured && (
            <span className="text-[9px]" style={{ color: "#ef4444" }}>
              ⚠
            </span>
          )}
        </div>
        <p className="text-[10px]" style={{ color: "#6688aa" }}>
          {player.team} · £{player.price.toFixed(1)}m · {player.ownership.toFixed(1)}%
        </p>
      </div>

      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold" style={{ color: "#f59e0b" }}>
          {stat}
        </p>
        <p className="text-[10px]" style={{ color: "#6688aa" }}>
          {statLabel}
        </p>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <div>
          <h2 className="text-sm font-bold text-white">{title}</h2>
          {subtitle && (
            <p className="text-[10px]" style={{ color: "#6688aa" }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "#162030", border: "1px solid #1e3050" }}
      >
        {children}
      </div>
    </section>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <p className="px-4 py-4 text-sm" style={{ color: "#6688aa" }}>
      {text}
    </p>
  );
}

interface ElitePlayer {
  id: number;
  name: string;
  team: string;
  type: number;
  count: number;
  outOf: number;
}

interface EliteData {
  currentGw: number;
  managersAnalyzed: number;
  mostOwned: ElitePlayer[];
  captainChoices: ElitePlayer[];
}

export default function ScoutPage() {
  const [data, setData] = useState<ScoutData | null>(null);
  const [eliteData, setEliteData] = useState<EliteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [scoutRes, eliteRes] = await Promise.all([
          fetch("/api/fpl/scout"),
          fetch("/api/fpl/elite"),
        ]);
        if (!scoutRes.ok) throw new Error();
        setData(await scoutRes.json());
        if (eliteRes.ok) setEliteData(await eliteRes.json());
      } catch {
        setError(true);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div
          className="w-5 h-5 rounded-full border-2 animate-spin"
          style={{ borderColor: "#f59e0b", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-10 text-center">
        <p className="text-sm" style={{ color: "#6688aa" }}>
          Could not load scout data. Check your connection and try again.
        </p>
      </div>
    );
  }

  const seasonOver = data.currentGw >= 38;
  const nextGw = seasonOver ? 38 : data.currentGw + 1;

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-10">
      {/* Header */}
      <header className="mb-6">
        <p
          className="text-[11px] font-semibold tracking-[0.15em] uppercase"
          style={{ color: "#f59e0b" }}
        >
          Scout
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-white mt-0.5">
          {seasonOver ? "Season Review" : `GW${nextGw} Tips`}
        </h1>
        <p className="text-xs mt-1" style={{ color: "#6688aa" }}>
          {seasonOver ? "Final stats from this season" : "Based on FPL data · Updated automatically"}
        </p>
      </header>

      {/* Season Intel */}
      <SeasonIntel />

      {/* Elite 10 */}
      {eliteData && (
        <>
          <Section
            icon={ICONS.star}
            title="Elite 10 — Template"
            subtitle={`Most owned by world top ${eliteData.managersAnalyzed} · GW${eliteData.currentGw}`}
          >
            {eliteData.mostOwned.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-2.5" style={{ borderTop: "1px solid #1a2a40" }}>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded w-8 text-center flex-shrink-0"
                  style={{ background: (TYPE_COLOR[p.type] ?? "#888") + "22", color: TYPE_COLOR[p.type] ?? "#888" }}>
                  {TYPE_LABEL[p.type]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                  <p className="text-[10px]" style={{ color: "#6688aa" }}>{p.team}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold" style={{ color: "#f59e0b" }}>{p.count}/{p.outOf}</p>
                  <p className="text-[10px]" style={{ color: "#6688aa" }}>own</p>
                </div>
              </div>
            ))}
          </Section>

          <Section
            icon={ICONS.star}
            title="Elite Captain"
            subtitle={`Who the top ${eliteData.managersAnalyzed} are captaining`}
          >
            {eliteData.captainChoices.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-2.5" style={{ borderTop: "1px solid #1a2a40" }}>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded w-8 text-center flex-shrink-0"
                  style={{ background: "#f59e0b22", color: "#f59e0b" }}>
                  C
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                  <p className="text-[10px]" style={{ color: "#6688aa" }}>{p.team}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold" style={{ color: "#f59e0b" }}>{p.count}/{p.outOf}</p>
                  <p className="text-[10px]" style={{ color: "#6688aa" }}>captained</p>
                </div>
              </div>
            ))}
          </Section>
        </>
      )}

      {/* Captain Picks */}
      <Section
        icon={ICONS.target}
        title="Captain Picks"
        subtitle={seasonOver ? "Top performers this season" : `Highest expected points for GW${nextGw}`}
      >
        {data.captainPicks.length ? (
          data.captainPicks.map((p) => (
            <PlayerRow key={p.id} player={p} stat={p.epNext.toFixed(1)} statLabel="xPts" />
          ))
        ) : (
          <EmptyRow text="No captain picks available." />
        )}
      </Section>

      {/* Hot Transfers */}
      <Section icon={ICONS.fire} title="Hot Transfers" subtitle="Most transferred in this gameweek">
        {data.hotTransfersIn.length ? (
          data.hotTransfersIn.map((p) => (
            <PlayerRow
              key={p.id}
              player={p}
              stat={`+${formatTransfers(p.transfersIn)}`}
              statLabel="transfers in"
            />
          ))
        ) : (
          <EmptyRow text="No transfer data yet." />
        )}
      </Section>

      {/* Differentials */}
      <Section
        icon={ICONS.diamond}
        title="Differentials"
        subtitle="High xPts · Under 15% ownership"
      >
        {data.differentials.length ? (
          data.differentials.map((p) => (
            <PlayerRow
              key={p.id}
              player={p}
              stat={p.epNext.toFixed(1)}
              statLabel={`${p.ownership.toFixed(1)}% owned`}
            />
          ))
        ) : (
          <EmptyRow text="No differentials found for next GW." />
        )}
      </Section>

      {/* ICT Leaders */}
      <Section
        icon={ICONS.bolt}
        title="ICT Leaders"
        subtitle="Influence · Creativity · Threat (Opta via FPL)"
      >
        {data.ictLeaders.length ? (
          data.ictLeaders.map((p) => (
            <PlayerRow
              key={p.id}
              player={p}
              stat={p.ictIndex.toFixed(1)}
              statLabel="ICT index"
            />
          ))
        ) : (
          <EmptyRow text="No ICT data available." />
        )}
      </Section>

      {/* Best Value */}
      <Section icon={ICONS.money} title="Best Value" subtitle="Most points per £ this season">
        {data.bestValue.length ? (
          data.bestValue.map((p) => (
            <PlayerRow
              key={p.id}
              player={p}
              stat={p.valueSeason.toFixed(1)}
              statLabel="value score"
            />
          ))
        ) : (
          <EmptyRow text="No value data available." />
        )}
      </Section>

      {/* Easy Fixtures */}
      <Section
        icon={ICONS.shield}
        title="Easy Fixtures"
        subtitle="Best xPts · FDR ≤ 2.5 next 3 GWs"
      >
        {data.easyFixtures.length ? (
          data.easyFixtures.map((p) => (
            <PlayerRow
              key={p.id}
              player={p}
              stat={p.epNext.toFixed(1)}
              statLabel={`avg FDR ${p.fdr.toFixed(1)}`}
            />
          ))
        ) : (
          <EmptyRow text="No easy fixture data available." />
        )}
      </Section>

      {/* Price Risers */}
      <Section icon={ICONS.up} title="Price Risers" subtitle="Rising in price this gameweek">
        {data.priceRisers.length ? (
          data.priceRisers.map((p) => (
            <PlayerRow
              key={p.id}
              player={p}
              stat={`+£${(p.priceChange / 10).toFixed(1)}m`}
              statLabel={`now £${p.price.toFixed(1)}m`}
            />
          ))
        ) : (
          <EmptyRow text="No price risers right now." />
        )}
      </Section>

      {/* Price Fallers */}
      <Section icon={ICONS.down} title="Price Fallers" subtitle="Falling in price this gameweek">
        {data.priceFallers.length ? (
          data.priceFallers.map((p) => (
            <PlayerRow
              key={p.id}
              player={p}
              stat={`-£${Math.abs(p.priceChange / 10).toFixed(1)}m`}
              statLabel={`now £${p.price.toFixed(1)}m`}
            />
          ))
        ) : (
          <EmptyRow text="No price fallers right now." />
        )}
      </Section>
    </div>
  );
}
