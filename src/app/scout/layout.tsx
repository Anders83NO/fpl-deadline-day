import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scout | FPL Deadline Day",
  description: "Discover the best Fantasy Premier League player picks. Scout top performers by form, fixtures and expected points to find your next transfer target.",
  keywords: ["FPL scout", "best FPL players", "FPL transfers in", "Fantasy Premier League tips"],
  openGraph: {
    title: "Scout | FPL Deadline Day",
    description: "Find the best FPL transfer targets based on form, fixtures and xPts.",
    url: "https://fpldeadlineday.com/scout",
    siteName: "FPL Deadline Day",
  },
};

export default function ScoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
