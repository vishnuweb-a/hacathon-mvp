/**
 * Threat Data Aggregator
 * Gathers all available intelligence sources in parallel for pattern analysis.
 */

import { supabase } from "@/lib/supabase";
import { hindsight } from "@/lib/hindsight";
import type { AggregatedThreatData } from "@/types/intelligence";

/**
 * Aggregate all security data sources for intelligence analysis.
 * Sources: incidents, postmortems, learning_events, incident_analyses, hindsight memories
 */
export async function aggregateThreatData(): Promise<AggregatedThreatData> {
  // Fetch all sources in parallel for speed
  const [
    incidentsResult,
    postmortemsResult,
    learningEventsResult,
    analysesResult,
    memoriesResult,
  ] = await Promise.allSettled([
    supabase
      .from("incidents")
      .select("id, title, description, severity, status, source, created_at")
      .order("created_at", { ascending: false }),

    supabase
      .from("postmortems")
      .select("id, incident_id, root_cause, resolution, lessons_learned, resolution_time_minutes, created_at")
      .order("created_at", { ascending: false }),

    supabase
      .from("learning_events")
      .select("id, incident_id, threat_type, knowledge_summary, status, created_at")
      .eq("status", "completed")
      .order("created_at", { ascending: false }),

    supabase
      .from("incident_analyses")
      .select("id, incident_id, root_cause, recommended_actions, analysis_summary, created_at")
      .order("created_at", { ascending: false }),

    // Hindsight memories — gracefully handle mock/failure
    fetchMemories(),
  ]);

  return {
    incidents: extractData(incidentsResult, "incidents"),
    postmortems: extractData(postmortemsResult, "postmortems"),
    learningEvents: extractData(learningEventsResult, "learning_events"),
    analyses: extractData(analysesResult, "incident_analyses"),
    memories: extractMemoryData(memoriesResult),
  };
}

/**
 * Fetch hindsight memories, gracefully handling mock mode and errors.
 */
async function fetchMemories() {
  try {
    const results = await hindsight.recall("security-incidents", "all security threats and incidents");
    return results.map((r) => ({
      id: r.id,
      text: r.text,
      metadata: r.metadata as unknown as Record<string, string>,
      relevance_score: r.relevance_score,
    }));
  } catch (error) {
    console.warn("[Intelligence] Hindsight memory fetch failed, continuing without memories:", error);
    return [];
  }
}

/**
 * Extract data from a settled promise result, logging errors gracefully.
 */
function extractData<T>(result: PromiseSettledResult<{ data: T[] | null; error: any }>, source: string): T[] {
  if (result.status === "rejected") {
    console.warn(`[Intelligence] Failed to fetch ${source}:`, result.reason);
    return [];
  }
  if (result.value.error) {
    console.warn(`[Intelligence] Error fetching ${source}:`, result.value.error);
    return [];
  }
  return (result.value.data || []) as T[];
}

/**
 * Extract memory data from a settled promise result.
 */
function extractMemoryData(
  result: PromiseSettledResult<{ id: string; text: string; metadata: Record<string, string>; relevance_score: number }[]>
) {
  if (result.status === "rejected") {
    console.warn("[Intelligence] Memory aggregation failed:", result.reason);
    return [];
  }
  return result.value;
}
