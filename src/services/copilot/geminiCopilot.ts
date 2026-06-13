import { GoogleGenAI } from "@google/genai";
import { CopilotContext } from "./contextBuilder";
import { CopilotResponse } from "@/types/copilot";

const apiKey = process.env.GEMINI_API_KEY;

export async function askGemini(context: CopilotContext): Promise<CopilotResponse> {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set.");
  }

  const ai = new GoogleGenAI({ apiKey });

  if (context.isGreeting) {
    return {
      summary: "Hello! I am your Security Copilot. I can search organizational memory, analyze past incidents, and recommend actions based on our postmortems. How can I help you today?",
      historicalEvidence: [],
      recommendations: [],
      confidence: "High",
      sources: []
    };
  }

  // 6. Gemini Integration
  const systemPrompt = `You are a senior SOC analyst and Security Copilot.
Answer the user's question using the provided organizational security history.

Requirements:
1. Be concise.
2. Cite historical evidence.
3. Mention recurring patterns.
4. Recommend actions if relevant based on historical postmortems.
5. Do not hallucinate incident history. If no evidence exists, state: "No historical incidents found."

Current Question:
${context.query}

Historical Memories (Hindsight Recall):
${JSON.stringify(context.memories, null, 2)}

Incidents (Supabase):
${JSON.stringify(context.incidents, null, 2)}

Postmortems (Supabase):
${JSON.stringify(context.postmortems, null, 2)}

Respond with a strictly formatted JSON object matching this schema:
{
  "summary": "String explaining the answer",
  "historicalEvidence": [
    {
      "incident_id": "string",
      "title": "string",
      "severity": "string",
      "root_cause": "string",
      "resolution": "string"
    }
  ],
  "recommendations": ["string"],
  "confidence": "High" | "Medium" | "Low",
  "sources": ["string (e.g. incident IDs or postmortem IDs)"]
}`;

  console.log(`[GeminiCopilot] Sending prompt to Gemini for query: "${context.query}"`);

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
    config: {
      temperature: 0.2,
      responseMimeType: "application/json",
    }
  });

  if (!response.text) {
    throw new Error("Empty response from Gemini");
  }

  try {
    const parsed = JSON.parse(response.text) as CopilotResponse;
    return parsed;
  } catch (e) {
    console.error("Failed to parse Gemini response:", response.text);
    throw new Error("Failed to parse Gemini response as JSON.");
  }
}
