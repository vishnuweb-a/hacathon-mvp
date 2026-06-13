import { getIncidentById } from "@/services/incidents";
import { getPostmortemByIncidentId } from "@/services/postmortems";
import { hindsight } from "@/lib/hindsight";
import { supabase } from "@/lib/supabase";

export interface ReportContext {
  incident: {
    id: string;
    title: string;
    description: string;
    severity: string;
    status: string;
    source: string | null;
    created_at: string;
  };
  postmortem: {
    root_cause: string;
    resolution: string;
    lessons_learned: string;
    resolution_time_minutes: number;
    created_at: string;
  } | null;
  memories: { text: string; metadata?: any }[];
  learningEvent: {
    threat_type: string;
    knowledge_summary: string;
  } | null;
  similarIncidentCount: number;
}

/**
 * Builds the full context needed for report generation by aggregating
 * data from Incidents, Postmortems, Hindsight Memory, and Learning Events.
 */
export async function buildReportContext(
  incidentId: string
): Promise<ReportContext> {
  // 1. Fetch the incident
  const incident = await getIncidentById(incidentId);

  // 2. Fetch postmortem (if exists)
  const postmortem = await getPostmortemByIncidentId(incidentId);

  // 3. Recall related memories from Hindsight
  let memories: { text: string; metadata?: any }[] = [];
  try {
    const recalled = await hindsight.recall(
      "security-incidents",
      `${incident.title} ${incident.description}`
    );
    memories = recalled.slice(0, 5);
  } catch (err) {
    console.warn("[ReportContext] Hindsight recall failed:", err);
  }

  // 4. Fetch learning event for this incident
  let learningEvent = null;
  try {
    const { data } = await supabase
      .from("learning_events")
      .select("threat_type, knowledge_summary")
      .eq("incident_id", incidentId)
      .eq("status", "completed")
      .maybeSingle();
    if (data) learningEvent = data;
  } catch (err) {
    console.warn("[ReportContext] Learning event fetch failed:", err);
  }

  // 5. Count similar incidents from memory
  const similarIncidentCount = new Set(
    memories
      .filter((m) => m.metadata?.incident_id && m.metadata.incident_id !== incidentId)
      .map((m) => m.metadata!.incident_id)
  ).size;

  return {
    incident: {
      id: incident.id,
      title: incident.title,
      description: incident.description,
      severity: incident.severity,
      status: incident.status,
      source: incident.source ?? null,
      created_at: incident.created_at,
    },
    postmortem: postmortem
      ? {
          root_cause: postmortem.root_cause,
          resolution: postmortem.resolution,
          lessons_learned: postmortem.lessons_learned,
          resolution_time_minutes: postmortem.resolution_time_minutes,
          created_at: postmortem.created_at,
        }
      : null,
    memories,
    learningEvent,
    similarIncidentCount,
  };
}
