/**
 * Evidence Chain Orchestrator
 * Top-level service that combines source resolution, memory graph building,
 * and strength calculation into a single EvidenceChain response.
 */

import { resolveSources } from "./resolveSources";
import { buildMemoryGraph } from "./buildMemoryGraph";
import { hindsight } from "@/lib/hindsight";
import { supabase } from "@/lib/supabase";
import type {
  EvidenceChain,
  ProvenanceTargetType,
  EnrichedSource,
} from "@/types/provenance";

/**
 * Get the complete evidence chain for a target (analysis, report, intelligence, etc.)
 */
export async function getEvidenceChain(
  targetType: ProvenanceTargetType,
  targetId: string
): Promise<EvidenceChain> {
  // 1. Resolve all enriched sources
  let sources = await resolveSources(targetType, targetId);

  // 2. If no provenance logs exist, try to build evidence from existing data
  if (sources.length === 0) {
    sources = await buildEvidenceFromExistingData(targetType, targetId);
  }

  // 3. Build the memory chain (reasoning lineage)
  const targetLabel = await getTargetLabel(targetType, targetId);
  const memoryChain = buildMemoryGraph(sources, targetLabel);

  // 4. Compute summary stats
  const incidentCount = sources.filter((s) => s.type === "incident").length;
  const postmortemCount = sources.filter((s) => s.type === "postmortem").length;
  const learningEventCount = sources.filter((s) => s.type === "learning_event").length;
  const memoryCount = sources.filter((s) => s.type === "memory").length;
  const analysisCount = sources.filter((s) => s.type === "analysis").length;
  const avgRelevance =
    sources.length > 0
      ? Math.round((sources.reduce((sum, s) => sum + s.relevance, 0) / sources.length) * 100) / 100
      : 0;

  return {
    targetType,
    targetId,
    sources,
    memoryChain,
    summary: {
      totalSources: sources.length,
      incidentCount,
      postmortemCount,
      learningEventCount,
      memoryCount,
      analysisCount,
      avgRelevance,
    },
  };
}

/**
 * Build evidence from existing data when no formal provenance logs exist.
 * This allows the feature to work immediately even without backfilling.
 */
async function buildEvidenceFromExistingData(
  targetType: ProvenanceTargetType,
  targetId: string
): Promise<EnrichedSource[]> {
  const sources: EnrichedSource[] = [];

  if (targetType === "analysis") {
    // Fetch the analysis to get the incident_id
    const { data: analysis } = await supabase
      .from("incident_analyses")
      .select("*")
      .eq("id", targetId)
      .maybeSingle();

    if (analysis) {
      // Get the incident
      const { data: incident } = await supabase
        .from("incidents")
        .select("*")
        .eq("id", analysis.incident_id)
        .maybeSingle();

      if (incident) {
        sources.push({
          type: "incident",
          id: incident.id,
          relevance: 1.0,
          context: incident.title,
          data: incident,
        });

        // Get postmortem
        const { data: pm } = await supabase
          .from("postmortems")
          .select("*")
          .eq("incident_id", incident.id)
          .maybeSingle();

        if (pm) {
          sources.push({
            type: "postmortem",
            id: pm.id,
            relevance: 0.95,
            context: pm.root_cause,
            data: pm,
          });
        }

        // Get learning event
        const { data: le } = await supabase
          .from("learning_events")
          .select("*")
          .eq("incident_id", incident.id)
          .eq("status", "completed")
          .maybeSingle();

        if (le) {
          sources.push({
            type: "learning_event",
            id: le.id,
            relevance: 0.9,
            context: le.knowledge_summary,
            data: le,
          });
        }

        // Get Hindsight memories related to this incident
        try {
          const memories = await hindsight.recall(
            "security-incidents",
            `${incident.title} ${incident.description}`
          );
          for (const mem of memories.slice(0, 5)) {
            sources.push({
              type: "memory",
              id: mem.id,
              relevance: mem.relevance_score,
              context: mem.text?.substring(0, 100),
              data: {
                text: mem.text,
                title: mem.metadata?.title,
                root_cause: mem.metadata?.root_cause,
                resolution: mem.metadata?.resolution,
                severity: mem.metadata?.severity,
              },
            });
          }
        } catch {
          // Hindsight may not be available
        }
      }
    }
  }

  if (targetType === "intelligence") {
    // For intelligence reports, gather recent data as evidence
    const { data: incidents } = await supabase
      .from("incidents")
      .select("id, title, description, severity, status, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    for (const inc of incidents || []) {
      sources.push({
        type: "incident",
        id: inc.id,
        relevance: 0.8,
        context: inc.title,
        data: inc,
      });
    }

    const { data: learnings } = await supabase
      .from("learning_events")
      .select("id, threat_type, knowledge_summary, created_at")
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(10);

    for (const le of learnings || []) {
      sources.push({
        type: "learning_event",
        id: le.id,
        relevance: 0.85,
        context: le.knowledge_summary,
        data: le,
      });
    }
  }

  return sources;
}

/**
 * Get a human-readable label for a target.
 */
async function getTargetLabel(
  targetType: ProvenanceTargetType,
  targetId: string
): Promise<string> {
  switch (targetType) {
    case "analysis": {
      const { data } = await supabase
        .from("incident_analyses")
        .select("root_cause")
        .eq("id", targetId)
        .maybeSingle();
      return data?.root_cause
        ? `Recommendation: ${data.root_cause.substring(0, 60)}`
        : "AI Analysis";
    }
    case "report":
      return "Executive Report";
    case "intelligence":
      return "Threat Intelligence Report";
    case "copilot_response":
      return "Copilot Response";
    case "recommendation":
      return "Security Recommendation";
    default:
      return "AI Output";
  }
}
