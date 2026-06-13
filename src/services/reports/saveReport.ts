import { supabase } from "@/lib/supabase";
import type { Report, ReportContent } from "@/types/report";

/**
 * Saves a generated report to the database.
 */
export async function saveReport(
  incidentId: string,
  content: ReportContent
): Promise<Report> {
  const { data, error } = await supabase
    .from("reports")
    .insert({
      incident_id: incidentId,
      report_content: content,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save report: ${error.message}`);
  }

  return data as Report;
}

/**
 * Get a report by its ID.
 */
export async function getReportById(reportId: string): Promise<Report | null> {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("id", reportId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch report: ${error.message}`);
  }

  return data as Report | null;
}

/**
 * Get all reports, ordered by most recent first.
 */
export async function getAllReports(): Promise<Report[]> {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch reports: ${error.message}`);
  }

  return (data || []) as Report[];
}

/**
 * Get a report by incident ID.
 */
export async function getReportByIncidentId(
  incidentId: string
): Promise<Report | null> {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("incident_id", incidentId)
    .order("created_at", { ascending: false })
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch report: ${error.message}`);
  }

  return data as Report | null;
}
