/**
 * Persists AI-generated analysis to Supabase.
 */

import { supabase } from "@/lib/supabase";
import type { IncidentAnalysis, GeminiAnalysisOutput } from "@/types/analysis";

const TABLE = "incident_analyses";

/**
 * Save a Gemini analysis result to the database.
 * If an analysis for this incident already exists, it will be replaced.
 */
export async function saveAnalysis(
  incidentId: string,
  output: GeminiAnalysisOutput
): Promise<IncidentAnalysis> {
  // Delete any existing analysis for this incident (one analysis per incident)
  await supabase.from(TABLE).delete().eq("incident_id", incidentId);

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      incident_id: incidentId,
      root_cause: output.rootCause,
      confidence: output.confidence,
      recommended_actions: output.recommendedActions,
      estimated_resolution_time: output.estimatedResolutionTime,
      recommended_runbook: output.recommendedRunbook,
      analysis_summary: output.summary,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save analysis: ${error.message}`);
  }

  return data as IncidentAnalysis;
}

/**
 * Retrieve a stored analysis for an incident.
 */
export async function getAnalysisByIncidentId(
  incidentId: string
): Promise<IncidentAnalysis | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("incident_id", incidentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch analysis: ${error.message}`);
  }

  return data as IncidentAnalysis | null;
}
