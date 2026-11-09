import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Called by Vercel Cron every other day so the free-tier Supabase project
// never hits 7 days of inactivity and gets paused.
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabaseAdmin
    .from("gw_plans")
    .select("id", { count: "exact", head: true });

  if (error) {
    console.error("keep-alive error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}
