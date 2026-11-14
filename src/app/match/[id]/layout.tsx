import type { Metadata } from "next";

const BASE = "https://v3.football.api-sports.io";

// Per-match title and description, e.g. "Everton 3–1 Coventry — Premier League live".
// Uses the same 60s server cache as the match API route, so it adds no extra API-Football load.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const fallback: Metadata = { title: "Match — FPL Deadline Day" };
  if (!/^\d+$/.test(id)) return fallback;

  try {
    const res = await fetch(`${BASE}/fixtures?id=${id}`, {
      headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY! },
      next: { revalidate: 60 },
    });
    if (!res.ok) return fallback;
    const f = (await res.json()).response?.[0];
    if (!f) return fallback;

    const home = f.teams.home.name;
    const away = f.teams.away.name;
    const status = f.fixture.status.short as string;
    const started = !["NS", "TBD", "PST"].includes(status);
    const score = started ? `${f.goals.home ?? 0}–${f.goals.away ?? 0}` : "vs";
    const date = new Date(f.fixture.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/London" });

    return {
      title: `${home} ${score} ${away} — Premier League live | FPL Deadline Day`,
      description: started
        ? `${home} ${score} ${away} (${date}). Goals, cards, substitutions and lineups on a pitch view.`
        : `${home} vs ${away}, ${date}. Kick-off time, lineups and live score updates.`,
      alternates: { canonical: `https://fpldeadlineday.com/match/${id}` },
    };
  } catch {
    return fallback;
  }
}

export default function MatchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
