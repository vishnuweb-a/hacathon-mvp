import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/runbooks/history
 * Returns historical runbook snapshots for all threat types.
 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("adaptive_runbooks")
      .select("*")
      .order("generated_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error("[GET /api/runbooks/history] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
