import { NextRequest, NextResponse } from "next/server";
import { searchIncidentMemories } from "@/services/memory/searchMemory";

// POST /api/memory/search
export async function POST(request: NextRequest) {
  try {
    let body: { query?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    if (!body.query) {
      return NextResponse.json(
        { success: false, error: "Missing query in request body" },
        { status: 400 }
      );
    }

    const memories = await searchIncidentMemories(body.query);

    return NextResponse.json({ success: true, memories }, { status: 200 });
  } catch (error) {
    console.error("[POST /api/memory/search] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
