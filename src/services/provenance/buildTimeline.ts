/**
 * Memory Timeline Builder
 * Builds a chronological timeline showing how organizational knowledge
 * evolved for a given threat category or memory ID.
 */

import { supabase } from "@/lib/supabase";
import type { MemoryTimeline, MemoryTimelineEntry } from "@/types/provenance";

/**
 * Build a memory timeline for a given threat category.
 * Shows the evolution of organizational knowledge about this threat type.
 */
export async function buildTimelineForCategory(
  category: string
): Promise<MemoryTimeline> {
  const entries: MemoryTimelineEntry[] = [];

  // 1. Incidents related to this category (via learning events)
  const { data: learningEvents } = await supabase
    .from("learning_events")
    .select("id, incident_id, threat_type, knowledge_summary, created_at")
    .eq("threat_type", category)
    .eq("status", "completed")
    .order("created_at", { ascending: true });

  if (learningEvents) {
    for (const evt of learningEvents) {
      // Add the learning event itself
      entries.push({
        id: evt.id,
        date: evt.created_at,
        type: "learning",
        label: `${evt.threat_type} — Knowledge Extracted`,
        description: evt.knowledge_summary?.substring(0, 150) || "Learning event completed",
        sourceType: "learning_event",
        sourceId: evt.id,
      });

      // Look up the incident that triggered this learning
      if (evt.incident_id) {
        const { data: incident } = await supabase
          .from("incidents")
          .select("id, title, severity, created_at")
          .eq("id", evt.incident_id)
          .maybeSingle();

        if (incident) {
          entries.push({
            id: `inc-${incident.id}`,
            date: incident.created_at,
            type: "created",
            label: incident.title,
            description: `[${incident.severity?.toUpperCase()}] Incident detected`,
            sourceType: "incident",
            sourceId: incident.id,
          });
        }

        // Look up postmortem
        const { data: postmortem } = await supabase
          .from("postmortems")
          .select("id, root_cause, resolution, created_at")
          .eq("incident_id", evt.incident_id)
          .maybeSingle();

        if (postmortem) {
          entries.push({
            id: `pm-${postmortem.id}`,
            date: postmortem.created_at,
            type: "updated",
            label: `Root Cause: ${postmortem.root_cause?.substring(0, 60)}`,
            description: `Resolution: ${postmortem.resolution?.substring(0, 100)}`,
            sourceType: "postmortem",
            sourceId: postmortem.id,
          });
        }
      }
    }
  }

  // 2. Provenance references (when this category was used as evidence)
  const { data: provenanceLogs } = await supabase
    .from("memory_provenance_logs")
    .select("id, source_type, source_id, target_type, target_id, context, created_at")
    .or(`context.ilike.%${category}%`)
    .order("created_at", { ascending: true });

  if (provenanceLogs) {
    for (const log of provenanceLogs) {
      entries.push({
        id: `prov-${log.id}`,
        date: log.created_at,
        type: "referenced",
        label: `Referenced in ${log.target_type}`,
        description: log.context?.substring(0, 120) || `Used as evidence for ${log.target_type} output`,
        sourceType: log.source_type,
        sourceId: log.source_id,
      });
    }
  }

  // Sort by date
  entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // De-duplicate by id
  const seen = new Set<string>();
  const unique = entries.filter((e) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });

  return { category, entries: unique };
}

/**
 * Build a timeline for a specific memory ID (all its references over time).
 */
export async function buildTimelineForMemory(
  memoryId: string
): Promise<MemoryTimeline> {
  const entries: MemoryTimelineEntry[] = [];

  // 1. When was this memory first created? (from learning events)
  const { data: learningEvent } = await supabase
    .from("learning_events")
    .select("id, threat_type, knowledge_summary, created_at")
    .eq("memory_id", memoryId)
    .maybeSingle();

  if (learningEvent) {
    entries.push({
      id: `created-${memoryId}`,
      date: learningEvent.created_at,
      type: "created",
      label: `Memory Created — ${learningEvent.threat_type}`,
      description: learningEvent.knowledge_summary?.substring(0, 150) || "Memory stored in Hindsight",
      sourceType: "learning_event",
      sourceId: learningEvent.id,
    });
  }

  // 2. All provenance references to this memory
  const { data: provenanceLogs } = await supabase
    .from("memory_provenance_logs")
    .select("id, target_type, target_id, relevance, context, created_at")
    .eq("source_type", "memory")
    .eq("source_id", memoryId)
    .order("created_at", { ascending: true });

  if (provenanceLogs) {
    for (const log of provenanceLogs) {
      entries.push({
        id: `ref-${log.id}`,
        date: log.created_at,
        type: "referenced",
        label: `Used in ${log.target_type} (${Math.round((log.relevance || 0) * 100)}% relevance)`,
        description: log.context?.substring(0, 120) || `Referenced by ${log.target_type}/${log.target_id.substring(0, 8)}`,
        sourceType: "memory",
        sourceId: memoryId,
      });
    }
  }

  entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return {
    category: learningEvent?.threat_type || "Unknown",
    entries,
  };
}
