import { NextRequest, NextResponse } from "next/server";
import { runLearningPipeline } from "@/services/learning/learningPipeline";

// POST /api/learning/process - Manual learning trigger (for backfill/retry)
export async function POST(request: NextRequest) {
  try {
    let body: { incident_id?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    if (!body.incident_id) {
      return NextResponse.json(
        { success: false, error: "Missing 'incident_id' field" },
        { status: 400 }
      );
    }

    const result = await runLearningPipeline(body.incident_id);

    return NextResponse.json(
      { success: true, learning: result },
      { status: 200 }
    );
  } catch (error) {
    console.error("[POST /api/learning/process] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
