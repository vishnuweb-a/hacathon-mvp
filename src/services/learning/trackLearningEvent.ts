import { supabase } from "@/lib/supabase";

const TABLE = "learning_events";

/**
 * Logs a learning event to the database for auditability and dashboard metrics.
 */
export async function trackLearningEvent(params: {
  incident_id: string;
  memory_id: string | null;
  threat_type: string;
  knowledge_summary: string;
  status: "completed" | "pending" | "failed";
}): Promise<void> {
  const { error } = await supabase.from(TABLE).insert({
    incident_id: params.incident_id,
    memory_id: params.memory_id,
    threat_type: params.threat_type,
    knowledge_summary: params.knowledge_summary,
    status: params.status,
  });

  if (error) {
    console.error("[Learning] Failed to track learning event:", error.message);
    // Non-blocking — we don't want tracking failure to break the pipeline
  } else {
    console.log(`[Learning] Event tracked: ${params.threat_type} for incident ${params.incident_id}`);
  }
}
