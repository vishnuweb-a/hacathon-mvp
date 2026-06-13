import { GoogleGenAI } from "@google/genai";
import type { OverviewMetrics } from "./getOverviewMetrics";
import type { ThreatMetrics } from "./getThreatMetrics";
import type { LearningMetrics } from "./getLearningMetrics";

const API_KEY = process.env.GEMINI_API_KEY;

export interface ExecutiveInsight {
  securityPosture: string;
  emergingThreat: string;
  recommendation: string;
}

export async function getExecutiveInsights(
  overview: OverviewMetrics,
  threats: ThreatMetrics,
  learning: LearningMetrics
): Promise<ExecutiveInsight> {
  // Fallback if no API key or no data
  if (!API_KEY || overview.totalIncidents === 0) {
    return {
      securityPosture: overview.openIncidents > 5 ? "Elevated Risk" : overview.openIncidents > 0 ? "Moderate Risk" : "Healthy",
      emergingThreat: threats.mostCommonThreat || "No threats detected",
      recommendation: "Continue monitoring and ensure all incidents have postmortems.",
    };
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const prompt = `You are the Chief Information Security Officer analyzing your organization's security dashboard.

Current Metrics:
- Total Incidents: ${overview.totalIncidents}
- Critical Incidents: ${overview.criticalIncidents}
- Open Incidents: ${overview.openIncidents}
- Resolved Incidents: ${overview.resolvedIncidents}
- Average Resolution Time: ${overview.avgResolutionTimeMinutes} minutes
- Most Common Threat: ${threats.mostCommonThreat}
- Threat Categories: ${threats.threatDistribution.map((t) => `${t.name} (${t.value})`).join(", ")}
- Total Learning Events: ${learning.totalLearningEvents}
- Failed Learning Events: ${learning.failedEvents}

Provide a concise executive security summary with exactly 3 fields:
1. securityPosture: A 2-3 word assessment (e.g., "Moderate Risk", "Healthy", "Elevated Risk")
2. emergingThreat: The single biggest emerging threat based on the data (1 sentence max)
3. recommendation: One specific actionable recommendation (1 sentence max)

Respond ONLY as JSON:
{
  "securityPosture": "string",
  "emergingThreat": "string",
  "recommendation": "string"
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { temperature: 0.3, responseMimeType: "application/json" },
    });

    if (response.text) {
      return JSON.parse(response.text) as ExecutiveInsight;
    }
  } catch (err) {
    console.error("[Executive Insights] Gemini failed:", err);
  }

  // Fallback
  return {
    securityPosture: overview.openIncidents > 5 ? "Elevated Risk" : "Moderate Risk",
    emergingThreat: threats.mostCommonThreat,
    recommendation: "Review open incidents and ensure continuous learning is active.",
  };
}
