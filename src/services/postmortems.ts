import { supabase } from "@/lib/supabase";
import type { CreatePostmortemInput, Postmortem } from "@/types/postmortem";

const TABLE = "postmortems";

export async function createPostmortem(input: CreatePostmortemInput): Promise<Postmortem> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      incident_id: input.incident_id,
      root_cause: input.root_cause,
      resolution: input.resolution,
      lessons_learned: input.lessons_learned,
      resolution_time_minutes: input.resolution_time_minutes,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") { // Unique violation
      throw new Error(`A postmortem already exists for incident ${input.incident_id}`);
    }
    throw new Error(`Failed to create postmortem: ${error.message}`);
  }

  return data as Postmortem;
}

export async function getPostmortemByIncidentId(incidentId: string): Promise<Postmortem | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("incident_id", incidentId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch postmortem: ${error.message}`);
  }

  return data as Postmortem | null;
}
