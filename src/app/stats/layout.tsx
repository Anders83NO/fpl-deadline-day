import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Player Stats & Scout — FPL Deadline Day",
  description: "Sort and search all FPL players by price, form, xPts and total points. Compare players side by side and scout differentials, captain picks and price risers.",
};

export default function StatsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
