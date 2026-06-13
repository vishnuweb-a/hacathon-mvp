import { NextRequest, NextResponse } from "next/server";
import { getReportById } from "@/services/reports/saveReport";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/reports/:id — Get a single report
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const report = await getReportById(id);

    if (!report) {
      return NextResponse.json(
        { success: false, error: "Report not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, report }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/reports/:id] Error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
