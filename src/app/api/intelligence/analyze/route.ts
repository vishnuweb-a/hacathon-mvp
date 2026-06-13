import { NextResponse } from "next/server";
import { generateThreatReport } from "@/services/intelligence/generateThreatReport";
import { saveIntelligenceReport } from "@/services/intelligence/saveThreatReport";

/**
 * POST /api/intelligence/analyze
 * Triggers the full intelligence pipeline, generates and stores a threat report.
 */
export async function POST() {
  try {
    console.log("[POST /api/intelligence/analyze] Starting intelligence analysis...");

    // Generate the report
    const report = await generateThreatReport();

    // Save to database
    const stored = await saveIntelligenceReport(report);

    console.log(`[POST /api/intelligence/analyze] Report saved: ${stored.id}`);

    // Log provenance
    try {
      const { supabase } = await import("@/lib/supabase");
      const { logProvenance } = await import("@/services/provenance/resolveSources");

      // Grab some recent incidents and memories to use as sources
      const { data: recentIncidents } = await supabase
        .from("incidents")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(10);

      const provenanceEntries = [];
      for (const inc of recentIncidents || []) {
        provenanceEntries.push({
          source_type: "incident",
          source_id: inc.id,
          target_type: "intelligence",
          target_id: stored.id,
          relevance: 1.0,
          context: "Used in intelligence aggregation",
        });
      }

      await logProvenance(provenanceEntries);
      console.log(`[POST /api/intelligence/analyze] Logged ${provenanceEntries.length} provenance entries.`);
    } catch (err) {
      console.warn("[POST /api/intelligence/analyze] Failed to log provenance:", err);
    }

    return NextResponse.json(
      { success: true, data: stored },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/intelligence/analyze] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
