/**
 * Obsolete Step Detector
 * Identifies weak/outdated remediation steps that should be deprecated.
 */

import type { RunbookStep, ObsoleteStep } from "@/types/runbook";

const OBSOLETE_SUCCESS_THRESHOLD = 40; // Below this = obsolete
const REVIEW_SUCCESS_THRESHOLD = 60;   // Below this = needs review

/**
 * Detect obsolete/weak steps from ranked runbook steps.
 */
export function detectObsoleteSteps(
  rankedSteps: Map<string, RunbookStep[]>
): Map<string, ObsoleteStep[]> {
  const result = new Map<string, ObsoleteStep[]>();

  for (const [threatType, steps] of rankedSteps) {
    const obsolete: ObsoleteStep[] = [];

    for (const step of steps) {
      if (step.successRate < OBSOLETE_SUCCESS_THRESHOLD) {
        obsolete.push({
          name: step.name,
          successRate: step.successRate,
          occurrences: step.occurrences,
          lastUsed: null,
          recommendation: "Deprecate",
          reason: `Only ${step.successRate}% success rate across ${step.occurrences} uses. This step may be outdated or ineffective.`,
        });
      } else if (step.successRate < REVIEW_SUCCESS_THRESHOLD) {
        obsolete.push({
          name: step.name,
          successRate: step.successRate,
          occurrences: step.occurrences,
          lastUsed: null,
          recommendation: step.occurrences < 3 ? "Review" : "Replace",
          reason: `${step.successRate}% success rate suggests this step needs evaluation. Consider updating or replacing with a more effective control.`,
        });
      }
    }

    if (obsolete.length > 0) {
      result.set(threatType, obsolete);
    }
  }

  return result;
}
