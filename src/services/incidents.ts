import { supabase } from "@/lib/supabase";
import type { CreateIncidentInput, Incident, UpdateIncidentStatusInput } from "@/types/incident";

const TABLE = "incidents";

/**
 * Create a new incident in Supabase.
 */
export async function createIncident(input: CreateIncidentInput): Promise<Incident> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      title: input.title,
      description: input.description,
      severity: input.severity,
      source: input.source ?? null,
      status: "open",
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create incident: ${error.message}`);
  }

  return data as Incident;
}

/**
 * Retrieve all incidents, ordered by newest first.
 */
export async function getAllIncidents(): Promise<Incident[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch incidents: ${error.message}`);
  }

  return data as Incident[];
}

/**
 * Retrieve a single incident by ID.
 */
export async function getIncidentById(id: string): Promise<Incident> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      throw new Error(`Incident with id "${id}" not found`);
    }
    throw new Error(`Failed to fetch incident: ${error.message}`);
  }

  return data as Incident;
}

/**
 * Update the status of an incident.
 */
export async function updateIncidentStatus(
  id: string,
  input: UpdateIncidentStatusInput
): Promise<Incident> {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ status: input.status })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      throw new Error(`Incident with id "${id}" not found`);
    }
    throw new Error(`Failed to update incident: ${error.message}`);
  }

  return data as Incident;
}

/**
 * Delete an incident by ID.
 */
export async function deleteIncident(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete incident: ${error.message}`);
  }
}
