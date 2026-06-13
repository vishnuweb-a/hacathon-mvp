import { supabase } from "@/lib/supabase";

export interface LearningMetrics {
  totalLearningEvents: number;
  completedEvents: number;
  failedEvents: number;
  recentLearnings: { threat_type: string; created_at: string }[];
}

export async function getLearningMetrics(): Promise<LearningMetrics> {
  const { count: totalLearningEvents } = await supabase
    .from("learning_events")
    .select("*", { count: "exact", head: true });

  const { count: completedEvents } = await supabase
    .from("learning_events")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed");

  const { count: failedEvents } = await supabase
    .from("learning_events")
    .select("*", { count: "exact", head: true })
    .eq("status", "failed");

  const { data: recentData } = await supabase
    .from("learning_events")
    .select("threat_type, created_at")
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(5);

  return {
    totalLearningEvents: totalLearningEvents || 0,
    completedEvents: completedEvents || 0,
    failedEvents: failedEvents || 0,
    recentLearnings: (recentData || []).map((e) => ({
      threat_type: e.threat_type || "Unknown",
      created_at: e.created_at,
    })),
  };
}
