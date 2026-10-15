import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // never cache — must actually hit the DB

// Lightweight health check. A daily Vercel cron pings this so the free-tier
// Supabase project registers activity and never auto-pauses. Doubles as an
// uptime probe you can curl any time.
export async function GET() {
  try {
    const { error } = await supabase.from("companies").select("id").limit(1);
    if (error) {
      return Response.json({ ok: false, db: "error", error: error.message }, { status: 500 });
    }
    return Response.json({ ok: true, db: "up", ts: new Date().toISOString() });
  } catch {
    return Response.json({ ok: false, db: "unreachable" }, { status: 500 });
  }
}
