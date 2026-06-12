import { NextRequest, NextResponse } from "next/server";
import { createPostmortemSchema } from "@/schemas/postmortem.schema";
import { createPostmortem } from "@/services/postmortems";
import { storeIncidentMemory } from "@/services/memory/storeMemory";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST /api/incidents/:id/postmortem - Submit a postmortem
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const parsed = createPostmortemSchema.safeParse(body);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      }));
      return NextResponse.json(
        { success: false, error: "Validation failed", details: issues },
        { status: 400 }
      );
    }

    // Attach incident_id to the payload
    const payload = {
      ...parsed.data,
      incident_id: id,
    };

    const postmortem = await createPostmortem(payload);

    // Automatically trigger memory generation in HindSign
    let memoryId = null;
    try {
      const memory = await storeIncidentMemory(id);
      memoryId = memory.id;
    } catch (memError) {
      console.error("[POST /api/incidents/:id/postmortem] Failed to store memory:", memError);
      // We don't fail the whole request if memory storage fails, but we log it
    }

    return NextResponse.json(
      { success: true, postmortem, memoryStored: !!memoryId, memoryId },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/incidents/:id/postmortem] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

