/**
 * Runbook Step Ranker
 * Ranks steps within each threat category by a composite score.
 */

import type { StepMetrics } from "./calculateStepEffectiveness";
import type { RunbookStep } from "@/types/runbook";

/**
 * Rank steps by composite score: success rate × frequency × speed.
 */
export function rankRunbookSteps(
  metricsMap: Map<string, StepMetrics[]>
): Map<string, RunbookStep[]> {
  const result = new Map<string, RunbookStep[]>();

  for (const [threatType, metrics] of metricsMap) {
    // Calculate composite score for ranking
    const scored = metrics.map((m) => {
      // Weighted score: 50% success rate + 30% frequency + 20% speed (inverse)
      const freqScore = Math.min(m.occurrences * 10, 100);
      const speedScore = m.averageResolutionMinutes > 0
        ? Math.max(100 - m.averageResolutionMinutes, 0)
        : 50; // default mid score if no time data

      const compositeScore =
        m.successRate * 0.5 +
        freqScore * 0.3 +
        speedScore * 0.2;

      return { ...m, compositeScore };
    });

    // Sort by composite score descending
    scored.sort((a, b) => b.compositeScore - a.compositeScore);

    const rankedSteps: RunbookStep[] = scored.map((m, i) => ({
      name: m.stepName,
      occurrences: m.occurrences,
      successRate: m.successRate,
      averageResolutionMinutes: m.averageResolutionMinutes,
      failureRate: m.failureRate,
      rank: i + 1,
      trend: determineTrend(m.successRate),
      sources: [], // populated later if needed
    }));

    result.set(threatType, rankedSteps);
  }

  return result;
}

/**
 * Determine trend based on success rate.
 */
function determineTrend(successRate: number): "Improving" | "Stable" | "Declining" {
  if (successRate >= 80) return "Improving";
  if (successRate >= 50) return "Stable";
  return "Declining";
}
