export interface ReportContent {
  executiveSummary: string;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  incidentOverview: {
    title: string;
    severity: string;
    status: string;
    source: string;
    createdAt: string;
    resolvedAt: string | null;
    resolutionTimeMinutes: number | null;
  };
  businessImpact: {
    operationalImpact: string;
    dataExposureRisk: string;
    serviceAvailability: string;
    financialRisk: string;
    reputationRisk: string;
  };
  timeline: {
    time: string;
    event: string;
  }[];
  rootCauseAnalysis: {
    rootCause: string;
    contributingFactors: string[];
    historicalSimilarities: string;
  };
  resolution: {
    actionsTaken: string;
    resolutionStrategy: string;
    timeToResolution: string;
  };
  lessonsLearned: string[];
  recommendations: {
    shortTerm: string[];
    longTerm: string[];
  };
  historicalContext: {
    similarIncidents: number;
    mostCommonCause: string;
    mostEffectiveRemediation: string;
  };
  organizationalLearning: {
    memoriesContributed: number;
    threatCategory: string;
    copilotKnowledgeUpdated: boolean;
  };
}

export interface Report {
  id: string;
  incident_id: string;
  report_content: ReportContent;
  created_at: string;
}
