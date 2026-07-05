import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings | FPL Deadline Day",
  description: "Manage your FPL Deadline Day preferences — set your team ID, timezone and notification settings for gameweek deadline reminders.",
  keywords: ["FPL settings", "FPL deadline reminders", "Fantasy Premier League notifications"],
  openGraph: {
    title: "Settings | FPL Deadline Day",
    description: "Manage your FPL Deadline Day preferences and notification settings.",
    url: "https://fpldeadlineday.com/settings",
    siteName: "FPL Deadline Day",
  },
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
