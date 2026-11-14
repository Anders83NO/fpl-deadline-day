import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FPL Live Scores — FPL Deadline Day",
  description: "Live Premier League scores for every gameweek, with match minute, goals, cards and lineups. Free, no ads.",
  alternates: { canonical: "https://fpldeadlineday.com/live" },
};

export default function LiveLayout({ children }: { children: React.ReactNode }) {
  return children;
}
