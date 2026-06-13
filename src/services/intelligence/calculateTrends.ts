/**
 * Trend Calculation Engine
 * Computes time-series trends for threat categories, root causes, and resolution times.
 */

import type { AggregatedThreatData, TrendData, ThreatTrendPoint } from "@/types/intelligence";
import { classifyThreatFallback } from "@/services/learning/classifyThreat";

/**
 * Calculate time-series trends from aggregated data.
 */
export function calculateTrends(data: AggregatedThreatData): TrendData {
  const monthlyThreatTrends = computeMonthlyThreatTrends(data);
  const rootCauseTrends = computeRootCauseTrends(data);
  const resolutionTimeTrend = computeResolutionTimeTrend(data);

  return {
    monthlyThreatTrends,
    rootCauseTrends,
    resolutionTimeTrend,
  };
}

/**
 * Compute monthly incident counts by threat category for the last 6 months.
 */
function computeMonthlyThreatTrends(data: AggregatedThreatData): ThreatTrendPoint[] {
  const now = new Date();
  const points: ThreatTrendPoint[] = [];

  // Build a map of month → category → count
  const monthData: Record<string, Record<string, number>> = {};

  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = formatMonth(d);
    monthData[key] = {};
  }

  // Classify incidents by month
  for (const incident of data.incidents) {
    const d = new Date(incident.created_at);
    const key = formatMonth(d);
    if (!(key in monthData)) continue;

    // Find the learning event with a threat_type for this incident
    const learningEvent = data.learningEvents.find((e) => e.incident_id === incident.id);
    const category = learningEvent?.threat_type || classifyThreatFallback(`${incident.title} ${incident.description}`);

    monthData[key][category] = (monthData[key][category] || 0) + 1;
  }

  // Flatten to points
  for (const [month, categories] of Object.entries(monthData)) {
    for (const [category, count] of Object.entries(categories)) {
      points.push({ month, category, count });
    }
  }

  return points;
}

/**
 * Compute root cause trend direction by comparing recent vs older occurrences.
 */
function computeRootCauseTrends(
  data: AggregatedThreatData
): { cause: string; trend: "Increasing" | "Stable" | "Decreasing"; occurrences: number }[] {
  const now = new Date();
  const midpoint = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000);

  const recentCounts: Record<string, number> = {};
  const olderCounts: Record<string, number> = {};
  const totalCounts: Record<string, number> = {};

  // From postmortems
  for (const pm of data.postmortems) {
    const cause = pm.root_cause.trim().split(/[.!]/)[0].trim() || pm.root_cause.trim();
    const d = new Date(pm.created_at);

    totalCounts[cause] = (totalCounts[cause] || 0) + 1;
    if (d >= midpoint) {
      recentCounts[cause] = (recentCounts[cause] || 0) + 1;
    } else {
      olderCounts[cause] = (olderCounts[cause] || 0) + 1;
    }
  }

  // From AI analyses
  for (const analysis of data.analyses) {
    const cause = analysis.root_cause.trim().split(/[.!]/)[0].trim() || analysis.root_cause.trim();
    const d = new Date(analysis.created_at);

    totalCounts[cause] = (totalCounts[cause] || 0) + 1;
    if (d >= midpoint) {
      recentCounts[cause] = (recentCounts[cause] || 0) + 1;
    } else {
      olderCounts[cause] = (olderCounts[cause] || 0) + 1;
    }
  }

  return Object.entries(totalCounts)
    .map(([cause, occurrences]) => {
      const recent = recentCounts[cause] || 0;
      const older = olderCounts[cause] || 0;

      let trend: "Increasing" | "Stable" | "Decreasing";
      if (recent > older * 1.3) {
        trend = "Increasing";
      } else if (recent < older * 0.7) {
        trend = "Decreasing";
      } else {
        trend = "Stable";
      }

      return { cause, trend, occurrences };
    })
    .sort((a, b) => b.occurrences - a.occurrences)
    .slice(0, 10);
}

/**
 * Compute average resolution time per month.
 */
function computeResolutionTimeTrend(
  data: AggregatedThreatData
): { month: string; avgMinutes: number }[] {
  const now = new Date();
  const monthTotals: Record<string, { sum: number; count: number }> = {};

  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = formatMonth(d);
    monthTotals[key] = { sum: 0, count: 0 };
  }

  for (const pm of data.postmortems) {
    const d = new Date(pm.created_at);
    const key = formatMonth(d);
    if (key in monthTotals) {
      monthTotals[key].sum += pm.resolution_time_minutes;
      monthTotals[key].count++;
    }
  }

  return Object.entries(monthTotals)
    .map(([month, { sum, count }]) => ({
      month,
      avgMinutes: count > 0 ? Math.round(sum / count) : 0,
    }));
}

/**
 * Format a date as "Jan", "Feb", etc.
 */
function formatMonth(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short" });
}
