import { supabase } from "@/lib/supabase";

export interface MemoryMetrics {
  totalMemories: number;
  threatCategoriesLearned: number;
  recentMemoriesThisWeek: number;
}

export async function getMemoryMetrics(): Promise<MemoryMetrics> {
  // Total completed learning events (each = one memory)
  const { count: totalMemories } = await supabase
    .from("learning_events")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed");

  // Distinct threat categories
  const { data: categories } = await supabase
    .from("learning_events")
    .select("threat_type")
    .eq("status", "completed");

  const uniqueCategories = new Set(
    (categories || []).map((c) => c.threat_type).filter(Boolean)
  );

  // Memories created this week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const { count: recentMemoriesThisWeek } = await supabase
    .from("learning_events")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed")
    .gte("created_at", oneWeekAgo.toISOString());

  return {
    totalMemories: totalMemories || 0,
    threatCategoriesLearned: uniqueCategories.size,
    recentMemoriesThisWeek: recentMemoriesThisWeek || 0,
  };
}
