/**
 * Provenance Source Resolver
 * Given a target (analysis, report, intelligence report), queries provenance logs
 * and enriches each source by fetching the actual record from its respective table.
 */

import { supabase } from "@/lib/supabase";
import { hindsight } from "@/lib/hindsight";
import type {
  ProvenanceLog,
  ProvenanceTargetType,
  EnrichedSource,
} from "@/types/provenance";

/**
 * Resolve all enriched sources for a given target.
 */
export async function resolveSources(
  targetType: ProvenanceTargetType,
  targetId: string
): Promise<EnrichedSource[]> {
  // 1. Fetch all provenance logs for this target
  const { data: logs, error } = await supabase
    .from("memory_provenance_logs")
    .select("*")
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .order("relevance", { ascending: false });

  if (error) {
    console.warn("[Provenance] Failed to fetch provenance logs:", error);
    return [];
  }

  if (!logs || logs.length === 0) return [];

  // 2. Enrich each source by fetching the actual record
  const enriched: EnrichedSource[] = [];

  for (const log of logs as ProvenanceLog[]) {
    const source = await enrichSource(log);
    if (source) enriched.push(source);
  }

  return enriched;
}

/**
 * Resolve all sources that reference a given source (reverse lookup).
 */
export async function resolveTargetsForSource(
  sourceType: string,
  sourceId: string
): Promise<ProvenanceLog[]> {
  const { data, error } = await supabase
    .from("memory_provenance_logs")
    .select("*")
    .eq("source_type", sourceType)
    .eq("source_id", sourceId)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("[Provenance] Failed to fetch targets for source:", error);
    return [];
  }

  return (data || []) as ProvenanceLog[];
}

/**
 * Enrich a single provenance log entry by fetching the actual source record.
 */
async function enrichSource(log: ProvenanceLog): Promise<EnrichedSource | null> {
  try {
    switch (log.source_type) {
      case "incident": {
        const { data } = await supabase
          .from("incidents")
          .select("title, description, severity, status, created_at")
          .eq("id", log.source_id)
          .maybeSingle();
        return {
          type: "incident",
          id: log.source_id,
          relevance: log.relevance,
          context: log.context,
          data: data || { title: "Unknown Incident" },
        };
      }

      case "postmortem": {
        const { data } = await supabase
          .from("postmortems")
          .select("root_cause, resolution, lessons_learned, resolution_time_minutes, created_at")
          .eq("id", log.source_id)
          .maybeSingle();
        return {
          type: "postmortem",
          id: log.source_id,
          relevance: log.relevance,
          context: log.context,
          data: data || { root_cause: "Unknown" },
        };
      }

      case "learning_event": {
        const { data } = await supabase
          .from("learning_events")
          .select("threat_type, knowledge_summary, status, created_at")
          .eq("id", log.source_id)
          .maybeSingle();
        return {
          type: "learning_event",
          id: log.source_id,
          relevance: log.relevance,
          context: log.context,
          data: data || { threat_type: "Unknown" },
        };
      }

      case "memory": {
        try {
          const memory = await hindsight.get(log.source_id);
          return {
            type: "memory",
            id: log.source_id,
            relevance: log.relevance,
            context: log.context,
            data: {
              text: memory.text,
              title: memory.metadata?.title,
              root_cause: memory.metadata?.root_cause,
              resolution: memory.metadata?.resolution,
              severity: memory.metadata?.severity,
            },
          };
        } catch {
          return {
            type: "memory",
            id: log.source_id,
            relevance: log.relevance,
            context: log.context,
            data: { text: log.context || "Memory record" },
          };
        }
      }

      case "analysis": {
        const { data } = await supabase
          .from("incident_analyses")
          .select("root_cause, analysis_summary, recommended_actions, created_at")
          .eq("id", log.source_id)
          .maybeSingle();
        return {
          type: "analysis",
          id: log.source_id,
          relevance: log.relevance,
          context: log.context,
          data: data || { root_cause: "Unknown" },
        };
      }

      default:
        return null;
    }
  } catch (err) {
    console.warn(`[Provenance] Failed to enrich source ${log.source_type}/${log.source_id}:`, err);
    return null;
  }
}

/**
 * Log a provenance entry.
 */
export async function logProvenance(entries: {
  source_type: string;
  source_id: string;
  target_type: string;
  target_id: string;
  relevance?: number;
  context?: string;
}[]): Promise<void> {
  if (entries.length === 0) return;

  const { error } = await supabase
    .from("memory_provenance_logs")
    .insert(entries.map((e) => ({
      source_type: e.source_type,
      source_id: e.source_id,
      target_type: e.target_type,
      target_id: e.target_id,
      relevance: e.relevance || 0,
      context: e.context || null,
    })));

  if (error) {
    console.warn("[Provenance] Failed to log provenance:", error);
  }
}
