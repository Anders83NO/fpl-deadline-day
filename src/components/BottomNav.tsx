"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/my-team", label: "My Team", icon: (active: boolean) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#f59e0b" : "#7799bb"} strokeWidth="1.8">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
    </svg>
  )},
  { href: "/transfers", label: "Plan", icon: (active: boolean) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#f59e0b" : "#7799bb"} strokeWidth="1.8">
      <path d="M7 16V4m0 0L3 8m4-4l4 4"/><path d="M17 8v12m0 0l4-4m-4 4l-4-4"/>
    </svg>
  )},
  { href: "/", label: "Live", icon: (active: boolean) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#f59e0b" : "#7799bb"} strokeWidth="1.8">
      <circle cx="12" cy="12" r="10"/><polygon points="10,8 16,12 10,16"/>
    </svg>
  )},
  { href: "/stats", label: "Stats", icon: (active: boolean) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#f59e0b" : "#7799bb"} strokeWidth="1.8">
      <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
    </svg>
  )},
  { href: "/settings", label: "Settings", icon: (active: boolean) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#f59e0b" : "#7799bb"} strokeWidth="1.8">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )},
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 flex h-[72px] z-50"
      style={{ background: "#0f1520", borderTop: "1px solid #1e3050" }}>
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex-1 flex flex-col items-center justify-center gap-1"
          >
            {tab.icon(active)}
            <span className="text-[10px] font-medium tracking-wide"
              style={{ color: active ? "#f59e0b" : "#7799bb" }}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
