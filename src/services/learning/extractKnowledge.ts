import { GoogleGenAI } from "@google/genai";
import type { Incident } from "@/types/incident";
import type { Postmortem } from "@/types/postmortem";
import type { ExtractedKnowledge } from "@/types/learning";

const API_KEY = process.env.GEMINI_API_KEY;

/**
 * Uses Gemini to extract structured knowledge from an incident + postmortem.
 */
export async function extractKnowledge(
  incident: Incident,
  postmortem: Postmortem
): Promise<ExtractedKnowledge> {
  if (!API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const prompt = `You are a senior SOC analyst.

Analyze this security incident and its postmortem.

Incident Title: ${incident.title}
Description: ${incident.description}
Severity: ${incident.severity}
Status: ${incident.status}
Source: ${incident.source || "Unknown"}

Postmortem:
Root Cause: ${postmortem.root_cause}
Resolution: ${postmortem.resolution}
Lessons Learned: ${postmortem.lessons_learned}
Resolution Time: ${postmortem.resolution_time_minutes} minutes

Extract the following:
1. Threat Type (one of: Credential Theft, Phishing, Malware, Ransomware, Data Exfiltration, IAM Misconfiguration, Insider Threat, API Key Exposure, DDoS, Supply Chain Attack, Unknown)
2. Root Cause (concise)
3. Resolution (concise)
4. Lessons Learned (concise)
5. Preventive Measures (array of strings)
6. Resolution Time (minutes)
7. Severity (critical, high, medium, low)
8. Incident Category (e.g. authentication, network, infrastructure)
9. Source System (e.g. AWS, Azure, Internal, Unknown)

Respond only as JSON matching this exact schema:
{
  "threatType": "string",
  "rootCause": "string",
  "resolution": "string",
  "lessonsLearned": "string",
  "preventiveMeasures": ["string"],
  "resolutionTimeMinutes": number,
  "severity": "string",
  "incidentCategory": "string",
  "sourceSystem": "string"
}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      temperature: 0.2,
      responseMimeType: "application/json",
    },
  });

  if (!response.text) {
    throw new Error("Gemini returned an empty response during knowledge extraction.");
  }

  try {
    const parsed = JSON.parse(response.text) as ExtractedKnowledge;
    console.log(`[Learning] Extracted knowledge — threat: ${parsed.threatType}, category: ${parsed.incidentCategory}`);
    return parsed;
  } catch {
    console.error("[Learning] Failed to parse Gemini knowledge extraction:", response.text);
    throw new Error("Failed to parse Gemini knowledge extraction response.");
  }
}
