export type ThreatCategory =
  | "Credential Theft"
  | "Phishing"
  | "Malware"
  | "Ransomware"
  | "Data Exfiltration"
  | "IAM Misconfiguration"
  | "Insider Threat"
  | "API Key Exposure"
  | "DDoS"
  | "Supply Chain Attack"
  | "Unknown";

export interface ExtractedKnowledge {
  threatType: ThreatCategory;
  rootCause: string;
  resolution: string;
  lessonsLearned: string;
  preventiveMeasures: string[];
  resolutionTimeMinutes: number;
  severity: string;
  incidentCategory: string;
  sourceSystem: string;
}

export interface LearningEvent {
  id: string;
  incident_id: string;
  memory_id: string | null;
  threat_type: string;
  knowledge_summary: string | null;
  status: "completed" | "pending" | "failed";
  created_at: string;
}

export interface LearningStats {
  totalMemories: number;
  threatCategories: { category: string; count: number }[];
  avgResolutionTimeMinutes: number;
  recentEvents: LearningEvent[];
}
