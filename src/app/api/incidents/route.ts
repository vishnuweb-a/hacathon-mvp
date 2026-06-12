import { NextRequest, NextResponse } from "next/server";
import { createIncidentSchema } from "@/schemas/incident.schema";
import { createIncident, getAllIncidents } from "@/services/incidents";

// POST /api/incidents - Create a new incident
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

    const parsed = createIncidentSchema.safeParse(body);
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

    const incident = await createIncident(parsed.data);

    return NextResponse.json(
      { success: true, incidentId: incident.id, incident },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/incidents] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// GET /api/incidents - Get all incidents
export async function GET() {
  try {
    const incidents = await getAllIncidents();
    return NextResponse.json({ success: true, incidents }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/incidents] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
