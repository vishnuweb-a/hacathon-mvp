/**
 * Gemini AI Client
 * Initializes the Google GenAI SDK and provides analysis generation.
 */

import { GoogleGenAI } from "@google/genai";
import type { GeminiAnalysisOutput } from "@/types/analysis";

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.warn("GEMINI_API_KEY is not set. AI analysis will not be available.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || "" });

/**
 * Send a structured prompt to Gemini and parse the JSON response.
 */
export async function generateAnalysis(prompt: string): Promise<GeminiAnalysisOutput> {
  if (!API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured. Cannot perform analysis.");
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3, // Lower temperature for more deterministic security analysis
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Gemini returned an empty response.");
    }

    // Parse the JSON response from Gemini
    const parsed: GeminiAnalysisOutput = JSON.parse(text);

    // Validate required fields
    if (!parsed.rootCause || !parsed.recommendedActions) {
      throw new Error("Gemini response is missing required fields.");
    }

    return parsed;
  } catch (error) {
    console.error("[Gemini] Analysis generation failed:", error);
    throw error;
  }
}
