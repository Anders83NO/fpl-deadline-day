"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

const SEASON = "2024/25";

export function useGwSnapshot() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    async function checkAndSnapshot() {
      try {
        const res = await fetch("https://fantasy.premierleague.com/api/bootstrap-static/", { cache: "no-store" });
        const data = await res.json();

        const currentGw = data.events?.find((e: { is_current: boolean }) => e.is_current)?.id
          ?? data.events?.find((e: { is_next: boolean }) => e.is_next)?.id;

        if (!currentGw) return;

        const lastGw = parseInt(localStorage.getItem("fpl_last_gw") ?? "0");

        if (currentGw > lastGw && lastGw > 0) {
          // GW has changed — snapshot the previous GW's plan
          const transferPlan = JSON.parse(localStorage.getItem("fpl_transfer_plan") ?? "{}");
          const captainPlan = JSON.parse(localStorage.getItem("fpl_captain_plan") ?? "{}");
          const chipPlan = JSON.parse(localStorage.getItem("fpl_chip_plan") ?? "{}");

          await fetch("/api/gw-plans", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user!.id,
              gw: lastGw,
              season: SEASON,
              transferPlan,
              captainPlan,
              chipPlan,
            }),
          });

          // Clear plan for new GW
          localStorage.removeItem("fpl_transfer_plan");
          localStorage.removeItem("fpl_captain_plan");
          localStorage.removeItem("fpl_chip_plan");
          localStorage.removeItem("fpl_lineup_swaps");
        }

        localStorage.setItem("fpl_last_gw", String(currentGw));
      } catch {
        // Silently fail — not critical
      }
    }

    checkAndSnapshot();
  }, [user]);
}
