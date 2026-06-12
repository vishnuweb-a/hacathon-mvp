import { NextRequest, NextResponse } from "next/server";
import { updateIncidentStatusSchema } from "@/schemas/incident.schema";
import {
  getIncidentById,
  updateIncidentStatus,
  deleteIncident,
} from "@/services/incidents";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/incidents/:id - Get a single incident
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const incident = await getIncidentById(id);
    return NextResponse.json({ success: true, incident }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/incidents/:id] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

// PATCH /api/incidents/:id - Update incident status
export async function PATCH(request: NextRequest, context: RouteContext) {
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

    const parsed = updateIncidentStatusSchema.safeParse(body);
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

    const incident = await updateIncidentStatus(id, parsed.data);
    return NextResponse.json({ success: true, incident }, { status: 200 });
  } catch (error) {
    console.error("[PATCH /api/incidents/:id] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

// DELETE /api/incidents/:id - Delete an incident
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteIncident(id);
    return NextResponse.json(
      { success: true, message: `Incident ${id} deleted successfully` },
      { status: 200 }
    );
  } catch (error) {
    console.error("[DELETE /api/incidents/:id] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
