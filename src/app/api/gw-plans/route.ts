import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const { userId, gw, season, transferPlan, captainPlan, chipPlan } = await req.json();
  if (!userId || !gw) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("gw_plans")
    .upsert(
      { user_id: userId, gw, season, transfer_plan: transferPlan, captain_plan: captainPlan, chip_plan: chipPlan, saved_at: new Date().toISOString() },
      { onConflict: "user_id,gw,season" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("gw_plans")
    .select("*")
    .eq("user_id", userId)
    .order("gw", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ plans: data });
}
