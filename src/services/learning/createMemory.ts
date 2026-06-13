import type { MemoryPayload, MemoryMetadata } from "@/lib/hindsight";
import type { Incident } from "@/types/incident";
import type { ExtractedKnowledge } from "@/types/learning";

const BANK_NAME = "security-incidents";

/**
 * Builds a structured, enriched Hindsight memory payload from extracted knowledge.
 */
export function createLearningMemory(
  incident: Incident,
  knowledge: ExtractedKnowledge
): MemoryPayload {
  // Build rich, searchable text that Hindsight can recall
  const text = `
Security Incident: ${incident.title}
Threat Type: ${knowledge.threatType}
Severity: ${knowledge.severity}
Category: ${knowledge.incidentCategory}
Source System: ${knowledge.sourceSystem}

Description: ${incident.description}

Root Cause: ${knowledge.rootCause}

Resolution: ${knowledge.resolution}

Lessons Learned: ${knowledge.lessonsLearned}

Preventive Measures:
${knowledge.preventiveMeasures.map((m) => `- ${m}`).join("\n")}

Resolution Time: ${knowledge.resolutionTimeMinutes} minutes
  `.trim();

  const metadata: MemoryMetadata = {
    incident_id: incident.id,
    title: incident.title,
    description: incident.description,
    severity: knowledge.severity,
    status: incident.status,
    root_cause: knowledge.rootCause,
    resolution: knowledge.resolution,
    lessons_learned: knowledge.lessonsLearned,
    resolution_time_minutes: knowledge.resolutionTimeMinutes,
  };

  return {
    bank: BANK_NAME,
    text,
    metadata,
  };
}
