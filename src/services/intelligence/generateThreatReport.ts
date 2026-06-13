/**
 * Threat Intelligence Report Generator
 * Orchestrates the full intelligence pipeline:
 * Aggregate → Detect Patterns → Calculate Trends → Gemini Intelligence → Report
 */

import { GoogleGenAI } from "@google/genai";
import { aggregateThreatData } from "./aggregateThreatData";
import { detectPatterns } from "./detectPatterns";
import { calculateTrends } from "./calculateTrends";
import type { ThreatIntelligenceReport } from "@/types/intelligence";

const API_KEY = process.env.GEMINI_API_KEY;

/**
 * Generate a complete threat intelligence report.
 * Uses Gemini for deep analysis, falls back to statistical-only on failure.
 */
export async function generateThreatReport(): Promise<ThreatIntelligenceReport> {
  console.log("[Intelligence] Starting threat intelligence analysis...");

  // Step 1: Aggregate all data
  const aggregatedData = await aggregateThreatData();

  const totalDataPoints =
    aggregatedData.incidents.length +
    aggregatedData.postmortems.length +
    aggregatedData.learningEvents.length +
    aggregatedData.analyses.length +
    aggregatedData.memories.length;

  console.log(`[Intelligence] Aggregated ${totalDataPoints} data points`);

  // Step 2: Detect patterns (statistical analysis)
  const patterns = detectPatterns(aggregatedData);

  // Step 3: Calculate trends
  const trends = calculateTrends(aggregatedData);

  // Step 4: Generate Gemini intelligence (with statistical fallback)
  let report: ThreatIntelligenceReport;
  let method: "gemini" | "statistical" = "statistical";

  if (API_KEY && totalDataPoints > 0) {
    try {
      report = await generateGeminiIntelligence(patterns, trends, aggregatedData);
      method = "gemini";
      console.log("[Intelligence] Gemini intelligence generated successfully");
    } catch (error) {
      console.warn("[Intelligence] Gemini failed, falling back to statistical analysis:", error);
      report = buildStatisticalReport(patterns, trends);
    }
  } else {
    console.log("[Intelligence] Using statistical analysis only (no API key or insufficient data)");
    report = buildStatisticalReport(patterns, trends);
  }

  // Enrich metadata
  report.analysisMetadata = {
    totalIncidentsAnalyzed: aggregatedData.incidents.length,
    totalPostmortemsAnalyzed: aggregatedData.postmortems.length,
    totalLearningEventsAnalyzed: aggregatedData.learningEvents.length,
    totalMemoriesAnalyzed: aggregatedData.memories.length,
    totalAnalysesUsed: aggregatedData.analyses.length,
    generatedAt: new Date().toISOString(),
    analysisMethod: method,
  };

  // Ensure threat trends are always populated
  if (!report.threatTrends || report.threatTrends.length === 0) {
    report.threatTrends = trends.monthlyThreatTrends;
  }

  return report;
}

/**
 * Use Gemini to generate deep intelligence analysis.
 */
async function generateGeminiIntelligence(
  patterns: ReturnType<typeof detectPatterns>,
  trends: ReturnType<typeof calculateTrends>,
  data: Awaited<ReturnType<typeof aggregateThreatData>>
): Promise<ThreatIntelligenceReport> {
  const ai = new GoogleGenAI({ apiKey: API_KEY! });

  const prompt = `You are a senior threat intelligence analyst at a Fortune 500 company's Security Operations Center.

Analyze the following organizational security history and produce a comprehensive threat intelligence report.

=== DATA SOURCES ===

INCIDENTS (${data.incidents.length} total):
${data.incidents.slice(0, 20).map((i) => `- [${i.severity}] ${i.title}: ${i.description.substring(0, 100)}`).join("\n")}

POSTMORTEMS (${data.postmortems.length} total):
${data.postmortems.slice(0, 15).map((p) => `- Root Cause: ${p.root_cause} → Resolution: ${p.resolution} (${p.resolution_time_minutes}min)`).join("\n")}

LEARNING EVENTS (${data.learningEvents.length} total):
${data.learningEvents.slice(0, 15).map((e) => `- [${e.threat_type}] ${e.knowledge_summary || "No summary"}`).join("\n")}

AI ANALYSES (${data.analyses.length} total):
${data.analyses.slice(0, 10).map((a) => `- Root Cause: ${a.root_cause} → Summary: ${a.analysis_summary?.substring(0, 100) || "N/A"}`).join("\n")}

HINDSIGHT MEMORIES (${data.memories.length} total):
${data.memories.slice(0, 10).map((m) => `- ${m.text.substring(0, 100)}`).join("\n")}

=== STATISTICAL ANALYSIS RESULTS ===

THREAT DISTRIBUTION:
${patterns.threatDistribution.map((t) => `- ${t.name}: ${t.count} occurrences`).join("\n")}

EMERGING THREATS (growing):
${patterns.emergingThreats.map((t) => `- ${t.name}: ${t.lastMonthCount} → ${t.currentMonthCount} (+${t.growthPercent}%)`).join("\n") || "None detected"}

ROOT CAUSES:
${patterns.rootCauseCounts.map((r) => `- ${r.cause}: ${r.count} occurrences (sources: ${r.sources.join(", ")})`).join("\n") || "None identified"}

RESOLUTION EFFECTIVENESS:
${patterns.resolutionEffectiveness.map((c) => `- ${c.control}: ${c.successRate}% success (applied ${c.timesApplied} times)`).join("\n") || "No data"}

=== TASKS ===

1. Assess the overall security posture (2-3 word assessment).
2. Determine the risk level (Low, Medium, High, or Critical).
3. Identify the top threats with severity assessment.
4. Identify emerging threats with growth percentages.
5. Surface recurring root causes with trend direction.
6. Rank the most effective security controls.
7. Generate immediate and strategic recommendations.
8. Provide a threat forecast for the next quarter.
9. Write a concise executive summary (2-3 sentences).

=== RESPONSE FORMAT ===

Return ONLY valid JSON matching this exact schema:
{
  "securityPosture": "string (2-3 words)",
  "riskLevel": "Low|Medium|High|Critical",
  "topThreats": [{"name": "string", "category": "string", "occurrences": number, "severity": "string"}],
  "emergingThreats": [{"name": "string", "lastMonthCount": number, "currentMonthCount": number, "growthPercent": number}],
  "recurringRootCauses": [{"cause": "string", "occurrences": number, "trend": "Increasing|Stable|Decreasing", "sources": ["string"]}],
  "mostEffectiveControls": [{"control": "string", "successRate": number, "timesApplied": number}],
  "recommendations": {"immediate": ["string"], "strategic": ["string"]},
  "threatForecast": "string (2-3 sentences about predicted future threats)",
  "executiveSummary": "string (2-3 sentences)",
  "threatTrends": []
}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      temperature: 0.3,
      responseMimeType: "application/json",
    },
  });

  if (!response.text) {
    throw new Error("Gemini returned an empty response");
  }

  const parsed = JSON.parse(response.text) as ThreatIntelligenceReport;

  // Validate required fields
  if (!parsed.securityPosture || !parsed.riskLevel) {
    throw new Error("Gemini response missing required fields");
  }

  // Merge in the statistical trend data (Gemini can't generate time-series data)
  parsed.threatTrends = trends.monthlyThreatTrends;

  return parsed;
}

/**
 * Build a report from statistical analysis only (Gemini fallback).
 */
function buildStatisticalReport(
  patterns: ReturnType<typeof detectPatterns>,
  trends: ReturnType<typeof calculateTrends>
): ThreatIntelligenceReport {
  const topThreat = patterns.threatDistribution[0];
  const topEmerging = patterns.emergingThreats[0];

  // Determine risk level from data
  let riskLevel: "Low" | "Medium" | "High" | "Critical" = "Low";
  if (patterns.totalDataPoints > 50 && patterns.emergingThreats.length > 5) {
    riskLevel = "Critical";
  } else if (patterns.totalDataPoints > 20 && patterns.emergingThreats.length > 2) {
    riskLevel = "High";
  } else if (patterns.totalDataPoints > 10 || patterns.emergingThreats.length > 0) {
    riskLevel = "Medium";
  }

  // Determine security posture
  const posture =
    riskLevel === "Critical" ? "Critical Risk" :
    riskLevel === "High" ? "Elevated Risk" :
    riskLevel === "Medium" ? "Moderate Risk" : "Healthy";

  return {
    securityPosture: posture,
    riskLevel,
    topThreats: patterns.threatDistribution.slice(0, 5).map((t) => ({
      name: t.name,
      category: t.name as any,
      occurrences: t.count,
      severity: t.count > 5 ? "High" : t.count > 2 ? "Medium" : "Low",
    })),
    emergingThreats: patterns.emergingThreats.slice(0, 5),
    recurringRootCauses: trends.rootCauseTrends.slice(0, 5).map((r) => ({
      cause: r.cause,
      occurrences: r.occurrences,
      trend: r.trend,
      sources: ["Postmortems", "AI Analyses"],
    })),
    mostEffectiveControls: patterns.resolutionEffectiveness.slice(0, 5),
    recommendations: {
      immediate: topThreat
        ? [`Address ${topThreat.name} incidents (${topThreat.count} occurrences)`, "Review all open incidents", "Ensure all critical incidents have postmortems"]
        : ["Set up incident monitoring", "Begin incident response training"],
      strategic: topEmerging
        ? [`Mitigate emerging ${topEmerging.name} trend (+${topEmerging.growthPercent}%)`, "Implement proactive threat detection", "Conduct organization-wide security assessment"]
        : ["Establish security baseline metrics", "Implement continuous learning pipeline"],
    },
    threatForecast: topEmerging
      ? `Based on current trends, ${topEmerging.name} incidents are likely to continue increasing over the next quarter (currently +${topEmerging.growthPercent}% growth). Recommend prioritizing preventive controls for this threat category.`
      : "Insufficient trend data to generate a reliable forecast. Continue collecting incident data for more accurate predictions.",
    executiveSummary: patterns.totalDataPoints > 0
      ? `Analysis of ${patterns.totalDataPoints} security data points reveals ${patterns.threatDistribution.length} distinct threat categories. ${topThreat ? `${topThreat.name} is the most prevalent threat with ${topThreat.count} occurrences.` : ""} ${topEmerging ? `${topEmerging.name} shows emerging growth of +${topEmerging.growthPercent}%.` : "No emerging threat trends detected."}`
      : "Not enough historical data to identify trends. Continue logging incidents and postmortems to build intelligence baseline.",
    threatTrends: trends.monthlyThreatTrends,
    analysisMetadata: {
      totalIncidentsAnalyzed: 0,
      totalPostmortemsAnalyzed: 0,
      totalLearningEventsAnalyzed: 0,
      totalMemoriesAnalyzed: 0,
      totalAnalysesUsed: 0,
      generatedAt: new Date().toISOString(),
      analysisMethod: "statistical",
    },
  };
}
