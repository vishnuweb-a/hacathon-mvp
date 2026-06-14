/**
 * GET /api/graph/search?q=query
 * Search across all graph nodes.
 */

import { NextRequest, NextResponse } from "next/server";
import { generateGraph } from "@/services/graph/generateGraph";
import { searchGraph } from "@/services/graph/graphSearch";

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q") || "";
    const graph = await generateGraph();
    const results = searchGraph(graph.nodes, q);
    return NextResponse.json({ success: true, data: results });
  } catch (error: any) {
    console.error("Failed to search graph:", error);
    return NextResponse.json(
      { success: false, data: null, error: error.message },
      { status: 500 }
    );
  }
}
