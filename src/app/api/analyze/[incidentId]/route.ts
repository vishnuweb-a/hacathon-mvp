import { NextRequest, NextResponse } from "next/server";
import { getAnalysisByIncidentId } from "@/services/analysis/saveAnalysis";

interface RouteContext {
  params: Promise<{ incidentId: string }>;
}

// GET /api/analyze/:incidentId - Retrieve a stored analysis
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { incidentId } = await context.params;

    const analysis = await getAnalysisByIncidentId(incidentId);

    if (!analysis) {
      return NextResponse.json(
        { success: false, error: "No analysis found for this incident" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, analysis },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /api/analyze/:incidentId] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
