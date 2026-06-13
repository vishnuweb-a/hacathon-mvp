import { NextResponse } from "next/server";
import { generateAdaptiveRunbooks } from "@/services/runbooks/generateAdaptiveRunbook";

/**
 * POST /api/runbooks/generate
 * Triggers the adaptive runbook generation pipeline.
 * Optional query param: ?threatType=Credential%20Theft
 */
export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const threatType = url.searchParams.get("threatType") || undefined;

    console.log(`[POST /api/runbooks/generate] Generating runbooks${threatType ? ` for ${threatType}` : ""}...`);

    const results = await generateAdaptiveRunbooks(threatType);

    return NextResponse.json(
      { success: true, data: results },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/runbooks/generate] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
