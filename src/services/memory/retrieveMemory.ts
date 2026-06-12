import { hindsight, SearchResult } from "@/lib/hindsight";

/**
 * Retrieves a specific memory by its ID.
 */
export async function retrieveMemoryById(id: string): Promise<SearchResult> {
  const memory = await hindsight.get(id);
  if (!memory) {
    throw new Error(`Memory ${id} not found`);
  }
  return memory;
}
