import { GoogleGenAI } from "@google/genai";
import { hindsight } from "@/lib/hindsight";
import { getIncidentById } from "@/services/incidents";

const API_KEY = process.env.GEMINI_API_KEY;

export interface GeneratedPostmortem {
  root_cause: string;
  resolution: string;
  lessons_learned: string;
  resolution_time_minutes: number;
}

/**
 * Auto-generates a postmortem for an incident using:
 * 1. Hindsight memory recall (past similar incidents)
 * 2. Gemini intelligence (structured generation)
 */
export async function generatePostmortem(incidentId: string): Promise<GeneratedPostmortem> {
  if (!API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  // 1. Fetch the incident
  const incident = await getIncidentById(incidentId);
  if (!incident) {
    throw new Error(`Incident ${incidentId} not found`);
  }

  // 2. Recall similar past incidents from Hindsight
  const searchQuery = `${incident.title} ${incident.description}`;
  console.log(`[AutoPostmortem] Recalling memories for: "${incident.title}"`);

  let pastKnowledge = "No similar past incidents found in organizational memory.";
  try {
    const memories = await hindsight.recall("security-incidents", searchQuery);
    if (memories.length > 0) {
      pastKnowledge = memories
        .slice(0, 5)
        .map((m, i) => `--- Past Incident ${i + 1} ---\n${m.text}`)
        .join("\n\n");
      console.log(`[AutoPostmortem] Found ${memories.length} related memories`);
    } else {
      console.log("[AutoPostmortem] No past memories found, generating from scratch");
    }
  } catch (err) {
    console.warn("[AutoPostmortem] Hindsight recall failed, generating without context:", err);
  }

  // 3. Generate postmortem via Gemini
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const prompt = `You are a senior SOC analyst at a cybersecurity operations center.

An incident has been resolved and you need to write a detailed postmortem report.

## Current Incident
Title: ${incident.title}
Description: ${incident.description}
Severity: ${incident.severity}
Source: ${incident.source || "Unknown"}

## Organizational Memory (Past Similar Incidents)
${pastKnowledge}

## Instructions
Based on the current incident details and any relevant past organizational knowledge above, generate a comprehensive postmortem with:

1. **root_cause**: A detailed explanation of what caused this incident (2-4 sentences)
2. **resolution**: Step-by-step actions taken to resolve the incident (2-4 sentences)
3. **lessons_learned**: What the team should learn and preventive measures for the future (2-4 sentences)
4. **resolution_time_minutes**: Estimated resolution time in minutes (realistic number between 15-480)

If past incidents are available, incorporate lessons and patterns from them into your analysis.

Respond ONLY as JSON matching this exact schema:
{
  "root_cause": "string",
  "resolution": "string",
  "lessons_learned": "string",
  "resolution_time_minutes": number
}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      temperature: 0.4,
      responseMimeType: "application/json",
    },
  });

  if (!response.text) {
    throw new Error("Gemini returned an empty response.");
  }

  try {
    const parsed = JSON.parse(response.text) as GeneratedPostmortem;
    console.log(`[AutoPostmortem] Generated postmortem for "${incident.title}"`);
    return parsed;
  } catch {
    console.error("[AutoPostmortem] Failed to parse Gemini response:", response.text);
    throw new Error("Failed to parse AI-generated postmortem.");
  }
}
