// Temporary health check: proves that env vars load, the Supabase connection
// works, and RLS is active. Delete once the real pages are in place.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  // head:true fetches no rows, only the count allowed by RLS.
  const { count, error } = await supabase
    .from("restaurants")
    .select("*", { count: "exact", head: true });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, restaurants_visible: count ?? 0 });
}
