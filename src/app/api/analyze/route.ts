import { NextRequest, NextResponse } from "next/server";
import { analyzeIncident } from "@/services/analysis/analyzeIncident";

// POST /api/analyze - Generate AI analysis for an incident
export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { incidentId } = body as { incidentId?: string };
    if (!incidentId) {
      return NextResponse.json(
        { success: false, error: "incidentId is required" },
        { status: 400 }
      );
    }

    const analysis = await analyzeIncident(incidentId);

    return NextResponse.json(
      { success: true, analysis },
      { status: 200 }
    );
  } catch (error) {
    console.error("[POST /api/analyze] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
