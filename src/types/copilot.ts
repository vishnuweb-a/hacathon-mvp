export interface HistoricalEvidence {
  incident_id: string;
  title: string;
  severity: string;
  root_cause: string;
  resolution: string;
  relevance_score?: number;
}

export interface CopilotResponse {
  summary: string;
  historicalEvidence: HistoricalEvidence[];
  recommendations: string[];
  confidence: "High" | "Medium" | "Low";
  sources: string[];
}

export interface ChatHistoryEntry {
  id: string;
  message: string;
  response: CopilotResponse;
  created_at: string;
}
