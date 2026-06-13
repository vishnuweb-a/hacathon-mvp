import { NextRequest, NextResponse } from "next/server";
import { generatePostmortem } from "@/services/learning/generatePostmortem";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST /api/incidents/:id/auto-postmortem - AI-generate a postmortem
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    console.log(`[AutoPostmortem API] Generating for incident: ${id}`);
    const generated = await generatePostmortem(id);

    return NextResponse.json(
      { success: true, postmortem: generated },
      { status: 200 }
    );
  } catch (error) {
    console.error("[POST /api/incidents/:id/auto-postmortem] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
