/**
 * Builds the Gemini prompt by combining current incident data
 * with historical memories from Hindsight.
 */

import type { Incident } from "@/types/incident";
import type { SearchResult } from "@/lib/hindsight";

/**
 * Construct the full prompt for Gemini analysis.
 */
export function buildAnalysisPrompt(
  incident: Incident,
  memories: SearchResult[]
): string {
  // --- System Instructions ---
  const systemPrompt = `You are a Senior Security Operations Center (SOC) Analyst with 15+ years of experience.

Analyze the security incident below using the provided historical context from similar past incidents.

You MUST respond with a valid JSON object containing exactly these fields:
{
  "rootCause": "The most likely root cause (e.g., Credential Theft, Phishing Attack, Privilege Escalation, IAM Misconfiguration, Malware Infection, Insider Threat)",
  "confidence": <number 0-100>,
  "summary": "A 2-3 sentence summary synthesizing the current incident with historical context. Reference specific past incidents if relevant.",
  "recommendedActions": ["Action 1", "Action 2", "Action 3", ...],
  "estimatedResolutionTime": "e.g., 15-30 minutes or 2-4 hours",
  "recommendedRunbook": "Name of the most relevant runbook (e.g., Credential Compromise Response, AWS IAM Escalation Investigation)"
}

Rules:
- Confidence should be higher if historical memories strongly match the current incident.
- If no historical memories are provided, analyze based on the incident details alone and set confidence lower.
- Recommended actions should be ordered by priority (most urgent first).
- Resolution time estimates should be based on historical resolution times if available.
- Be specific and actionable. Do not be vague.`;

  // --- Current Incident Context ---
  const incidentContext = `
=== CURRENT INCIDENT ===
Title: ${incident.title}
Description: ${incident.description}
Severity: ${incident.severity}
Status: ${incident.status}
Source: ${incident.source || "Unknown"}
Created: ${incident.created_at}`;

  // --- Historical Memories Context ---
  let memoriesContext = "\n=== HISTORICAL INCIDENT MEMORIES ===\n";

  if (memories.length === 0) {
    memoriesContext += "No similar historical incidents found. Analyze based on current incident data only.\n";
  } else {
    memories.forEach((memory, index) => {
      memoriesContext += `
--- Past Incident ${index + 1} (Relevance: ${Math.round(memory.relevance_score * 100)}%) ---
Title: ${memory.metadata?.title || "N/A"}
Description: ${memory.metadata?.description || "N/A"}
Severity: ${memory.metadata?.severity || "N/A"}
Root Cause: ${memory.metadata?.root_cause || "N/A"}
Resolution: ${memory.metadata?.resolution || "N/A"}
Lessons Learned: ${memory.metadata?.lessons_learned || "N/A"}
Resolution Time: ${memory.metadata?.resolution_time_minutes || "N/A"} minutes
`;
    });
  }

  return `${systemPrompt}\n${incidentContext}\n${memoriesContext}`;
}
