/**
 * Adaptive Runbook Generator
 * Orchestrates the full pipeline: Extract → Effectiveness → Rank → Obsolete → Gemini → Save.
 */

import { GoogleGenAI } from "@google/genai";
import { supabase } from "@/lib/supabase";
import { extractRunbookSteps } from "./extractRunbookSteps";
import { calculateStepEffectiveness, persistStepMetrics } from "./calculateStepEffectiveness";
import { rankRunbookSteps } from "./rankRunbookSteps";
import { detectObsoleteSteps } from "./detectObsoleteSteps";
import type { AdaptiveRunbook, StoredRunbook } from "@/types/runbook";

const API_KEY = process.env.GEMINI_API_KEY;

/**
 * Generate adaptive runbooks for all detected threat categories (or a specific one).
 */
export async function generateAdaptiveRunbooks(
  specificThreatType?: string
): Promise<StoredRunbook[]> {
  console.log("[Runbooks] Starting adaptive runbook generation...");

  // Step 1: Extract all steps
  const allSteps = await extractRunbookSteps();
  console.log(`[Runbooks] Extracted ${allSteps.length} remediation steps.`);

  if (allSteps.length === 0) {
    console.log("[Runbooks] No steps found. Generating seed runbooks from common threat types.");
    return generateSeedRunbooks();
  }

  // Step 2: Calculate effectiveness
  const metricsMap = calculateStepEffectiveness(allSteps);

  // Step 3: Persist metrics
  await persistStepMetrics(metricsMap);

  // Step 4: Rank steps
  const rankedMap = rankRunbookSteps(metricsMap);

  // Step 5: Detect obsolete steps
  const obsoleteMap = detectObsoleteSteps(rankedMap);

  // Step 6: Generate runbooks per threat type
  const results: StoredRunbook[] = [];

  const threatTypes = specificThreatType
    ? [specificThreatType]
    : Array.from(rankedMap.keys());

  for (const threatType of threatTypes) {
    const steps = rankedMap.get(threatType) || [];
    const obsoleteSteps = obsoleteMap.get(threatType) || [];
    const stepsForThreat = allSteps.filter((s) => s.threatType === threatType);

    // Try Gemini enhancement, fall back to statistical
    let runbook: AdaptiveRunbook;

    if (API_KEY && steps.length > 0) {
      try {
        runbook = await generateGeminiRunbook(threatType, steps, obsoleteSteps, stepsForThreat.length);
        console.log(`[Runbooks] Gemini-enhanced runbook generated for ${threatType}`);
      } catch (err) {
        console.warn(`[Runbooks] Gemini failed for ${threatType}, using statistical:`, err);
        runbook = buildStatisticalRunbook(threatType, steps, obsoleteSteps, stepsForThreat.length);
      }
    } else {
      runbook = buildStatisticalRunbook(threatType, steps, obsoleteSteps, stepsForThreat.length);
    }

    // Save to DB
    const stored = await saveRunbook(threatType, runbook);
    results.push(stored);
  }

  console.log(`[Runbooks] Generated ${results.length} adaptive runbooks.`);
  return results;
}

/**
 * Use Gemini to enhance the runbook with AI recommendations.
 */
async function generateGeminiRunbook(
  threatType: string,
  steps: any[],
  obsoleteSteps: any[],
  totalIncidents: number
): Promise<AdaptiveRunbook> {
  const ai = new GoogleGenAI({ apiKey: API_KEY! });

  const prompt = `You are a senior security operations architect.

Analyze the following runbook data for "${threatType}" and provide recommendations.

=== CURRENT RANKED STEPS ===
${steps.map((s, i) => `${i + 1}. ${s.name} — Success: ${s.successRate}%, Used: ${s.occurrences} times, Avg Resolution: ${s.averageResolutionMinutes}min`).join("\n")}

=== OBSOLETE/WEAK STEPS ===
${obsoleteSteps.length > 0 ? obsoleteSteps.map((s) => `- ${s.name}: ${s.successRate}% success (${s.recommendation})`).join("\n") : "None detected"}

=== TASKS ===
1. Confirm or reorder the step ranking for optimal incident response.
2. Suggest 1-3 new steps that are missing from the runbook.
3. Provide risk warnings if any critical gaps exist.
4. Calculate a confidence score (0-100) for this runbook.

=== RESPONSE FORMAT ===
Return ONLY valid JSON:
{
  "newSteps": ["string"],
  "reorderSuggestions": ["string"],
  "riskWarnings": ["string"],
  "confidenceScore": number
}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { temperature: 0.3, responseMimeType: "application/json" },
  });

  if (!response.text) throw new Error("Empty Gemini response");

  const parsed = JSON.parse(response.text);

  return {
    threatType,
    steps,
    obsoleteSteps,
    confidenceScore: parsed.confidenceScore || calculateConfidence(steps),
    totalIncidentsAnalyzed: totalIncidents,
    totalMemoriesUsed: steps.filter((s) => s.sources?.includes("memory")).length,
    recommendations: {
      newSteps: parsed.newSteps || [],
      reorderSuggestions: parsed.reorderSuggestions || [],
      riskWarnings: parsed.riskWarnings || [],
    },
    generatedAt: new Date().toISOString(),
    analysisMethod: "gemini",
  };
}

/**
 * Build a statistical-only runbook (Gemini fallback).
 */
function buildStatisticalRunbook(
  threatType: string,
  steps: any[],
  obsoleteSteps: any[],
  totalIncidents: number
): AdaptiveRunbook {
  return {
    threatType,
    steps,
    obsoleteSteps,
    confidenceScore: calculateConfidence(steps),
    totalIncidentsAnalyzed: totalIncidents,
    totalMemoriesUsed: 0,
    recommendations: {
      newSteps: steps.length < 3
        ? ["Consider adding additional remediation controls for this threat type."]
        : [],
      reorderSuggestions: [],
      riskWarnings: obsoleteSteps.length > 0
        ? [`${obsoleteSteps.length} steps have low effectiveness and should be reviewed.`]
        : [],
    },
    generatedAt: new Date().toISOString(),
    analysisMethod: "statistical",
  };
}

/**
 * Generate seed runbooks for common threat types when no data exists yet.
 */
async function generateSeedRunbooks(): Promise<StoredRunbook[]> {
  const seedRunbooks: { threatType: string; steps: string[] }[] = [
    { threatType: "Credential Theft", steps: ["Enable MFA", "Force Password Reset", "Audit Active Sessions", "Rotate API Keys", "Review IAM Policies"] },
    { threatType: "Phishing", steps: ["Quarantine Affected Systems", "Force Password Reset", "Security Awareness Training", "Block Malicious IPs", "Enable MFA"] },
    { threatType: "Ransomware", steps: ["Quarantine Affected Systems", "Verify Backup & Recovery", "Apply Security Patches", "Deploy EDR/Endpoint Protection", "Block Malicious IPs"] },
    { threatType: "IAM Misconfiguration", steps: ["Review IAM Policies", "Lock Compromised Accounts", "Audit Active Sessions", "Implement Conditional Access", "Enable Secret Scanning"] },
  ];

  const results: StoredRunbook[] = [];

  for (const seed of seedRunbooks) {
    const runbook: AdaptiveRunbook = {
      threatType: seed.threatType,
      steps: seed.steps.map((name, i) => ({
        name,
        occurrences: 0,
        successRate: 0,
        averageResolutionMinutes: 0,
        failureRate: 0,
        rank: i + 1,
        trend: "Stable" as const,
        sources: [],
      })),
      obsoleteSteps: [],
      confidenceScore: 30, // Low confidence for seed data
      totalIncidentsAnalyzed: 0,
      totalMemoriesUsed: 0,
      recommendations: {
        newSteps: ["Process incidents to build intelligence and improve this runbook."],
        reorderSuggestions: [],
        riskWarnings: ["This is a seed runbook. Confidence will increase as incidents are processed."],
      },
      generatedAt: new Date().toISOString(),
      analysisMethod: "statistical",
    };

    const stored = await saveRunbook(seed.threatType, runbook);
    results.push(stored);
  }

  return results;
}

/**
 * Calculate confidence score from step data.
 */
function calculateConfidence(steps: any[]): number {
  if (steps.length === 0) return 0;
  const avgSuccess = steps.reduce((sum: number, s: any) => sum + (s.successRate || 0), 0) / steps.length;
  const coverageBonus = Math.min(steps.length * 5, 20);
  return Math.min(Math.round(avgSuccess * 0.8 + coverageBonus), 100);
}

/**
 * Save a generated runbook to the database.
 */
async function saveRunbook(
  threatType: string,
  runbook: AdaptiveRunbook
): Promise<StoredRunbook> {
  const { data, error } = await supabase
    .from("adaptive_runbooks")
    .insert({
      threat_type: threatType,
      runbook,
      confidence_score: runbook.confidenceScore,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save runbook for ${threatType}: ${error.message}`);
  }

  return data as StoredRunbook;
}
