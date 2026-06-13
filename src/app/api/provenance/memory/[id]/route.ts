import { NextResponse } from "next/server";
import { buildTimelineForMemory } from "@/services/provenance/buildTimeline";
import { calculateMemoryStrength } from "@/services/provenance/calculateMemoryStrength";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Fetch timeline and strength in parallel
    const [timeline, strength] = await Promise.all([
      buildTimelineForMemory(id),
      calculateMemoryStrength(id)
    ]);

    return NextResponse.json({
      success: true,
      data: { timeline, strength }
    });
  } catch (error) {
    console.error("[GET /api/provenance/memory] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
