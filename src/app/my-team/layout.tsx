import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Team — FPL Deadline Day",
  description: "View your current FPL squad, captain, vice-captain and bench. Check injury status and player form for your Fantasy Premier League team.",
};

export default function MyTeamLayout({ children }: { children: React.ReactNode }) {
  return children;
}
