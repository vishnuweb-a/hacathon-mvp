/**
 * Memory Graph Builder
 * Constructs a memory chain showing the reasoning lineage:
 * Current Incident → Similar Past Incident → Postmortem → Learning Event → Memory → Recommendation
 */

import { supabase } from "@/lib/supabase";
import type { MemoryChainNode, EnrichedSource } from "@/types/provenance";

/**
 * Build a memory chain (reasoning lineage) from enriched sources.
 * Orders sources into a logical chain showing how knowledge flowed from
 * raw incidents through analysis to final recommendations.
 */
export function buildMemoryGraph(
  sources: EnrichedSource[],
  targetLabel: string
): MemoryChainNode[] {
  const chain: MemoryChainNode[] = [];
  let step = 1;

  // Sort sources by creation date (oldest first to show lineage)
  const sorted = [...sources].sort((a, b) => {
    const dateA = a.data.created_at ? new Date(a.data.created_at).getTime() : 0;
    const dateB = b.data.created_at ? new Date(b.data.created_at).getTime() : 0;
    return dateA - dateB;
  });

  // Group by type for ordered chain construction
  const incidents = sorted.filter((s) => s.type === "incident");
  const postmortems = sorted.filter((s) => s.type === "postmortem");
  const learningEvents = sorted.filter((s) => s.type === "learning_event");
  const memories = sorted.filter((s) => s.type === "memory");
  const analyses = sorted.filter((s) => s.type === "analysis");

  // Build chain: Incidents → Postmortems → Learning Events → Memories → Analyses → Recommendation

  for (const src of incidents) {
    chain.push({
      step: step++,
      type: "incident",
      id: src.id,
      label: src.data.title || `Incident ${src.id.substring(0, 8)}`,
      description: `[${src.data.severity?.toUpperCase()}] ${src.data.description?.substring(0, 120) || "Security incident detected"}`,
      timestamp: src.data.created_at || new Date().toISOString(),
    });
  }

  for (const src of postmortems) {
    chain.push({
      step: step++,
      type: "postmortem",
      id: src.id,
      label: `Root Cause: ${src.data.root_cause?.substring(0, 60) || "Analysis"}`,
      description: `Resolution: ${src.data.resolution?.substring(0, 120) || "Applied remediation"}`,
      timestamp: src.data.created_at || new Date().toISOString(),
    });
  }

  for (const src of learningEvents) {
    chain.push({
      step: step++,
      type: "learning_event",
      id: src.id,
      label: `Learning: ${src.data.threat_type || "Threat classified"}`,
      description: src.data.knowledge_summary?.substring(0, 120) || "Knowledge extracted and stored",
      timestamp: src.data.created_at || new Date().toISOString(),
    });
  }

  for (const src of memories) {
    chain.push({
      step: step++,
      type: "memory",
      id: src.id,
      label: `Memory: ${src.data.title || "Organizational knowledge"}`,
      description: src.data.text?.substring(0, 120) || "Memory stored in Hindsight",
      timestamp: src.data.created_at || new Date().toISOString(),
    });
  }

  for (const src of analyses) {
    chain.push({
      step: step++,
      type: "analysis",
      id: src.id,
      label: `Analysis: ${src.data.root_cause?.substring(0, 60) || "AI analysis"}`,
      description: src.data.analysis_summary?.substring(0, 120) || "Gemini analysis generated",
      timestamp: src.data.created_at || new Date().toISOString(),
    });
  }

  // Final node: the recommendation/target itself
  chain.push({
    step: step,
    type: "recommendation",
    id: "target",
    label: targetLabel,
    description: "Generated from organizational memory and AI analysis",
    timestamp: new Date().toISOString(),
  });

  return chain;
}

/**
 * Build a memory graph from an incident ID by tracing all related records.
 * Useful for the full "attack → recommendation" demo flow.
 */
export async function buildMemoryGraphFromIncident(
  incidentId: string
): Promise<MemoryChainNode[]> {
  const chain: MemoryChainNode[] = [];
  let step = 1;

  // 1. Fetch the incident
  const { data: incident } = await supabase
    .from("incidents")
    .select("*")
    .eq("id", incidentId)
    .maybeSingle();

  if (incident) {
    chain.push({
      step: step++,
      type: "incident",
      id: incident.id,
      label: incident.title,
      description: `[${incident.severity?.toUpperCase()}] ${incident.description?.substring(0, 120)}`,
      timestamp: incident.created_at,
    });
  }

  // 2. Fetch postmortem
  const { data: postmortem } = await supabase
    .from("postmortems")
    .select("*")
    .eq("incident_id", incidentId)
    .maybeSingle();

  if (postmortem) {
    chain.push({
      step: step++,
      type: "postmortem",
      id: postmortem.id,
      label: `Root Cause: ${postmortem.root_cause?.substring(0, 60)}`,
      description: `Resolution: ${postmortem.resolution?.substring(0, 120)}`,
      timestamp: postmortem.created_at,
    });
  }

  // 3. Fetch learning event
  const { data: learning } = await supabase
    .from("learning_events")
    .select("*")
    .eq("incident_id", incidentId)
    .eq("status", "completed")
    .maybeSingle();

  if (learning) {
    chain.push({
      step: step++,
      type: "learning_event",
      id: learning.id,
      label: `Learning: ${learning.threat_type}`,
      description: learning.knowledge_summary?.substring(0, 120) || "Knowledge extracted",
      timestamp: learning.created_at,
    });

    // 4. If learning event has a memory_id, add the memory node
    if (learning.memory_id) {
      chain.push({
        step: step++,
        type: "memory",
        id: learning.memory_id,
        label: "Memory Stored in Hindsight",
        description: "Organizational knowledge retained for future recall",
        timestamp: learning.created_at,
      });
    }
  }

  // 5. Fetch analysis
  const { data: analysis } = await supabase
    .from("incident_analyses")
    .select("*")
    .eq("incident_id", incidentId)
    .maybeSingle();

  if (analysis) {
    chain.push({
      step: step++,
      type: "analysis",
      id: analysis.id,
      label: `Analysis: ${analysis.root_cause?.substring(0, 60)}`,
      description: analysis.analysis_summary?.substring(0, 120) || "AI analysis generated",
      timestamp: analysis.created_at,
    });

    // Final: recommendation node
    if (analysis.recommended_actions?.length > 0) {
      chain.push({
        step: step,
        type: "recommendation",
        id: analysis.id,
        label: analysis.recommended_actions[0],
        description: `${analysis.recommended_actions.length} recommended actions generated from organizational memory`,
        timestamp: analysis.created_at,
      });
    }
  }

  return chain;
}
