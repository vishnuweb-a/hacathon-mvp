import { supabase } from "@/lib/supabase";

export interface ThreatMetrics {
  mostCommonThreat: string;
  threatDistribution: { name: string; value: number }[];
  topRootCauses: string[];
}

export async function getThreatMetrics(): Promise<ThreatMetrics> {
  const { data: events } = await supabase
    .from("learning_events")
    .select("threat_type, knowledge_summary")
    .eq("status", "completed");

  // Threat distribution
  const threatCounts: Record<string, number> = {};
  const rootCauseCounts: Record<string, number> = {};

  for (const event of events || []) {
    const t = event.threat_type || "Unknown";
    threatCounts[t] = (threatCounts[t] || 0) + 1;

    // Extract root cause patterns from summaries
    if (event.knowledge_summary) {
      const parts = event.knowledge_summary.split("→");
      if (parts.length > 0) {
        const cause = parts[0].split(":").slice(1).join(":").trim();
        if (cause) {
          rootCauseCounts[cause] = (rootCauseCounts[cause] || 0) + 1;
        }
      }
    }
  }

  const threatDistribution = Object.entries(threatCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const mostCommonThreat =
    threatDistribution.length > 0 ? threatDistribution[0].name : "None detected";

  const topRootCauses = Object.entries(rootCauseCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cause]) => cause);

  return {
    mostCommonThreat,
    threatDistribution,
    topRootCauses,
  };
}
