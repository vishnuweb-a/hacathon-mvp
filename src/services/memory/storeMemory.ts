import { hindsight, MemoryMetadata } from "@/lib/hindsight";
import { getIncidentById } from "@/services/incidents";
import { getPostmortemByIncidentId } from "@/services/postmortems";

const BANK_NAME = "security-incidents";

/**
 * Generates a memory payload from an incident and its postmortem,
 * and stores it in Hindsight.
 */
export async function storeIncidentMemory(incidentId: string): Promise<{ id: string }> {
  // 1. Fetch Incident
  const incident = await getIncidentById(incidentId);
  if (!incident) {
    throw new Error(`Incident ${incidentId} not found`);
  }

  // 2. Fetch Postmortem
  const postmortem = await getPostmortemByIncidentId(incidentId);
  if (!postmortem) {
    throw new Error(`No postmortem found for incident ${incidentId}. Cannot store memory.`);
  }

  // 3. Construct Searchable Context (Text)
  const text = `
Incident Title: ${incident.title}
Description: ${incident.description}
Severity: ${incident.severity}

Root Cause:
${postmortem.root_cause}

Resolution:
${postmortem.resolution}

Lessons Learned:
${postmortem.lessons_learned}
  `.trim();

  // 4. Construct Metadata
  const metadata: MemoryMetadata = {
    incident_id: incident.id,
    title: incident.title,
    description: incident.description,
    severity: incident.severity,
    status: incident.status,
    root_cause: postmortem.root_cause,
    resolution: postmortem.resolution,
    lessons_learned: postmortem.lessons_learned,
    resolution_time_minutes: postmortem.resolution_time_minutes,
  };

  // 5. Store in Hindsight
  const result = await hindsight.retain({
    bank: BANK_NAME,
    text,
    metadata,
  });

  return result;
}
