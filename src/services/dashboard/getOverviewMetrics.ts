import { supabase } from "@/lib/supabase";

export interface OverviewMetrics {
  totalIncidents: number;
  criticalIncidents: number;
  openIncidents: number;
  resolvedIncidents: number;
  avgResolutionTimeMinutes: number;
}

export async function getOverviewMetrics(): Promise<OverviewMetrics> {
  // Total incidents
  const { count: totalIncidents } = await supabase
    .from("incidents")
    .select("*", { count: "exact", head: true });

  // Critical incidents
  const { count: criticalIncidents } = await supabase
    .from("incidents")
    .select("*", { count: "exact", head: true })
    .eq("severity", "critical");

  // Open incidents
  const { count: openIncidents } = await supabase
    .from("incidents")
    .select("*", { count: "exact", head: true })
    .eq("status", "open");

  // Resolved incidents
  const { count: resolvedIncidents } = await supabase
    .from("incidents")
    .select("*", { count: "exact", head: true })
    .eq("status", "resolved");

  // Avg resolution time from postmortems
  const { data: pmData } = await supabase
    .from("postmortems")
    .select("resolution_time_minutes");

  const times = (pmData || [])
    .map((p) => p.resolution_time_minutes)
    .filter(Boolean);
  const avgResolutionTimeMinutes =
    times.length > 0
      ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
      : 0;

  return {
    totalIncidents: totalIncidents || 0,
    criticalIncidents: criticalIncidents || 0,
    openIncidents: openIncidents || 0,
    resolvedIncidents: resolvedIncidents || 0,
    avgResolutionTimeMinutes,
  };
}
