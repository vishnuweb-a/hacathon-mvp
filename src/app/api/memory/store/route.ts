import { NextRequest, NextResponse } from "next/server";
import { storeIncidentMemory } from "@/services/memory/storeMemory";

// POST /api/memory/store
export async function POST(request: NextRequest) {
  try {
    let body: { incidentId?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    if (!body.incidentId) {
      return NextResponse.json(
        { success: false, error: "Missing incidentId in request body" },
        { status: 400 }
      );
    }

    const memory = await storeIncidentMemory(body.incidentId);

    return NextResponse.json(
      { success: true, message: "Memory Stored", memoryId: memory.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/memory/store] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
