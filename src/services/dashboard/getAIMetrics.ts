import { supabase } from "@/lib/supabase";

export interface AIMetrics {
  totalAnalyses: number;
  copilotSessions: number;
  recentQuestions: string[];
}

export async function getAIMetrics(): Promise<AIMetrics> {
  // Count incident analyses
  const { count: totalAnalyses } = await supabase
    .from("incident_analyses")
    .select("*", { count: "exact", head: true });

  // Count copilot sessions (user messages in chat_history)
  const { count: copilotSessions } = await supabase
    .from("chat_history")
    .select("*", { count: "exact", head: true })
    .eq("role", "user");

  // Recent copilot questions
  const { data: recentQ } = await supabase
    .from("chat_history")
    .select("content")
    .eq("role", "user")
    .order("created_at", { ascending: false })
    .limit(5);

  return {
    totalAnalyses: totalAnalyses || 0,
    copilotSessions: copilotSessions || 0,
    recentQuestions: (recentQ || []).map((q) => q.content),
  };
}
