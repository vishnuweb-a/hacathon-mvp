import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/runbooks/latest
 * Returns the most recently generated adaptive runbook for each threat type.
 */
export async function GET() {
  try {
    // Get distinct threat types
    const { data: allRunbooks, error } = await supabase
      .from("adaptive_runbooks")
      .select("*")
      .order("generated_at", { ascending: false });

    if (error) throw error;

    // Deduplicate: keep only the latest per threat type
    const latest = new Map<string, any>();
    for (const rb of allRunbooks || []) {
      if (!latest.has(rb.threat_type)) {
        latest.set(rb.threat_type, rb);
      }
    }

    return NextResponse.json({
      success: true,
      data: Array.from(latest.values()),
    });
  } catch (error) {
    console.error("[GET /api/runbooks/latest] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
