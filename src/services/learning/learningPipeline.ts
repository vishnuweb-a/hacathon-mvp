import { getIncidentById } from "@/services/incidents";
import { getPostmortemByIncidentId } from "@/services/postmortems";
import { extractKnowledge } from "./extractKnowledge";
import { classifyThreatFallback, normalizeThreatType } from "./classifyThreat";
import { createLearningMemory } from "./createMemory";
import { retainMemory } from "./retainMemory";
import { trackLearningEvent } from "./trackLearningEvent";

export interface LearningPipelineResult {
  success: boolean;
  memoryId: string | null;
  threatType: string;
  knowledgeSummary: string;
}

/**
 * Orchestrates the full Continuous Learning Pipeline:
 *
 * 1. Fetch incident + postmortem
 * 2. Extract knowledge via Gemini
 * 3. Classify/normalize threat type
 * 4. Build enriched memory payload
 * 5. Retain in Hindsight
 * 6. Track learning event
 */
export async function runLearningPipeline(
  incidentId: string
): Promise<LearningPipelineResult> {
  console.log(`[Learning Pipeline] Starting for incident: ${incidentId}`);

  // 1. Fetch incident + postmortem
  const incident = await getIncidentById(incidentId);
  if (!incident) {
    throw new Error(`Incident ${incidentId} not found`);
  }

  const postmortem = await getPostmortemByIncidentId(incidentId);
  if (!postmortem) {
    throw new Error(`No postmortem found for incident ${incidentId}`);
  }

  let threatType: string = "Unknown";
  let knowledgeSummary: string = "";

  try {
    // 2. Extract knowledge via Gemini
    console.log("[Learning Pipeline] Extracting knowledge via Gemini...");
    const knowledge = await extractKnowledge(incident, postmortem);

    // 3. Normalize threat type (validate Gemini's classification)
    threatType = normalizeThreatType(knowledge.threatType);

    // Build a summary for the learning event log
    knowledgeSummary = `${knowledge.threatType}: ${knowledge.rootCause} → ${knowledge.resolution}`;

    // 4. Build enriched memory payload
    const memoryPayload = createLearningMemory(incident, knowledge);

    // 5. Retain in Hindsight
    console.log("[Learning Pipeline] Retaining memory in Hindsight...");
    const memoryId = await retainMemory(memoryPayload);

    // 6. Track learning event
    await trackLearningEvent({
      incident_id: incidentId,
      memory_id: memoryId,
      threat_type: threatType,
      knowledge_summary: knowledgeSummary,
      status: memoryId ? "completed" : "pending",
    });

    console.log(`[Learning Pipeline] Complete for ${incidentId} — ${threatType}`);

    return {
      success: true,
      memoryId,
      threatType,
      knowledgeSummary,
    };
  } catch (error) {
    console.error("[Learning Pipeline] Gemini extraction failed, falling back to rule-based:", error);

    // Fallback: rule-based classification
    const fallbackText = `${incident.title} ${incident.description} ${postmortem.root_cause}`;
    threatType = classifyThreatFallback(fallbackText);
    knowledgeSummary = `${threatType}: ${postmortem.root_cause} → ${postmortem.resolution}`;

    // Still try to retain memory with basic data
    const { MemoryPayload } = await import("@/lib/hindsight").then(() => ({
      MemoryPayload: null,
    }));

    // Use the existing storeIncidentMemory as ultimate fallback
    let memoryId: string | null = null;
    try {
      const { storeIncidentMemory } = await import("@/services/memory/storeMemory");
      const result = await storeIncidentMemory(incidentId);
      memoryId = result.id;
    } catch (storeError) {
      console.error("[Learning Pipeline] Fallback memory store also failed:", storeError);
    }

    // Track as failed/partial
    await trackLearningEvent({
      incident_id: incidentId,
      memory_id: memoryId,
      threat_type: threatType,
      knowledge_summary: knowledgeSummary,
      status: memoryId ? "completed" : "failed",
    });

    return {
      success: !!memoryId,
      memoryId,
      threatType,
      knowledgeSummary,
    };
  }
}
