import { GoogleGenAI } from "@google/genai";
import type { ReportContent } from "@/types/report";
import type { ReportContext } from "./buildReportContext";
import { generateTimeline } from "./generateTimeline";

const API_KEY = process.env.GEMINI_API_KEY;

/**
 * Uses Gemini to generate a full executive report from the gathered context.
 */
export async function generateExecutiveReport(
  ctx: ReportContext
): Promise<ReportContent> {
  const timeline = generateTimeline(ctx);

  if (!API_KEY) {
    // Fallback: deterministic report when no API key
    return buildFallbackReport(ctx, timeline);
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const historicalContext = ctx.memories.length > 0
    ? ctx.memories.slice(0, 3).map((m, i) => `Memory ${i + 1}: ${m.text}`).join("\n")
    : "No historical memories available.";

  const prompt = `You are a senior security incident manager at a Fortune 500 company.

Generate an executive security incident report based on the following data.

## Incident Details
Title: ${ctx.incident.title}
Description: ${ctx.incident.description}
Severity: ${ctx.incident.severity}
Status: ${ctx.incident.status}
Source: ${ctx.incident.source || "Security Monitoring System"}
Created: ${ctx.incident.created_at}

## Postmortem
${ctx.postmortem
  ? `Root Cause: ${ctx.postmortem.root_cause}
Resolution: ${ctx.postmortem.resolution}
Lessons Learned: ${ctx.postmortem.lessons_learned}
Resolution Time: ${ctx.postmortem.resolution_time_minutes} minutes`
  : "No postmortem available yet."}

## Organizational Memory (Hindsight)
${historicalContext}
Similar incidents found: ${ctx.similarIncidentCount}

## Learning Event
${ctx.learningEvent
  ? `Threat Category: ${ctx.learningEvent.threat_type}
Knowledge Summary: ${ctx.learningEvent.knowledge_summary}`
  : "No learning event processed yet."}

## Requirements
Generate a structured executive report with these EXACT fields as JSON:

1. executiveSummary: A 3-4 sentence professional executive summary. Use executive-friendly language.
2. riskLevel: One of "Low", "Medium", "High", "Critical" based on the severity and impact.
3. businessImpact: An object with fields: operationalImpact, dataExposureRisk, serviceAvailability, financialRisk, reputationRisk (each a 1-sentence assessment).
4. rootCauseAnalysis: An object with: rootCause (detailed string), contributingFactors (array of 3-4 strings), historicalSimilarities (string about past patterns).
5. resolution: An object with: actionsTaken (string), resolutionStrategy (string), timeToResolution (string like "X minutes").
6. lessonsLearned: Array of 3-5 actionable lesson strings.
7. recommendations: An object with: shortTerm (array of 2-3 strings), longTerm (array of 2-3 strings).
8. historicalContext: An object with: similarIncidents (number), mostCommonCause (string), mostEffectiveRemediation (string).

IMPORTANT: Do NOT include executiveSummary field twice. Do NOT hallucinate facts. Base everything on the provided data.

Respond ONLY as JSON matching this schema exactly.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { temperature: 0.3, responseMimeType: "application/json" },
    });

    if (response.text) {
      const generated = JSON.parse(response.text);

      // Merge Gemini output with our deterministic fields
      const report: ReportContent = {
        executiveSummary: generated.executiveSummary || "Report generated successfully.",
        riskLevel: generated.riskLevel || mapSeverityToRisk(ctx.incident.severity),
        incidentOverview: {
          title: ctx.incident.title,
          severity: ctx.incident.severity,
          status: ctx.incident.status,
          source: ctx.incident.source || "Security Monitoring System",
          createdAt: ctx.incident.created_at,
          resolvedAt: ctx.postmortem?.created_at || null,
          resolutionTimeMinutes: ctx.postmortem?.resolution_time_minutes || null,
        },
        businessImpact: generated.businessImpact || {
          operationalImpact: "Assessment pending.",
          dataExposureRisk: "Assessment pending.",
          serviceAvailability: "Assessment pending.",
          financialRisk: "Assessment pending.",
          reputationRisk: "Assessment pending.",
        },
        timeline,
        rootCauseAnalysis: generated.rootCauseAnalysis || {
          rootCause: ctx.postmortem?.root_cause || "Under investigation.",
          contributingFactors: [],
          historicalSimilarities: "No historical data available.",
        },
        resolution: generated.resolution || {
          actionsTaken: ctx.postmortem?.resolution || "Pending resolution.",
          resolutionStrategy: "Standard incident response protocol.",
          timeToResolution: ctx.postmortem
            ? `${ctx.postmortem.resolution_time_minutes} minutes`
            : "Ongoing",
        },
        lessonsLearned: generated.lessonsLearned || (ctx.postmortem?.lessons_learned
          ? [ctx.postmortem.lessons_learned]
          : []),
        recommendations: generated.recommendations || {
          shortTerm: ["Review and patch affected systems."],
          longTerm: ["Implement comprehensive monitoring."],
        },
        historicalContext: generated.historicalContext || {
          similarIncidents: ctx.similarIncidentCount,
          mostCommonCause: "Insufficient data.",
          mostEffectiveRemediation: "Insufficient data.",
        },
        organizationalLearning: {
          memoriesContributed: ctx.learningEvent ? 1 : 0,
          threatCategory: ctx.learningEvent?.threat_type || "Uncategorized",
          copilotKnowledgeUpdated: !!ctx.learningEvent,
        },
      };

      return report;
    }
  } catch (err) {
    console.error("[ReportGenerator] Gemini failed, using fallback:", err);
  }

  return buildFallbackReport(ctx, timeline);
}

function mapSeverityToRisk(severity: string): ReportContent["riskLevel"] {
  switch (severity) {
    case "critical": return "Critical";
    case "high": return "High";
    case "medium": return "Medium";
    default: return "Low";
  }
}

function buildFallbackReport(
  ctx: ReportContext,
  timeline: { time: string; event: string }[]
): ReportContent {
  return {
    executiveSummary: `A ${ctx.incident.severity} severity security incident "${ctx.incident.title}" was detected and ${ctx.incident.status === "resolved" ? "resolved" : "is under investigation"}. ${ctx.postmortem ? `Root cause was identified as: ${ctx.postmortem.root_cause.substring(0, 100)}.` : "Postmortem pending."} ${ctx.similarIncidentCount > 0 ? `${ctx.similarIncidentCount} similar incidents were found in organizational memory.` : ""}`,
    riskLevel: mapSeverityToRisk(ctx.incident.severity),
    incidentOverview: {
      title: ctx.incident.title,
      severity: ctx.incident.severity,
      status: ctx.incident.status,
      source: ctx.incident.source || "Security Monitoring System",
      createdAt: ctx.incident.created_at,
      resolvedAt: ctx.postmortem?.created_at || null,
      resolutionTimeMinutes: ctx.postmortem?.resolution_time_minutes || null,
    },
    businessImpact: {
      operationalImpact: "Assessment requires further analysis.",
      dataExposureRisk: ctx.incident.severity === "critical" ? "High" : "Moderate",
      serviceAvailability: "Minimal disruption reported.",
      financialRisk: "Under evaluation.",
      reputationRisk: ctx.incident.severity === "critical" ? "Significant" : "Low",
    },
    timeline,
    rootCauseAnalysis: {
      rootCause: ctx.postmortem?.root_cause || "Under investigation.",
      contributingFactors: ["Requires further analysis."],
      historicalSimilarities: ctx.similarIncidentCount > 0
        ? `${ctx.similarIncidentCount} similar incidents found in organizational memory.`
        : "No historical similarities found.",
    },
    resolution: {
      actionsTaken: ctx.postmortem?.resolution || "Resolution pending.",
      resolutionStrategy: "Standard incident response protocol.",
      timeToResolution: ctx.postmortem
        ? `${ctx.postmortem.resolution_time_minutes} minutes`
        : "Ongoing",
    },
    lessonsLearned: ctx.postmortem?.lessons_learned
      ? [ctx.postmortem.lessons_learned]
      : ["Pending postmortem analysis."],
    recommendations: {
      shortTerm: ["Review affected systems.", "Rotate credentials if applicable."],
      longTerm: ["Implement monitoring improvements.", "Review security policies."],
    },
    historicalContext: {
      similarIncidents: ctx.similarIncidentCount,
      mostCommonCause: "Insufficient historical data.",
      mostEffectiveRemediation: "Insufficient historical data.",
    },
    organizationalLearning: {
      memoriesContributed: ctx.learningEvent ? 1 : 0,
      threatCategory: ctx.learningEvent?.threat_type || "Uncategorized",
      copilotKnowledgeUpdated: !!ctx.learningEvent,
    },
  };
}
