import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { buildRunbookTimeline } from "@/services/runbooks/buildRunbookTimeline";

/**
 * GET /api/runbooks/[threatType]
 * Returns the adaptive runbook for a specific threat category with timeline.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ threatType: string }> }
) {
  try {
    const { threatType } = await params;
    const decoded = decodeURIComponent(threatType);

    // Fetch latest runbook for this threat type
    const { data: runbook, error } = await supabase
      .from("adaptive_runbooks")
      .select("*")
      .eq("threat_type", decoded)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    // Fetch timeline
    const timeline = await buildRunbookTimeline(decoded);

    // Fetch step metrics
    const { data: metrics } = await supabase
      .from("runbook_step_metrics")
      .select("*")
      .eq("threat_type", decoded)
      .order("created_at", { ascending: false });

    return NextResponse.json({
      success: true,
      data: {
        runbook,
        timeline,
        metrics: metrics || [],
      },
    });
  } catch (error) {
    console.error("[GET /api/runbooks/[threatType]] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
