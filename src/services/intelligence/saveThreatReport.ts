/**
 * Threat Intelligence Report Storage
 * Persists and retrieves intelligence reports from Supabase.
 */

import { supabase } from "@/lib/supabase";
import type { ThreatIntelligenceReport, StoredIntelligenceReport } from "@/types/intelligence";

const TABLE = "threat_intelligence_reports";

/**
 * Save a generated intelligence report to the database.
 */
export async function saveIntelligenceReport(
  report: ThreatIntelligenceReport
): Promise<StoredIntelligenceReport> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ report })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save intelligence report: ${error.message}`);
  }

  return data as StoredIntelligenceReport;
}

/**
 * Retrieve the most recent intelligence report.
 */
export async function getLatestIntelligenceReport(): Promise<StoredIntelligenceReport | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch latest intelligence report: ${error.message}`);
  }

  return data as StoredIntelligenceReport | null;
}

/**
 * Retrieve historical intelligence reports.
 */
export async function getIntelligenceReportHistory(
  limit: number = 10
): Promise<StoredIntelligenceReport[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch intelligence report history: ${error.message}`);
  }

  return (data || []) as StoredIntelligenceReport[];
}
