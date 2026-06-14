/**
 * GET /api/graph
 * Returns the full organizational memory graph (nodes + edges + stats).
 */

import { NextResponse } from "next/server";
import { generateGraph } from "@/services/graph/generateGraph";

export async function GET() {
  try {
    const graph = await generateGraph();
    return NextResponse.json({ success: true, data: graph });
  } catch (error: any) {
    console.error("Failed to generate graph:", error);
    return NextResponse.json(
      { success: false, data: null, error: error.message },
      { status: 500 }
    );
  }
}
