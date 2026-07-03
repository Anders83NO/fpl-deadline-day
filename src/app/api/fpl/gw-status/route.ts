import { NextResponse } from "next/server";

// Returns dynamic GW info based on FPL bootstrap-static:
// - currentGw: the GW that is currently active / most recent
// - lastLockedGw: the last GW whose deadline has passed
// - firstPlanGw: the next GW to plan for
// - season: e.g. "2025/26"

export async function GET() {
  try {
    const res = await fetch("https://fantasy.premierleague.com/api/bootstrap-static/", {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("FPL API error");
    const data = await res.json();

    const events: Array<{
      id: number;
      deadline_time: string;
      is_current: boolean;
      is_next: boolean;
      finished: boolean;
    }> = data.events ?? [];

    const now = new Date();

    // Find all GWs whose deadline has passed
    const lockedEvents = events.filter(
      (e) => new Date(e.deadline_time) < now
    );

    // The last GW with a passed deadline
    const lastLockedGw =
      lockedEvents.length > 0
        ? lockedEvents[lockedEvents.length - 1].id
        : null;

    // Current GW (is_current flag, or fall back to last locked)
    const currentEvent = events.find((e) => e.is_current);
    const currentGw = currentEvent?.id ?? lastLockedGw ?? 1;

    // First GW to plan = next after last locked, wraps to 1 if season over
    const totalGws = events.length;
    const firstPlanGw =
      lastLockedGw !== null
        ? lastLockedGw < totalGws
          ? lastLockedGw + 1
          : 1
        : 1;

    // Season string from first and last event years
    const firstYear = new Date(events[0]?.deadline_time ?? "").getFullYear();
    const lastYear = new Date(
      events[events.length - 1]?.deadline_time ?? ""
    ).getFullYear();
    const season =
      firstYear && lastYear
        ? `${firstYear}/${String(lastYear).slice(-2)}`
        : "";

    // viewGw for My Team: show the last GW whose deadline has passed
    const viewGw = lastLockedGw ?? currentGw;

    // Next deadline for countdown
    const nextEvent = events.find((e) => new Date(e.deadline_time) > now);
    const nextDeadline = nextEvent?.deadline_time ?? null;
    const nextGw = nextEvent?.id ?? null;

    return NextResponse.json({
      currentGw,
      lastLockedGw,
      firstPlanGw,
      viewGw,
      nextDeadline,
      nextGw,
      totalGws,
      season,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch GW status" }, { status: 500 });
  }
}
