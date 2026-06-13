/**
 * Types for the Memory Provenance Explorer.
 * Used across provenance services, API routes, and the dashboard UI.
 */

// --- Source & Target Types ---

export type ProvenanceSourceType =
  | "incident"
  | "postmortem"
  | "learning_event"
  | "memory"
  | "analysis";

export type ProvenanceTargetType =
  | "recommendation"
  | "analysis"
  | "report"
  | "intelligence"
  | "copilot_response";

// --- Database Row ---

export interface ProvenanceLog {
  id: string;
  source_type: ProvenanceSourceType;
  source_id: string;
  target_type: ProvenanceTargetType;
  target_id: string;
  relevance: number;
  context: string | null;
  created_at: string;
}

// --- Enriched Source (resolved from DB/Hindsight) ---

export interface EnrichedSource {
  type: ProvenanceSourceType;
  id: string;
  relevance: number;
  context: string | null;
  /** The actual record data, varies by type */
  data: {
    title?: string;
    description?: string;
    severity?: string;
    status?: string;
    root_cause?: string;
    resolution?: string;
    lessons_learned?: string;
    threat_type?: string;
    knowledge_summary?: string;
    text?: string;
    resolution_time_minutes?: number;
    created_at?: string;
    analysis_summary?: string;
    recommended_actions?: string[];
  };
}

// --- Evidence Chain (full provenance for a target) ---

export interface EvidenceChain {
  targetType: ProvenanceTargetType;
  targetId: string;
  sources: EnrichedSource[];
  memoryChain: MemoryChainNode[];
  summary: {
    totalSources: number;
    incidentCount: number;
    postmortemCount: number;
    learningEventCount: number;
    memoryCount: number;
    analysisCount: number;
    avgRelevance: number;
  };
}

// --- Memory Chain (reasoning lineage) ---

export interface MemoryChainNode {
  step: number;
  type: ProvenanceSourceType | "recommendation";
  id: string;
  label: string;
  description: string;
  timestamp: string;
}

// --- Memory Strength ---

export interface MemoryStrength {
  memoryId: string;
  label: string;
  referenceCount: number;
  successCount: number;
  successRate: number;
  strengthScore: number; // 0-100
  lastReferenced: string | null;
}

// --- Memory Timeline ---

export interface MemoryTimelineEntry {
  id: string;
  date: string;
  type: "created" | "referenced" | "updated" | "learning";
  label: string;
  description: string;
  sourceType: ProvenanceSourceType;
  sourceId: string;
}

export interface MemoryTimeline {
  category: string;
  entries: MemoryTimelineEntry[];
}

// --- API Response Shapes ---

export interface ProvenanceRecommendationResponse {
  success: boolean;
  data: EvidenceChain | null;
  error?: string;
}

export interface ProvenanceMemoryResponse {
  success: boolean;
  data: {
    timeline: MemoryTimeline;
    strength: MemoryStrength;
  } | null;
  error?: string;
}

export interface ProvenanceThreatResponse {
  success: boolean;
  data: {
    category: string;
    sources: EnrichedSource[];
    timeline: MemoryTimeline;
    totalEvidence: number;
  } | null;
  error?: string;
}

export interface ProvenanceSearchResponse {
  success: boolean;
  data: {
    query: string;
    results: EnrichedSource[];
    relatedChains: { targetType: string; targetId: string; sourceCount: number }[];
  } | null;
  error?: string;
}

// --- Top Influential Memories (for dashboard widget) ---

export interface InfluentialMemory {
  id: string;
  label: string;
  category: string;
  referenceCount: number;
  strengthScore: number;
}
