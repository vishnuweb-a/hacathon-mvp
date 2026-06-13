/**
 * Step Effectiveness Calculator
 * For each extracted step, calculates occurrences, success rate,
 * average resolution time, and failure rate.
 */

import { supabase } from "@/lib/supabase";
import type { ExtractedStep } from "./extractRunbookSteps";

export interface StepMetrics {
  stepName: string;
  threatType: string;
  occurrences: number;
  successCount: number;
  successRate: number;
  failureRate: number;
  averageResolutionMinutes: number;
}

/**
 * Calculate effectiveness metrics for all steps, grouped by threat type.
 */
export function calculateStepEffectiveness(
  steps: ExtractedStep[]
): Map<string, StepMetrics[]> {
  // Group by threat type, then by step name
  const byThreat: Record<string, Record<string, {
    occurrences: number;
    successCount: number;
    totalResolutionMin: number;
    resolutionCount: number;
  }>> = {};

  for (const step of steps) {
    if (!byThreat[step.threatType]) {
      byThreat[step.threatType] = {};
    }
    if (!byThreat[step.threatType][step.stepName]) {
      byThreat[step.threatType][step.stepName] = {
        occurrences: 0,
        successCount: 0,
        totalResolutionMin: 0,
        resolutionCount: 0,
      };
    }

    const bucket = byThreat[step.threatType][step.stepName];
    bucket.occurrences++;
    if (step.wasSuccessful) bucket.successCount++;
    if (step.resolutionMinutes > 0) {
      bucket.totalResolutionMin += step.resolutionMinutes;
      bucket.resolutionCount++;
    }
  }

  const result = new Map<string, StepMetrics[]>();

  for (const [threatType, stepsMap] of Object.entries(byThreat)) {
    const metrics: StepMetrics[] = [];

    for (const [stepName, data] of Object.entries(stepsMap)) {
      const successRate = data.occurrences > 0
        ? Math.round((data.successCount / data.occurrences) * 100)
        : 0;

      metrics.push({
        stepName,
        threatType,
        occurrences: data.occurrences,
        successCount: data.successCount,
        successRate,
        failureRate: 100 - successRate,
        averageResolutionMinutes: data.resolutionCount > 0
          ? Math.round(data.totalResolutionMin / data.resolutionCount)
          : 0,
      });
    }

    result.set(threatType, metrics);
  }

  return result;
}

/**
 * Persist step metrics to the database for historical tracking.
 */
export async function persistStepMetrics(
  metricsMap: Map<string, StepMetrics[]>
): Promise<void> {
  const rows: any[] = [];

  for (const [, metrics] of metricsMap) {
    for (const m of metrics) {
      rows.push({
        threat_type: m.threatType,
        step_name: m.stepName,
        occurrences: m.occurrences,
        success_rate: m.successRate,
        average_resolution_time: m.averageResolutionMinutes,
      });
    }
  }

  if (rows.length === 0) return;

  const { error } = await supabase
    .from("runbook_step_metrics")
    .insert(rows);

  if (error) {
    console.warn("[Runbooks] Failed to persist step metrics:", error);
  }
}
