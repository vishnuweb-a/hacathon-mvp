/**
 * GET /api/graph/node/[id]
 * Returns detailed information for a specific graph node.
 */

import { NextRequest, NextResponse } from "next/server";
import { generateGraph } from "@/services/graph/generateGraph";
import type { GraphNodeDetail } from "@/types/graph";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const graph = await generateGraph();

    const node = graph.nodes.find((n) => n.id === id);
    if (!node) {
      return NextResponse.json(
        { success: false, data: null, error: `Node "${id}" not found` },
        { status: 404 }
      );
    }

    // Find connected edges and nodes
    const incomingEdges = graph.edges.filter((e) => e.target === id);
    const outgoingEdges = graph.edges.filter((e) => e.source === id);

    const connectedIds = new Set<string>();
    for (const e of incomingEdges) connectedIds.add(e.source);
    for (const e of outgoingEdges) connectedIds.add(e.target);

    const connectedNodes = graph.nodes.filter((n) => connectedIds.has(n.id));

    const detail: GraphNodeDetail = {
      node,
      connectedNodes,
      incomingEdges,
      outgoingEdges,
      stats: {
        totalConnections: connectedIds.size,
        inDegree: incomingEdges.length,
        outDegree: outgoingEdges.length,
      },
    };

    return NextResponse.json({ success: true, data: detail });
  } catch (error: any) {
    console.error("Failed to get node detail:", error);
    return NextResponse.json(
      { success: false, data: null, error: error.message },
      { status: 500 }
    );
  }
}
