import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Transfer Planner | FPL Deadline Day",
  description: "Plan your Fantasy Premier League transfers before the deadline. Track GW history, set your captain and chip strategy — all in one place.",
  keywords: ["FPL transfer planner", "Fantasy Premier League transfers", "FPL tool", "FPL deadline"],
  openGraph: {
    title: "Transfer Planner | FPL Deadline Day",
    description: "Plan your FPL transfers before the deadline. Free tool for Fantasy Premier League managers.",
    url: "https://fpldeadlineday.com/transfers",
    siteName: "FPL Deadline Day",
  },
};

export default function TransfersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
