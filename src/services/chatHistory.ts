import { supabase } from "@/lib/supabase";
import { ChatHistoryEntry, CopilotResponse } from "@/types/copilot";

const TABLE = "chat_history";

export async function saveChatHistory(message: string, response: CopilotResponse): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .insert({
      message,
      response
    });

  if (error) {
    console.error("Failed to save chat history:", error.message);
    // Non-blocking error
  }
}

export async function getChatHistory(limit: number = 20): Promise<ChatHistoryEntry[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to fetch chat history:", error.message);
    return [];
  }

  // Reverse to get chronological order for UI
  return (data as ChatHistoryEntry[]).reverse();
}
