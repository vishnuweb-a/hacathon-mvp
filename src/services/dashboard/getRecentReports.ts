import { supabase } from "@/lib/supabase";

export interface DashboardReport {
  id: string;
  incident_id: string;
  title: string;
  riskLevel: string;
  created_at: string;
}

export async function getRecentReports(): Promise<DashboardReport[]> {
  const { data, error } = await supabase
    .from("reports")
    .select("id, incident_id, report_content, created_at")
    .order("created_at", { ascending: false })
    .limit(3);

  if (error) {
    console.error("[getRecentReports] Error:", error);
    return [];
  }

  return (data || []).map((row) => {
    const rc = row.report_content as any;
    return {
      id: row.id,
      incident_id: row.incident_id,
      title: rc?.incidentOverview?.title || "Security Incident Report",
      riskLevel: rc?.riskLevel || "Unknown",
      created_at: row.created_at,
    };
  });
}
