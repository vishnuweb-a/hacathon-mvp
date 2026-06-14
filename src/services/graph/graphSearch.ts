/**
 * Graph Search
 * Searches graph nodes by label and description.
 */

import type { GraphNode, GraphSearchResult } from "@/types/graph";

/**
 * Search graph nodes by query string.
 * Matches against label and description (case-insensitive).
 */
export function searchGraph(
  nodes: GraphNode[],
  query: string
): GraphSearchResult {
  const q = query.toLowerCase().trim();

  if (!q) {
    return { query, results: [], totalMatches: 0 };
  }

  const results = nodes.filter((n) => {
    const label = n.label.toLowerCase();
    const desc = n.description.toLowerCase();
    const type = n.type.toLowerCase().replace(/_/g, " ");
    return label.includes(q) || desc.includes(q) || type.includes(q);
  });

  // Sort by relevance (exact label match first, then influence score)
  results.sort((a, b) => {
    const aExact = a.label.toLowerCase() === q ? 1 : 0;
    const bExact = b.label.toLowerCase() === q ? 1 : 0;
    if (aExact !== bExact) return bExact - aExact;

    const aStartsWith = a.label.toLowerCase().startsWith(q) ? 1 : 0;
    const bStartsWith = b.label.toLowerCase().startsWith(q) ? 1 : 0;
    if (aStartsWith !== bStartsWith) return bStartsWith - aStartsWith;

    return b.influenceScore - a.influenceScore;
  });

  return {
    query,
    results: results.slice(0, 20),
    totalMatches: results.length,
  };
}
