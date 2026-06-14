/**
 * Graph Edge Builder
 * Creates edges (relationships) between graph nodes based on
 * foreign key relationships and logical connections.
 */

import type { GraphNode, GraphEdge } from "@/types/graph";

/**
 * Build all graph edges from the node set.
 * Derives relationships from node metadata (incident_id, threat_type, memory_id, etc.)
 */
export function buildEdges(nodes: GraphNode[]): GraphEdge[] {
  const edges: GraphEdge[] = [];
  const edgeSet = new Set<string>(); // prevent duplicates

  const nodeMap = new Map<string, GraphNode>();
  for (const n of nodes) nodeMap.set(n.id, n);

  // Group nodes by type for quick lookup
  const byType = (type: string) => nodes.filter((n) => n.type === type);

  const threats = byType("threat");
  const incidents = byType("incident");
  const postmortems = byType("postmortem");
  const learnings = byType("learning_event");
  const memories = byType("memory");
  const recommendations = byType("recommendation");
  const runbooks = byType("runbook");
  const intelligence = byType("intelligence");

  // --- 1. Threat → Incident ---
  for (const inc of incidents) {
    const threatType = inc.metadata?.threat || inc.metadata?.threatType;
    if (threatType) {
      const threatId = `threat-${threatType.toLowerCase().replace(/\s+/g, "-")}`;
      if (nodeMap.has(threatId)) {
        addEdge(edges, edgeSet, threatId, inc.id, "threat_to_incident", "caused");
      }
    }
  }

  // Also link learning events' threat type to incidents
  for (const le of learnings) {
    const threatType = le.metadata?.threat_type || le.metadata?.threatType;
    const incidentId = le.metadata?.incident_id || le.metadata?.incidentId;
    if (threatType && incidentId) {
      const threatId = `threat-${threatType.toLowerCase().replace(/\s+/g, "-")}`;
      const fullIncId = `incident-${incidentId}`;
      if (nodeMap.has(threatId) && nodeMap.has(fullIncId)) {
        addEdge(edges, edgeSet, threatId, fullIncId, "threat_to_incident", "caused");
      }
    }
  }

  // --- 2. Incident → Postmortem ---
  for (const pm of postmortems) {
    const incidentId = pm.metadata?.incident_id || pm.metadata?.incidentId;
    if (incidentId) {
      const fullIncId = `incident-${incidentId}`;
      if (nodeMap.has(fullIncId)) {
        addEdge(edges, edgeSet, fullIncId, pm.id, "incident_to_postmortem", "analyzed");
      }
    }
  }

  // --- 3. Postmortem → Learning Event (same incident) ---
  for (const le of learnings) {
    const incidentId = le.metadata?.incident_id || le.metadata?.incidentId;
    if (incidentId) {
      // Find postmortem for same incident
      const pm = postmortems.find(
        (p) => (p.metadata?.incident_id || p.metadata?.incidentId) === incidentId
      );
      if (pm) {
        addEdge(edges, edgeSet, pm.id, le.id, "postmortem_to_learning", "learned");
      }
      // Also link incident → learning event directly
      const fullIncId = `incident-${incidentId}`;
      if (nodeMap.has(fullIncId)) {
        addEdge(edges, edgeSet, fullIncId, le.id, "incident_to_learning", "produced");
      }
    }
  }

  // --- 4. Learning Event → Memory ---
  for (const le of learnings) {
    const memoryId = le.metadata?.memory_id || le.metadata?.memoryId;
    if (memoryId) {
      const fullMemId = `memory-${memoryId}`;
      if (nodeMap.has(fullMemId)) {
        addEdge(edges, edgeSet, le.id, fullMemId, "learning_to_memory", "stored");
      }
    }
    // Also link via matching id pattern (demo data)
    const matchingMem = memories.find((m) => m.id === `memory-m${le.metadata?.originalId}`);
    if (matchingMem) {
      addEdge(edges, edgeSet, le.id, matchingMem.id, "learning_to_memory", "stored");
    }
  }

  // --- 5. Memory → Recommendation (by matching threat type) ---
  for (const mem of memories) {
    const memThreat = mem.metadata?.threatType;
    if (memThreat) {
      const matchingRecs = recommendations.filter((r) => r.metadata?.threatType === memThreat);
      for (const rec of matchingRecs) {
        addEdge(edges, edgeSet, mem.id, rec.id, "memory_to_recommendation", "suggests");
      }
    }
  }

  // --- 6. Recommendation → Runbook (by matching threat type) ---
  for (const rec of recommendations) {
    const recThreat = rec.metadata?.threatType;
    if (recThreat) {
      const matchingRbs = runbooks.filter((rb) => rb.metadata?.threatType === recThreat);
      for (const rb of matchingRbs) {
        addEdge(edges, edgeSet, rec.id, rb.id, "recommendation_to_runbook", "informs");
      }
    }
  }

  // --- 7. Threat → Intelligence (link all reports to top threats) ---
  for (const ir of intelligence) {
    // Link to top 3 threats
    for (let i = 0; i < Math.min(threats.length, 3); i++) {
      addEdge(edges, edgeSet, threats[i].id, ir.id, "threat_to_intelligence", "reports");
    }
  }

  // --- 8. Threat → Learning Event (by threat type) ---
  for (const le of learnings) {
    const threatType = le.metadata?.threat_type || le.metadata?.threatType;
    if (threatType) {
      const threatId = `threat-${threatType.toLowerCase().replace(/\s+/g, "-")}`;
      if (nodeMap.has(threatId)) {
        addEdge(edges, edgeSet, threatId, le.id, "threat_to_learning", "teaches");
      }
    }
  }

  // --- 9. Threat → Runbook (by threat type) ---
  for (const rb of runbooks) {
    const rbThreat = rb.metadata?.threatType || rb.metadata?.threat_type;
    if (rbThreat) {
      const threatId = `threat-${rbThreat.toLowerCase().replace(/\s+/g, "-")}`;
      if (nodeMap.has(threatId)) {
        addEdge(edges, edgeSet, threatId, rb.id, "threat_to_runbook", "responds");
      }
    }
  }

  return edges;
}

function addEdge(
  edges: GraphEdge[],
  edgeSet: Set<string>,
  source: string,
  target: string,
  type: string,
  label: string
) {
  const key = `${source}→${target}`;
  if (edgeSet.has(key)) return;
  edgeSet.add(key);
  edges.push({
    id: `edge-${edges.length + 1}`,
    source,
    target,
    type,
    label,
  });
}
