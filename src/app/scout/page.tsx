"use client";

import { useEffect, useState } from "react";

// ─── Season Intel (static, manually updated) ────────────────────────────────

const NEW_MANAGERS = [
  {
    club: "Chelsea",
    manager: "Xabi Alonso",
    flag: "🇪🇸",
    style: "Possession-based, tactical flexibility. Won Bundesliga with Leverkusen undefeated.",
    fplNote: "Big squad rotation expected. Wait for settled XI.",
  },
  {
    club: "Liverpool",
    manager: "Andoni Iraola",
    flag: "🇪🇸",
    style: "Intense high press, aggressive gegenpressing. Proved himself at Bournemouth.",
    fplNote: "Attackers and press-triggering midfielders likely to shine.",
  },
  {
    club: "Manchester City",
    manager: "Enzo Maresca",
    flag: "🇮🇹",
    style: "Possession-based, structured build-up. Similar to Guardiola — succeeded at Leicester.",
    fplNote: "System players carry over; watch for who fits Maresca's mould.",
  },
  {
    club: "Crystal Palace",
    manager: "Pierre Sage",
    flag: "🇫🇷",
    style: "Attack-minded, won Conference League with Palace. Promoted Lyon to CL.",
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
    club: "Ipswich Town",
    manager: "Gary O'Neill",
    flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    style: "Defensive structure, pragmatic. Focused on survival and shape.",
    fplNote: "Avoid Ipswich assets early — structure and first XI unclear.",
  },
  {
    club: "Fulham",
    manager: "TBC",
    flag: "❓",
    style: "No manager appointed yet.",
    fplNote: "Avoid Fulham assets until appointment and style is clear.",
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
        <span className="text-base">🗞️</span>
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
            <span className="text-sm">🧑‍💼</span>
            <span className="text-sm font-semibold text-white">7 new managers</span>
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
            <span className="text-sm">🌍</span>
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
            <span className="text-sm">🗓️</span>
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
  emoji,
  title,
  subtitle,
  children,
}: {
  emoji: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-5">
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-base">{emoji}</span>
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
            emoji="👑"
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
            emoji="©️"
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
        emoji="🎯"
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
      <Section emoji="🔥" title="Hot Transfers" subtitle="Most transferred in this gameweek">
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
        emoji="💎"
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
        emoji="⚡"
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
      <Section emoji="💰" title="Best Value" subtitle="Most points per £ this season">
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
        emoji="🛡️"
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
      <Section emoji="📈" title="Price Risers" subtitle="Rising in price this gameweek">
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
      <Section emoji="📉" title="Price Fallers" subtitle="Falling in price this gameweek">
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
