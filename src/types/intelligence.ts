/**
 * Types for the Threat Pattern Detection Engine.
 * Used across intelligence services, API routes, and the dashboard UI.
 */

// --- Threat Categories (reuse from learning.ts) ---
export type ThreatCategory =
  | "Credential Theft"
  | "Phishing"
  | "Malware"
  | "Ransomware"
  | "Data Exfiltration"
  | "IAM Misconfiguration"
  | "Insider Threat"
  | "API Key Exposure"
  | "Privilege Escalation"
  | "DDoS"
  | "Supply Chain Attack"
  | "Unknown";

// --- Report Sub-Structures ---

export interface ThreatEntry {
  name: string;
  category: ThreatCategory;
  occurrences: number;
  severity: string;
}

export interface EmergingThreat {
  name: string;
  lastMonthCount: number;
  currentMonthCount: number;
  growthPercent: number;
}

export interface RootCauseEntry {
  cause: string;
  occurrences: number;
  trend: "Increasing" | "Stable" | "Decreasing";
  sources: string[];
}

export interface ControlEntry {
  control: string;
  successRate: number;
  timesApplied: number;
}

export interface ThreatTrendPoint {
  month: string;
  category: string;
  count: number;
}

// --- Main Intelligence Report ---

export interface ThreatIntelligenceReport {
  securityPosture: string;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  topThreats: ThreatEntry[];
  emergingThreats: EmergingThreat[];
  recurringRootCauses: RootCauseEntry[];
  mostEffectiveControls: ControlEntry[];
  recommendations: {
    immediate: string[];
    strategic: string[];
  };
  threatForecast: string;
  executiveSummary: string;
  threatTrends: ThreatTrendPoint[];
  analysisMetadata: {
    totalIncidentsAnalyzed: number;
    totalPostmortemsAnalyzed: number;
    totalLearningEventsAnalyzed: number;
    totalMemoriesAnalyzed: number;
    totalAnalysesUsed: number;
    generatedAt: string;
    analysisMethod: "gemini" | "statistical";
  };
}

// --- Database Row ---

export interface StoredIntelligenceReport {
  id: string;
  report: ThreatIntelligenceReport;
  created_at: string;
}

// --- Aggregated Data Bundle (internal pipeline) ---

export interface AggregatedThreatData {
  incidents: {
    id: string;
    title: string;
    description: string;
    severity: string;
    status: string;
    source: string | null;
    created_at: string;
  }[];
  postmortems: {
    id: string;
    incident_id: string;
    root_cause: string;
    resolution: string;
    lessons_learned: string;
    resolution_time_minutes: number;
    created_at: string;
  }[];
  learningEvents: {
    id: string;
    incident_id: string;
    threat_type: string;
    knowledge_summary: string | null;
    status: string;
    created_at: string;
  }[];
  analyses: {
    id: string;
    incident_id: string;
    root_cause: string;
    recommended_actions: string[];
    analysis_summary: string;
    created_at: string;
  }[];
  memories: {
    id: string;
    text: string;
    metadata: Record<string, string>;
    relevance_score: number;
  }[];
}

// --- Pattern Detection Output ---

export interface DetectedPatterns {
  threatDistribution: { name: string; count: number }[];
  emergingThreats: EmergingThreat[];
  rootCauseCounts: { cause: string; count: number; sources: string[] }[];
  resolutionEffectiveness: ControlEntry[];
  totalDataPoints: number;
}

// --- Trend Calculation Output ---

export interface TrendData {
  monthlyThreatTrends: ThreatTrendPoint[];
  rootCauseTrends: { cause: string; trend: "Increasing" | "Stable" | "Decreasing"; occurrences: number }[];
  resolutionTimeTrend: { month: string; avgMinutes: number }[];
}
