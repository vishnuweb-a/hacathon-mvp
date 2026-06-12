/**
 * Hindsight Memory Client
 * Interacts with the HindSign Memory API to store and retrieve incident memories.
 */

import { HindsightClient } from "@vectorize-io/hindsight-client";

const API_URL = process.env.HIND_SIGN_API_URL || "https://api.hindsight.example.com";
const API_KEY = process.env.HIND_SIGN_API_KEY;

// Create the official client instance
const client = new HindsightClient({
  baseUrl: API_URL,
  apiKey: API_KEY,
});

export interface MemoryMetadata {
  incident_id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  root_cause: string;
  resolution: string;
  lessons_learned: string;
  resolution_time_minutes: number;
}

export interface MemoryPayload {
  bank: string; // e.g., 'security-incidents'
  text: string; // The full searchable context
  metadata: MemoryMetadata;
}

export interface SearchResult {
  id: string;
  text: string;
  metadata: MemoryMetadata;
  relevance_score: number;
}

export const hindsight = {
  /**
   * Retain a new memory in Hindsight.
   */
  async retain(payload: MemoryPayload): Promise<{ id: string }> {
    if (!API_KEY || API_URL.includes("example.com")) {
      console.warn("Using mock Hindsight storage (no real URL/Key configured).");
      return { id: "mock-memory-id-" + Date.now() };
    }

    try {
      // The official SDK requires passing bankId and content as separate arguments.
      // We also pass the metadata via the options object.
      // The Hindsight API requires all metadata values to be strings.
      const stringifiedMetadata: Record<string, string> = {};
      for (const [key, value] of Object.entries(payload.metadata)) {
        stringifiedMetadata[key] = String(value);
      }

      await client.retain(payload.bank, payload.text, {
        metadata: stringifiedMetadata,
      });

      return { id: `mem-${Date.now()}` };
    } catch (error) {
      console.error("Failed to retain memory:", error);
      throw error;
    }
  },

  /**
   * Recall relevant memories based on a natural language query.
   */
  async recall(bank: string, query: string): Promise<SearchResult[]> {
    if (!API_KEY || API_URL.includes("example.com")) {
      console.warn("Using mock Hindsight search.");
      return [
        {
          id: "mock-memory-1",
          text: "Mock matching memory text.",
          metadata: {
            incident_id: "mock-inc-1",
            title: "Multiple Failed AWS Logins",
            description: "Detected 120 failed login attempts from foreign IPs",
            severity: "critical",
            status: "resolved",
            root_cause: "Compromised developer credentials.",
            resolution: "Rotated credentials and enabled MFA.",
            lessons_learned: "All accounts must require MFA.",
            resolution_time_minutes: 30,
          },
          relevance_score: 0.95,
        },
      ];
    }

    try {
      const response = await client.recall(bank, query);
      
      // Map the SDK's RecallResponse to our SearchResult structure.
      // The SDK returns response.results which contains the mapped objects.
      return (response.results || []).map((res: any) => ({
        id: res.id,
        text: res.text || res.content || "",
        metadata: res.metadata as MemoryMetadata,
        relevance_score: res.score || res.relevance_score || 0.9,
      }));
    } catch (error) {
      console.error("Failed to recall memories:", error);
      throw error;
    }
  },

  /**
   * Retrieve a specific memory by ID.
   * Note: The SDK currently does not expose a get-single-memory method out of the box,
   * so we will throw or mock this for now, as search is the primary operation.
   */
  async get(id: string): Promise<SearchResult> {
    if (!API_KEY || API_URL.includes("example.com")) {
      return {
        id,
        text: "Mock single memory text.",
        metadata: {
          incident_id: "mock-inc-1",
          title: "Mock Incident",
          description: "Mock description",
          severity: "high",
          status: "resolved",
          root_cause: "Mock root cause",
          resolution: "Mock resolution",
          lessons_learned: "Mock lessons learned",
          resolution_time_minutes: 60,
        },
        relevance_score: 1.0,
      };
    }

    throw new Error("Get memory by ID is not directly supported by the current HindsightClient.");
  },
};

