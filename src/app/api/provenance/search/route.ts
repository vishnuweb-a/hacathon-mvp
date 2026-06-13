import { NextResponse } from "next/server";
import { hindsight } from "@/lib/hindsight";
import { resolveTargetsForSource } from "@/services/provenance/resolveSources";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("q");

    if (!query) {
      return NextResponse.json(
        { success: false, error: "Query parameter 'q' is required" },
        { status: 400 }
      );
    }

    // 1. Recall matching memories from Hindsight
    const memories = await hindsight.recall("security-incidents", query);

    // 2. Map to EnrichedSource format
    const results = memories.map((m) => ({
      type: "memory",
      id: m.id,
      relevance: m.relevance_score,
      context: m.text.substring(0, 150),
      data: {
        text: m.text,
        title: m.metadata?.title,
        root_cause: m.metadata?.root_cause,
      },
    }));

    // 3. Find related chains for the top memory
    let relatedChains: any[] = [];
    if (memories.length > 0) {
      const logs = await resolveTargetsForSource("memory", memories[0].id);
      
      // Group by target
      const targets = new Map();
      for (const log of logs) {
        const key = `${log.target_type}-${log.target_id}`;
        if (!targets.has(key)) {
          targets.set(key, { targetType: log.target_type, targetId: log.target_id, sourceCount: 0 });
        }
        targets.get(key).sourceCount++;
      }
      
      relatedChains = Array.from(targets.values());
    }

    return NextResponse.json({
      success: true,
      data: {
        query,
        results,
        relatedChains,
      }
    });
  } catch (error) {
    console.error("[GET /api/provenance/search] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
