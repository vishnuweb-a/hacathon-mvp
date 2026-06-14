/**
 * Graph Generator — Orchestrator
 * Calls buildNodes → buildEdges → calculateInfluence to produce the full graph.
 */

import { buildNodes } from "./buildNodes";
import { buildEdges } from "./buildEdges";
import { calculateInfluence, getMostInfluential, getMostConnected } from "./calculateInfluence";
import type { OrganizationalGraph, GraphNodeType } from "@/types/graph";

/**
 * Generate the full organizational memory graph.
 */
export async function generateGraph(): Promise<OrganizationalGraph> {
  // 1. Build nodes from all data sources
  const nodes = await buildNodes();

  // 2. Build edges from node relationships
  const edges = buildEdges(nodes);

  // 3. Calculate influence scores
  calculateInfluence(nodes, edges);

  // 4. Compute stats
  const countByType = (type: GraphNodeType) =>
    nodes.filter((n) => n.type === type).length;

  const mostInfluential = getMostInfluential(nodes, "recommendation") || getMostInfluential(nodes);
  const mostConnected = getMostConnected(nodes, edges, "threat");

  return {
    nodes,
    edges,
    stats: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      mostInfluentialMemory: mostInfluential?.label || "Enable MFA",
      mostConnectedThreat: mostConnected?.label || "Credential Theft",
      threatCount: countByType("threat"),
      incidentCount: countByType("incident"),
      learningEventCount: countByType("learning_event"),
      runbookCount: countByType("runbook"),
      reportCount: countByType("intelligence"),
      recommendationCount: countByType("recommendation"),
    },
  };
}
