import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch next GW deadline from FPL API
    const fplRes = await fetch("https://fantasy.premierleague.com/api/bootstrap-static/", { cache: "no-store" });
    const fplData = await fplRes.json();

    const now = new Date();
    const upcomingEvent = fplData.events?.find((e: { finished: boolean; deadline_time: string }) =>
      !e.finished && new Date(e.deadline_time) > now
    );

    if (!upcomingEvent) {
      return NextResponse.json({ message: "No upcoming deadline found" });
    }

    const deadline = new Date(upcomingEvent.deadline_time);
    const hoursUntil = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    const gwName = `GW${upcomingEvent.id}`;
    const deadlineStr = deadline.toLocaleString("en-GB", {
      weekday: "short", day: "numeric", month: "short",
      hour: "2-digit", minute: "2-digit", timeZone: "Europe/London"
    });

    // Only send at ~24h before deadline (within a 1h window)
    const is24h = hoursUntil >= 23 && hoursUntil < 25;

    if (!is24h) {
      return NextResponse.json({ message: `No reminder needed. ${hoursUntil.toFixed(1)}h until deadline.` });
    }

    const timeLabel = "24 hours";

    // Fetch all users from Supabase auth
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) throw error;

    const emails = users.map((u) => u.email).filter(Boolean) as string[];
    if (emails.length === 0) {
      return NextResponse.json({ message: "No users to notify" });
    }

    // Send emails
    const results = await Promise.allSettled(
      emails.map((email) =>
        resend.emails.send({
          from: "FPL Deadline Day <reminders@fpldeadlineday.com>",
          to: email,
          subject: `⏰ ${gwName} deadline in ${timeLabel}`,
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #0f1520; color: #f0f0f0; padding: 32px; border-radius: 16px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <span style="font-size: 40px;">⚽</span>
                <h1 style="color: #f59e0b; font-size: 22px; margin: 8px 0 0;">FPL Deadline Day</h1>
              </div>
              <h2 style="color: #ffffff; font-size: 18px; margin-bottom: 8px;">
                ${gwName} deadline in ${timeLabel}
              </h2>
              <p style="color: #6688aa; font-size: 14px; margin-bottom: 24px;">
                Deadline: <strong style="color: #f0f0f0;">${deadlineStr} (UK time)</strong>
              </p>
              <p style="color: #c8daf0; font-size: 14px; margin-bottom: 24px;">
                Don't forget to make your transfers and set your captain before the deadline!
              </p>
              <a href="https://www.fpldeadlineday.com"
                style="display: block; background: #f59e0b; color: #000; text-align: center; padding: 14px; border-radius: 10px; font-weight: bold; font-size: 14px; text-decoration: none;">
                Open FPL Deadline Day →
              </a>
              <p style="color: #3d5570; font-size: 11px; text-align: center; margin-top: 24px;">
                You're receiving this because you have an account on fpldeadlineday.com.
              </p>
            </div>
          `,
        })
      )
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return NextResponse.json({ success: true, sent, failed, gw: gwName, timeLabel });
  } catch (err) {
    console.error("Deadline reminder error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
