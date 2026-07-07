import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "andersstenbergw@gmail.com";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { userEmail } = await req.json();
  if (userEmail !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const now = new Date();
  const day7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const day30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const totalUsers = users.length;
  const newLast7 = users.filter(u => new Date(u.created_at) > day7).length;
  const activeLast30 = users.filter(u => u.last_sign_in_at && new Date(u.last_sign_in_at) > day30).length;

  const { data: plans } = await supabaseAdmin
    .from("gw_plans")
    .select("user_id, gw, saved_at");

  const uniquePlanners = new Set((plans ?? []).map((p: { user_id: string }) => p.user_id)).size;
  const totalPlans = (plans ?? []).length;
  const recentPlans = (plans ?? []).filter((p: { saved_at: string }) => new Date(p.saved_at) > day7).length;

  return NextResponse.json({
    totalUsers,
    newLast7,
    activeLast30,
    uniquePlanners,
    totalPlans,
    recentPlans,
  });
}
