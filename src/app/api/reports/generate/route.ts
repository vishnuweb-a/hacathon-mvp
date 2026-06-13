import { NextRequest, NextResponse } from "next/server";
import { buildReportContext } from "@/services/reports/buildReportContext";
import { generateExecutiveReport } from "@/services/reports/generateExecutiveReport";
import { saveReport, getAllReports } from "@/services/reports/saveReport";

// POST /api/reports/generate — Generate a new executive report
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { incidentId } = body;

    if (!incidentId) {
      return NextResponse.json(
        { success: false, error: "incidentId is required" },
        { status: 400 }
      );
    }

    console.log(`[Reports API] Generating report for incident: ${incidentId}`);

    // 1. Build context
    const context = await buildReportContext(incidentId);

    // 2. Generate report via Gemini
    const reportContent = await generateExecutiveReport(context);

    // 3. Save to database
    const saved = await saveReport(incidentId, reportContent);

    console.log(`[Reports API] Report saved: ${saved.id}`);

    return NextResponse.json(
      { success: true, report: saved },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/reports/generate] Error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

// GET /api/reports/generate — List all reports (reusing this route for list)
export async function GET() {
  try {
    const reports = await getAllReports();
    return NextResponse.json({ success: true, reports }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/reports] Error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
