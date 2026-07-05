import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Team | FPL Deadline Day",
  description: "View your current Fantasy Premier League squad, check player stats and plan your lineup before the next gameweek deadline.",
  keywords: ["FPL my team", "Fantasy Premier League squad", "FPL lineup", "FPL tool"],
  openGraph: {
    title: "My Team | FPL Deadline Day",
    description: "View your FPL squad and plan your lineup before the deadline.",
    url: "https://fpldeadlineday.com/my-team",
    siteName: "FPL Deadline Day",
  },
};

export default function MyTeamLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
