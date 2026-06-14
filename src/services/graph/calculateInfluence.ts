/**
 * Graph Influence Calculator
 * Computes an influence score (0-100) for each node based on connectivity,
 * reference count, and usage patterns.
 */

import type { GraphNode, GraphEdge } from "@/types/graph";

/**
 * Calculate influence scores for all nodes in the graph.
 * Mutates the node objects in-place (sets influenceScore).
 */
export function calculateInfluence(
  nodes: GraphNode[],
  edges: GraphEdge[]
): void {
  // Build adjacency counts
  const inDegree: Record<string, number> = {};
  const outDegree: Record<string, number> = {};

  for (const n of nodes) {
    inDegree[n.id] = 0;
    outDegree[n.id] = 0;
  }

  for (const e of edges) {
    inDegree[e.target] = (inDegree[e.target] || 0) + 1;
    outDegree[e.source] = (outDegree[e.source] || 0) + 1;
  }

  // Max degree for normalization
  const maxDegree = Math.max(
    1,
    ...Object.values(inDegree).map((v) => v),
    ...Object.values(outDegree).map((v) => v)
  );

  for (const node of nodes) {
    const inD = inDegree[node.id] || 0;
    const outD = outDegree[node.id] || 0;
    const totalDegree = inD + outD;

    // Connectivity score (0-50)
    const connectivityScore = (totalDegree / maxDegree) * 50;

    // Type-based weight (0-30): threats and recommendations have higher base influence
    const typeWeights: Record<string, number> = {
      threat: 25,
      recommendation: 22,
      runbook: 20,
      learning_event: 18,
      memory: 20,
      intelligence: 15,
      incident: 12,
      postmortem: 10,
    };
    const typeScore = typeWeights[node.type] || 10;

    // Existing influence (from metadata, e.g. confidence scores)
    const existingScore = Math.min(node.influenceScore || 0, 20);

    // Composite score
    const rawScore = connectivityScore + typeScore + existingScore;
    node.influenceScore = Math.min(Math.round(rawScore), 100);
  }
}

/**
 * Find the most influential node of a given type.
 */
export function getMostInfluential(
  nodes: GraphNode[],
  type?: string
): GraphNode | null {
  const filtered = type ? nodes.filter((n) => n.type === type) : nodes;
  if (filtered.length === 0) return null;
  return filtered.reduce((best, n) =>
    n.influenceScore > best.influenceScore ? n : best
  );
}

/**
 * Find the most connected node (highest total edge count).
 */
export function getMostConnected(
  nodes: GraphNode[],
  edges: GraphEdge[],
  type?: string
): GraphNode | null {
  const filtered = type ? nodes.filter((n) => n.type === type) : nodes;
  if (filtered.length === 0) return null;

  let bestNode: GraphNode | null = null;
  let bestCount = 0;

  for (const node of filtered) {
    const count = edges.filter(
      (e) => e.source === node.id || e.target === node.id
    ).length;
    if (count > bestCount) {
      bestCount = count;
      bestNode = node;
    }
  }

  return bestNode;
}
