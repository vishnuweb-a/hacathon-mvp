import { hindsight } from "@/lib/hindsight";
import { getIncidentById } from "@/services/incidents";
import { getPostmortemByIncidentId } from "@/services/postmortems";

export interface CopilotContext {
  query: string;
  isGreeting: boolean;
  memories: any[];
  incidents: any[];
  postmortems: any[];
}

// 1. Intent Detection
function detectIntent(query: string): { isGreeting: boolean; isSearch: boolean } {
  const greetingRegex = /^(hi|hello|hey|greetings|morning|afternoon|evening)\b/i;
  // Very basic heuristic. We could use an LLM for this in a more complex setup.
  const isGreeting = greetingRegex.test(query.trim()) && query.split(" ").length <= 3;
  return {
    isGreeting,
    isSearch: !isGreeting,
  };
}

export async function buildContext(query: string): Promise<CopilotContext> {
  const { isGreeting, isSearch } = detectIntent(query);

  if (isGreeting) {
    return {
      query,
      isGreeting: true,
      memories: [],
      incidents: [],
      postmortems: [],
    };
  }

  // 2. Hindsight Recall
  console.log(`[ContextBuilder] Recalling memories for query: "${query}"`);
  const memories = await hindsight.recall("security-incidents", query);

  // 3. Extract Relevant Incident IDs
  const incidentIds = Array.from(
    new Set(
      memories
        .filter((m) => m.metadata && m.metadata.incident_id)
        .map((m) => m.metadata.incident_id)
    )
  );

  console.log(`[ContextBuilder] Found ${incidentIds.length} unique incident IDs from memory.`);

  // 4. Fetch Matching Incidents
  const incidents = [];
  for (const id of incidentIds) {
    try {
      const incident = await getIncidentById(id);
      incidents.push(incident);
    } catch (e) {
      console.warn(`[ContextBuilder] Could not fetch incident ${id}`);
    }
  }

  // 5. Fetch Matching Postmortems
  const postmortems = [];
  for (const id of incidentIds) {
    try {
      const postmortem = await getPostmortemByIncidentId(id);
      if (postmortem) {
        postmortems.push(postmortem);
      }
    } catch (e) {
      console.warn(`[ContextBuilder] Could not fetch postmortem for incident ${id}`);
    }
  }

  return {
    query,
    isGreeting: false,
    memories,
    incidents,
    postmortems,
  };
}
