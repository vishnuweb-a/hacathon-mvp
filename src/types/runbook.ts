/**
 * Types for the Adaptive Runbook Intelligence Engine.
 */

// --- Runbook Step ---

export interface RunbookStep {
  name: string;
  occurrences: number;
  successRate: number;
  averageResolutionMinutes: number;
  failureRate: number;
  rank: number;
  trend: "Improving" | "Stable" | "Declining";
  sources: string[]; // incident IDs / postmortem IDs that informed this step
}

// --- Obsolete Step ---

export interface ObsoleteStep {
  name: string;
  successRate: number;
  occurrences: number;
  lastUsed: string | null;
  recommendation: "Deprecate" | "Review" | "Replace";
  reason: string;
}

// --- Adaptive Runbook ---

export interface AdaptiveRunbook {
  threatType: string;
  steps: RunbookStep[];
  obsoleteSteps: ObsoleteStep[];
  confidenceScore: number; // 0-100
  totalIncidentsAnalyzed: number;
  totalMemoriesUsed: number;
  recommendations: {
    newSteps: string[];
    reorderSuggestions: string[];
    riskWarnings: string[];
  };
  generatedAt: string;
  analysisMethod: "gemini" | "statistical";
}

// --- Database Row ---

export interface StoredRunbook {
  id: string;
  threat_type: string;
  runbook: AdaptiveRunbook;
  confidence_score: number;
  generated_at: string;
}

// --- Step Metric (DB row) ---

export interface RunbookStepMetric {
  id: string;
  threat_type: string;
  step_name: string;
  occurrences: number;
  success_rate: number;
  average_resolution_time: number;
  created_at: string;
}

// --- Timeline ---

export interface RunbookTimelineEntry {
  date: string;
  type: "step_added" | "step_promoted" | "step_deprecated" | "step_improved" | "runbook_generated";
  label: string;
  description: string;
}

export interface RunbookTimeline {
  threatType: string;
  entries: RunbookTimelineEntry[];
}

// --- API Responses ---

export interface RunbookGenerateResponse {
  success: boolean;
  data: StoredRunbook[] | null;
  error?: string;
}

export interface RunbookLatestResponse {
  success: boolean;
  data: StoredRunbook[] | null;
  error?: string;
}
