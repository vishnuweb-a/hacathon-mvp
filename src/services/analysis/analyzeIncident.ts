/**
 * Orchestrates the full incident analysis pipeline.
 *
 * 1. Fetch incident
 * 2. Recall similar memories from Hindsight
 * 3. Build the AI prompt
 * 4. Send to Gemini
 * 5. Save to database
 * 6. Return the analysis
 */

import { getIncidentById } from "@/services/incidents";
import { searchIncidentMemories } from "@/services/memory/searchMemory";
import { buildAnalysisPrompt } from "./buildPrompt";
import { generateAnalysis } from "@/lib/gemini";
import { saveAnalysis } from "./saveAnalysis";
import type { IncidentAnalysis } from "@/types/analysis";

export async function analyzeIncident(incidentId: string): Promise<IncidentAnalysis> {
  console.log(`[Analysis] Starting analysis for incident: ${incidentId}`);

  // Step 1: Fetch the incident
  const incident = await getIncidentById(incidentId);
  if (!incident) {
    throw new Error(`Incident ${incidentId} not found`);
  }
  console.log(`[Analysis] Fetched incident: "${incident.title}"`);

  // Step 2: Recall similar memories from Hindsight
  const searchQuery = `${incident.title} ${incident.description}`;
  let memories: any[] = [];
  try {
    memories = await searchIncidentMemories(searchQuery);
    console.log(`[Analysis] Found ${memories.length} similar memories`);
  } catch (err) {
    console.warn("[Analysis] Failed to recall memories, proceeding without:", err);
    memories = [];
  }

  // Step 3: Build the AI prompt
  const prompt = buildAnalysisPrompt(incident, memories);

  // Step 4: Send to Gemini
  console.log("[Analysis] Sending to Gemini...");
  const geminiOutput = await generateAnalysis(prompt);
  console.log(`[Analysis] Gemini returned root cause: "${geminiOutput.rootCause}" (${geminiOutput.confidence}% confidence)`);

  // Step 5: Save to database
  const analysis = await saveAnalysis(incidentId, geminiOutput);
  console.log(`[Analysis] Saved analysis with ID: ${analysis.id}`);

  return analysis;
}
