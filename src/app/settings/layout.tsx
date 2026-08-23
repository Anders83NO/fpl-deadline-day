import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings — FPL Deadline Day",
  description: "Connect your FPL team ID, manage notifications and configure your FPL Deadline Day experience.",
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
