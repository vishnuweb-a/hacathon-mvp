/**
 * Memory Strength Calculator
 * Computes a strength score for controls/memories based on:
 * - Reference count (how often it's been used as evidence)
 * - Success rate (% of times the recommended control resolved the issue)
 * - Usage frequency (recent references weighted higher)
 */

import { supabase } from "@/lib/supabase";
import type { MemoryStrength, InfluentialMemory } from "@/types/provenance";

/**
 * Calculate strength score for a specific memory ID.
 */
export async function calculateMemoryStrength(
  memoryId: string
): Promise<MemoryStrength> {
  // 1. Count how many times this memory was referenced as a source
  const { count: referenceCount } = await supabase
    .from("memory_provenance_logs")
    .select("*", { count: "exact", head: true })
    .eq("source_type", "memory")
    .eq("source_id", memoryId);

  // 2. Get the last reference date
  const { data: lastRef } = await supabase
    .from("memory_provenance_logs")
    .select("created_at")
    .eq("source_type", "memory")
    .eq("source_id", memoryId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // 3. Estimate success: count analyses and reports that used this memory
  //    where the associated incident was resolved
  const { data: targetLogs } = await supabase
    .from("memory_provenance_logs")
    .select("target_type, target_id")
    .eq("source_type", "memory")
    .eq("source_id", memoryId);

  let successCount = 0;
  const refs = referenceCount || 0;

  if (targetLogs) {
    // For each analysis that used this memory, check if the incident is resolved
    const analysisTargets = targetLogs.filter((t) => t.target_type === "analysis");
    for (const target of analysisTargets) {
      const { data: analysis } = await supabase
        .from("incident_analyses")
        .select("incident_id")
        .eq("id", target.target_id)
        .maybeSingle();

      if (analysis?.incident_id) {
        const { data: incident } = await supabase
          .from("incidents")
          .select("status")
          .eq("id", analysis.incident_id)
          .maybeSingle();

        if (incident?.status === "resolved") successCount++;
      }
    }
  }

  const successRate = refs > 0 ? Math.round((successCount / refs) * 100) : 0;

  // 4. Calculate composite strength score (0-100)
  const refScore = Math.min(refs * 5, 40);       // max 40 points from references
  const successScore = (successRate / 100) * 40;   // max 40 points from success
  const recencyScore = lastRef ? getRecencyScore(lastRef.created_at) : 0; // max 20
  const strengthScore = Math.min(Math.round(refScore + successScore + recencyScore), 100);

  return {
    memoryId,
    label: `Memory ${memoryId.substring(0, 8)}`,
    referenceCount: refs,
    successCount,
    successRate,
    strengthScore,
    lastReferenced: lastRef?.created_at || null,
  };
}

/**
 * Get top influential memories across the entire organization.
 */
export async function getTopInfluentialMemories(
  limit: number = 10
): Promise<InfluentialMemory[]> {
  // Get all memory source references grouped by source_id
  const { data: logs } = await supabase
    .from("memory_provenance_logs")
    .select("source_id, relevance, context")
    .eq("source_type", "memory")
    .order("created_at", { ascending: false });

  if (!logs || logs.length === 0) {
    // Fallback: build from learning events + postmortems when no provenance logs exist
    return getInfluentialFromExistingData(limit);
  }

  // Count references per memory
  const memoryRefs: Record<string, { count: number; totalRelevance: number; context: string }> = {};
  for (const log of logs) {
    if (!memoryRefs[log.source_id]) {
      memoryRefs[log.source_id] = { count: 0, totalRelevance: 0, context: log.context || "" };
    }
    memoryRefs[log.source_id].count++;
    memoryRefs[log.source_id].totalRelevance += log.relevance || 0;
  }

  // Sort by count and return top N
  return Object.entries(memoryRefs)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, limit)
    .map(([id, data]) => ({
      id,
      label: data.context || `Memory ${id.substring(0, 8)}`,
      category: "Security Knowledge",
      referenceCount: data.count,
      strengthScore: Math.min(Math.round((data.count * 10) + (data.totalRelevance / data.count) * 50), 100),
    }));
}

/**
 * Build influential memories from existing learning events and postmortems
 * when no provenance logs exist yet.
 */
async function getInfluentialFromExistingData(limit: number): Promise<InfluentialMemory[]> {
  const { data: learningEvents } = await supabase
    .from("learning_events")
    .select("id, threat_type, knowledge_summary, memory_id")
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!learningEvents || learningEvents.length === 0) return [];

  // Count by threat_type as a proxy for influence
  const categoryCount: Record<string, { count: number; summary: string; memoryId: string }> = {};
  for (const evt of learningEvents) {
    const cat = evt.threat_type || "Unknown";
    if (!categoryCount[cat]) {
      categoryCount[cat] = { count: 0, summary: evt.knowledge_summary || cat, memoryId: evt.memory_id || evt.id };
    }
    categoryCount[cat].count++;
  }

  return Object.entries(categoryCount)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, limit)
    .map(([category, data]) => ({
      id: data.memoryId,
      label: `${category} Knowledge`,
      category,
      referenceCount: data.count,
      strengthScore: Math.min(data.count * 15, 100),
    }));
}

/**
 * Recency score: memories referenced recently get higher scores.
 */
function getRecencyScore(dateStr: string): number {
  const daysSince = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince < 7) return 20;
  if (daysSince < 30) return 15;
  if (daysSince < 90) return 10;
  return 5;
}
