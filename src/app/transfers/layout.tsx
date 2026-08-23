import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Transfer Planner — FPL Deadline Day",
  description: "Plan your FPL transfers gameweek by gameweek. See points hits, bank balance, and squad value. Free Fantasy Premier League transfer tool.",
};

export default function TransfersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
