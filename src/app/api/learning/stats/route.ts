import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { LearningStats, LearningEvent } from "@/types/learning";

// GET /api/learning/stats - Returns learning dashboard metrics
export async function GET() {
  try {
    // Total memories (completed learning events)
    const { count: totalMemories, error: countError } = await supabase
      .from("learning_events")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed");

    if (countError) {
      throw new Error(`Failed to count learning events: ${countError.message}`);
    }

    // Threat category breakdown
    const { data: categoryData, error: categoryError } = await supabase
      .from("learning_events")
      .select("threat_type")
      .eq("status", "completed");

    if (categoryError) {
      throw new Error(`Failed to fetch categories: ${categoryError.message}`);
    }

    const categoryCounts: Record<string, number> = {};
    for (const row of categoryData || []) {
      const cat = row.threat_type || "Unknown";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }
    const threatCategories = Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    // Average resolution time from postmortems
    const { data: postmortemData, error: pmError } = await supabase
      .from("postmortems")
      .select("resolution_time_minutes");

    if (pmError) {
      throw new Error(`Failed to fetch postmortems: ${pmError.message}`);
    }

    const times = (postmortemData || []).map((p) => p.resolution_time_minutes).filter(Boolean);
    const avgResolutionTimeMinutes =
      times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;

    // Recent learning events (last 10)
    const { data: recentData, error: recentError } = await supabase
      .from("learning_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (recentError) {
      throw new Error(`Failed to fetch recent events: ${recentError.message}`);
    }

    const stats: LearningStats = {
      totalMemories: totalMemories || 0,
      threatCategories,
      avgResolutionTimeMinutes,
      recentEvents: (recentData || []) as LearningEvent[],
    };

    return NextResponse.json({ success: true, stats }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/learning/stats] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
