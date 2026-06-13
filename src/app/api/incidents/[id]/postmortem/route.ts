import { NextRequest, NextResponse } from "next/server";
import { createPostmortemSchema } from "@/schemas/postmortem.schema";
import { createPostmortem, getPostmortemByIncidentId } from "@/services/postmortems";
import { runLearningPipeline } from "@/services/learning/learningPipeline";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/incidents/:id/postmortem - Fetch an existing postmortem
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const postmortem = await getPostmortemByIncidentId(id);
    
    if (!postmortem) {
      return NextResponse.json({ success: true, postmortem: null }, { status: 200 });
    }
    
    return NextResponse.json({ success: true, postmortem }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/incidents/:id/postmortem] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/incidents/:id/postmortem - Submit a postmortem & trigger learning
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

    // Automatically trigger the Continuous Learning Pipeline
    let learningResult = null;
    try {
      learningResult = await runLearningPipeline(id);
      console.log(`[Postmortem] Learning pipeline completed: ${learningResult.threatType}`);
    } catch (learningError) {
      console.error("[Postmortem] Learning pipeline failed:", learningError);
      // We don't fail the whole request if learning fails
    }

    return NextResponse.json(
      {
        success: true,
        postmortem,
        learning: learningResult
          ? {
              memoryStored: learningResult.success,
              memoryId: learningResult.memoryId,
              threatType: learningResult.threatType,
            }
          : null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/incidents/:id/postmortem] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}


