import { hindsight, SearchResult } from "@/lib/hindsight";

const BANK_NAME = "security-incidents";

/**
 * Searches for relevant incident memories using a natural language query.
 */
export async function searchIncidentMemories(query: string): Promise<SearchResult[]> {
  if (!query || query.trim() === "") {
    return [];
  }

  const results = await hindsight.recall(BANK_NAME, query);
  return results;
}
