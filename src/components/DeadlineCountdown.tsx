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
    <div className="flex items-center gap-1.5">
      <span className="text-[9px] uppercase tracking-wider" style={{ color: "#6688aa" }}>
        GW{nextGw}
      </span>
      <span
        className="text-[11px] font-bold tabular-nums"
        style={{ color: isUrgent ? "#ef4444" : "#f59e0b" }}
      >
        {remaining}
      </span>
    </div>
  );
}
