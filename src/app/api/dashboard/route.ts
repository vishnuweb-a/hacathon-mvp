import { NextResponse } from "next/server";
import { getOverviewMetrics } from "@/services/dashboard/getOverviewMetrics";
import { getThreatMetrics } from "@/services/dashboard/getThreatMetrics";
import { getMemoryMetrics } from "@/services/dashboard/getMemoryMetrics";
import { getLearningMetrics } from "@/services/dashboard/getLearningMetrics";
import { getAIMetrics } from "@/services/dashboard/getAIMetrics";
import { getRecentActivity } from "@/services/dashboard/getRecentActivity";
import { getExecutiveInsights } from "@/services/dashboard/getExecutiveInsights";
import { getRecentReports } from "@/services/dashboard/getRecentReports";

// GET /api/dashboard - Aggregated dashboard data
export async function GET() {
  try {
    // Fetch all metrics in parallel for speed
    const [overview, threats, memory, learning, ai, recentActivity, recentReports] =
      await Promise.all([
        getOverviewMetrics(),
        getThreatMetrics(),
        getMemoryMetrics(),
        getLearningMetrics(),
        getAIMetrics(),
        getRecentActivity(),
        getRecentReports(),
      ]);

    // Generate executive insights (uses Gemini)
    const executiveInsights = await getExecutiveInsights(
      overview,
      threats,
      learning
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          overview,
          threats,
          memory,
          learning,
          ai,
          recentActivity,
          recentReports,
          executiveInsights,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /api/dashboard] Error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
