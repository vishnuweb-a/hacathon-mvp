import { NextResponse } from "next/server";
import { buildTimelineForCategory } from "@/services/provenance/buildTimeline";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    const { category } = await params;
    const decodedCategory = decodeURIComponent(category);
    
    // 1. Build chronological timeline
    const timeline = await buildTimelineForCategory(decodedCategory);

    // 2. Fetch raw sources related to this category for the evidence cards
    const { data: learningEvents } = await supabase
      .from("learning_events")
      .select("*")
      .eq("threat_type", decodedCategory)
      .eq("status", "completed");

    const sources = (learningEvents || []).map((le) => ({
      type: "learning_event",
      id: le.id,
      relevance: 1.0,
      context: le.knowledge_summary,
      data: le,
    }));

    return NextResponse.json({
      success: true,
      data: {
        category: decodedCategory,
        sources,
        timeline,
        totalEvidence: sources.length + timeline.entries.length
      }
    });
  } catch (error) {
    console.error("[GET /api/provenance/threat] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
