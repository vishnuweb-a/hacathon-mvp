/**
 * Types for the Organizational Memory Graph.
 * Defines nodes, edges, and API response shapes for the knowledge graph visualization.
 */

// --- Node Types ---

export type GraphNodeType =
  | "threat"
  | "incident"
  | "postmortem"
  | "learning_event"
  | "memory"
  | "runbook"
  | "recommendation"
  | "intelligence";

// --- Graph Node ---

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  description: string;
  influenceScore: number; // 0-100
  metadata: Record<string, any>;
  // Physics simulation fields (set on client)
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

// --- Graph Edge ---

export interface GraphEdge {
  id: string;
  source: string; // node id
  target: string; // node id
  type: string;   // e.g. "threat_to_incident"
  label: string;
}

// --- Full Graph ---

export interface OrganizationalGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: GraphStats;
}

export interface GraphStats {
  totalNodes: number;
  totalEdges: number;
  mostInfluentialMemory: string;
  mostConnectedThreat: string;
  threatCount: number;
  incidentCount: number;
  learningEventCount: number;
  runbookCount: number;
  reportCount: number;
  recommendationCount: number;
}

// --- Node Detail (expanded info) ---

export interface GraphNodeDetail {
  node: GraphNode;
  connectedNodes: GraphNode[];
  incomingEdges: GraphEdge[];
  outgoingEdges: GraphEdge[];
  stats: {
    totalConnections: number;
    inDegree: number;
    outDegree: number;
  };
}

// --- Search ---

export interface GraphSearchResult {
  query: string;
  results: GraphNode[];
  totalMatches: number;
}

// --- API Responses ---

export interface GraphResponse {
  success: boolean;
  data: OrganizationalGraph | null;
  error?: string;
}

export interface GraphNodeResponse {
  success: boolean;
  data: GraphNodeDetail | null;
  error?: string;
}

export interface GraphSearchResponse {
  success: boolean;
  data: GraphSearchResult | null;
  error?: string;
}

// --- Node color mapping ---

export const NODE_COLORS: Record<GraphNodeType, string> = {
  threat: "#ef4444",         // Red
  incident: "#f97316",       // Orange
  postmortem: "#f59e0b",     // Amber
  learning_event: "#06b6d4", // Cyan
  memory: "#8b5cf6",         // Violet
  runbook: "#a855f7",        // Purple
  recommendation: "#6366f1", // Indigo
  intelligence: "#10b981",   // Green
};

export const NODE_LABELS: Record<GraphNodeType, string> = {
  threat: "Threat",
  incident: "Incident",
  postmortem: "Postmortem",
  learning_event: "Learning Event",
  memory: "Memory",
  runbook: "Runbook",
  recommendation: "Recommendation",
  intelligence: "Intelligence",
};
