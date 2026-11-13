"use client";

import { useState, useEffect } from "react";

export default function DeadlineCountdown() {
  const [deadline, setDeadline] = useState<string | null>(null);
  const [nextGw, setNextGw] = useState<number | null>(null);
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/fpl/gw-status");
        const data = await res.json();
        setDeadline(data.nextDeadline ?? null);
        setNextGw(data.nextGw ?? null);
      } catch { /* silent */ }
    }
    load();
  }, []);

  useEffect(() => {
    if (!deadline) return;
    function tick() {
      const now = new Date().getTime();
      const end = new Date(deadline!).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setRemaining("LOCKED");
        return;
      }

      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);

      if (days > 0) {
        setRemaining(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setRemaining(`${hours}h ${mins}m`);
      } else {
        const secs = Math.floor((diff % 60000) / 1000);
        setRemaining(`${mins}m ${secs}s`);
      }
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (!deadline || !remaining) return null;

  const isUrgent = deadline && (new Date(deadline).getTime() - Date.now()) < 3600000;

  return (
    <div className="flex items-center gap-2 h-8 pl-2.5 pr-3 rounded-full"
      style={{
        background: isUrgent ? "rgba(239,68,68,0.1)" : "#162030",
        border: `1px solid ${isUrgent ? "rgba(239,68,68,0.35)" : "#1e3050"}`,
      }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={isUrgent ? "#ef4444" : "#6688aa"} strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2" /><path d="M9 2h6" />
      </svg>
      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#6688aa" }}>
        GW{nextGw}
      </span>
      <span
        className="text-xs font-bold tabular-nums"
        style={{ color: isUrgent ? "#ef4444" : "#f59e0b" }}
      >
        {remaining}
      </span>
    </div>
  );
}
