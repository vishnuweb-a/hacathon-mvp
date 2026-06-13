import { hindsight, MemoryPayload } from "@/lib/hindsight";

/**
 * Retains a memory payload in Hindsight.
 * Returns the memory ID on success, or null on failure.
 */
export async function retainMemory(payload: MemoryPayload): Promise<string | null> {
  try {
    const result = await hindsight.retain(payload);
    console.log(`[Learning] Memory retained successfully: ${result.id}`);
    return result.id;
  } catch (error) {
    console.error("[Learning] Failed to retain memory in Hindsight:", error);
    return null;
  }
}
