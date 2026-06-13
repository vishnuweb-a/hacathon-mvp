import { NextResponse } from "next/server";
import { getLatestIntelligenceReport } from "@/services/intelligence/saveThreatReport";

/**
 * GET /api/intelligence/latest
 * Returns the most recent intelligence report.
 */
export async function GET() {
  try {
    const report = await getLatestIntelligenceReport();

    return NextResponse.json(
      { success: true, data: report },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /api/intelligence/latest] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
