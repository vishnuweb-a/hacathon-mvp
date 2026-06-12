export interface IncidentAnalysis {
  id: string;
  incident_id: string;
  root_cause: string;
  confidence: number; // 0-100
  recommended_actions: string[];
  estimated_resolution_time: string;
  recommended_runbook: string;
  analysis_summary: string;
  created_at: string;
}

export interface GeminiAnalysisOutput {
  rootCause: string;
  confidence: number;
  summary: string;
  recommendedActions: string[];
  estimatedResolutionTime: string;
  recommendedRunbook: string;
}
