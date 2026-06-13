import { NextResponse } from "next/server";
import { getIntelligenceReportHistory } from "@/services/intelligence/saveThreatReport";

/**
 * GET /api/intelligence/history
 * Returns a list of previous intelligence reports.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const reports = await getIntelligenceReportHistory(limit);

    return NextResponse.json(
      { success: true, data: reports },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /api/intelligence/history] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
