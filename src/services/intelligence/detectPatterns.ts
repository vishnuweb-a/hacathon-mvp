/**
 * Pattern Detection Engine
 * Performs statistical analysis on aggregated threat data to identify patterns.
 * Acts as both the primary analysis and Gemini fallback.
 */

import type { AggregatedThreatData, DetectedPatterns, EmergingThreat, ControlEntry } from "@/types/intelligence";
import { classifyThreatFallback } from "@/services/learning/classifyThreat";

/**
 * Detect patterns from aggregated threat data using statistical analysis.
 */
export function detectPatterns(data: AggregatedThreatData): DetectedPatterns {
  const threatDistribution = computeThreatDistribution(data);
  const emergingThreats = detectEmergingThreats(data);
  const rootCauseCounts = extractRootCauses(data);
  const resolutionEffectiveness = analyzeResolutionEffectiveness(data);

  const totalDataPoints =
    data.incidents.length +
    data.postmortems.length +
    data.learningEvents.length +
    data.analyses.length +
    data.memories.length;

  return {
    threatDistribution,
    emergingThreats,
    rootCauseCounts,
    resolutionEffectiveness,
    totalDataPoints,
  };
}

/**
 * Count threat occurrences by category from learning events and incident text.
 */
function computeThreatDistribution(data: AggregatedThreatData): { name: string; count: number }[] {
  const counts: Record<string, number> = {};

  // From learning events (already classified)
  for (const event of data.learningEvents) {
    const category = event.threat_type || "Unknown";
    counts[category] = (counts[category] || 0) + 1;
  }

  // From incidents that might not have learning events yet (use fallback classifier)
  const learningIncidentIds = new Set(data.learningEvents.map((e) => e.incident_id));
  for (const incident of data.incidents) {
    if (!learningIncidentIds.has(incident.id)) {
      const category = classifyThreatFallback(`${incident.title} ${incident.description}`);
      counts[category] = (counts[category] || 0) + 1;
    }
  }

  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Detect threats that are increasing over time.
 * Compares last 30 days vs the 30 days before that.
 */
function detectEmergingThreats(data: AggregatedThreatData): EmergingThreat[] {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const currentMonth: Record<string, number> = {};
  const lastMonth: Record<string, number> = {};

  // Use learning events for classification (most reliable)
  for (const event of data.learningEvents) {
    const eventDate = new Date(event.created_at);
    const category = event.threat_type || "Unknown";

    if (eventDate >= thirtyDaysAgo) {
      currentMonth[category] = (currentMonth[category] || 0) + 1;
    } else if (eventDate >= sixtyDaysAgo) {
      lastMonth[category] = (lastMonth[category] || 0) + 1;
    }
  }

  // Also classify raw incidents
  for (const incident of data.incidents) {
    const eventDate = new Date(incident.created_at);
    const category = classifyThreatFallback(`${incident.title} ${incident.description}`);

    if (eventDate >= thirtyDaysAgo) {
      currentMonth[category] = (currentMonth[category] || 0) + 1;
    } else if (eventDate >= sixtyDaysAgo) {
      lastMonth[category] = (lastMonth[category] || 0) + 1;
    }
  }

  // Calculate growth
  const allCategories = new Set([...Object.keys(currentMonth), ...Object.keys(lastMonth)]);
  const emerging: EmergingThreat[] = [];

  for (const name of allCategories) {
    const current = currentMonth[name] || 0;
    const last = lastMonth[name] || 0;

    if (current === 0 && last === 0) continue;

    const growthPercent = last === 0 ? (current > 0 ? 100 : 0) : Math.round(((current - last) / last) * 100);

    emerging.push({
      name,
      lastMonthCount: last,
      currentMonthCount: current,
      growthPercent,
    });
  }

  // Sort by growth descending, only return those with positive growth
  return emerging
    .filter((t) => t.growthPercent > 0)
    .sort((a, b) => b.growthPercent - a.growthPercent);
}

/**
 * Extract and count recurring root causes from postmortems and analyses.
 */
function extractRootCauses(data: AggregatedThreatData): { cause: string; count: number; sources: string[] }[] {
  const causeCounts: Record<string, { count: number; sources: Set<string> }> = {};

  // From postmortems
  for (const pm of data.postmortems) {
    const cause = normalizeCause(pm.root_cause);
    if (!causeCounts[cause]) {
      causeCounts[cause] = { count: 0, sources: new Set() };
    }
    causeCounts[cause].count++;
    causeCounts[cause].sources.add("Postmortems");
  }

  // From AI analyses
  for (const analysis of data.analyses) {
    const cause = normalizeCause(analysis.root_cause);
    if (!causeCounts[cause]) {
      causeCounts[cause] = { count: 0, sources: new Set() };
    }
    causeCounts[cause].count++;
    causeCounts[cause].sources.add("AI Analyses");
  }

  // From learning event summaries
  for (const event of data.learningEvents) {
    if (event.knowledge_summary) {
      const parts = event.knowledge_summary.split("→");
      if (parts.length > 0) {
        const causeRaw = parts[0].split(":").slice(1).join(":").trim();
        if (causeRaw) {
          const cause = normalizeCause(causeRaw);
          if (!causeCounts[cause]) {
            causeCounts[cause] = { count: 0, sources: new Set() };
          }
          causeCounts[cause].count++;
          causeCounts[cause].sources.add("Learning Events");
        }
      }
    }
  }

  return Object.entries(causeCounts)
    .map(([cause, data]) => ({
      cause,
      count: data.count,
      sources: Array.from(data.sources),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

/**
 * Analyze resolution effectiveness from postmortems and analyses.
 */
function analyzeResolutionEffectiveness(data: AggregatedThreatData): ControlEntry[] {
  const controlCounts: Record<string, { applied: number; successful: number }> = {};

  // From postmortem resolutions (all resolved incidents have successful outcomes)
  for (const pm of data.postmortems) {
    const controls = extractControls(pm.resolution);
    for (const control of controls) {
      if (!controlCounts[control]) {
        controlCounts[control] = { applied: 0, successful: 0 };
      }
      controlCounts[control].applied++;
      controlCounts[control].successful++;
    }
  }

  // From AI analysis recommended actions
  for (const analysis of data.analyses) {
    if (analysis.recommended_actions) {
      for (const action of analysis.recommended_actions) {
        const control = normalizeControl(action);
        if (!controlCounts[control]) {
          controlCounts[control] = { applied: 0, successful: 0 };
        }
        controlCounts[control].applied++;
        // Recommendations are slightly less certain than actual resolutions
        controlCounts[control].successful += 0.85;
      }
    }
  }

  return Object.entries(controlCounts)
    .map(([control, data]) => ({
      control,
      successRate: Math.round((data.successful / data.applied) * 100),
      timesApplied: data.applied,
    }))
    .sort((a, b) => b.successRate - a.successRate || b.timesApplied - a.timesApplied)
    .slice(0, 8);
}

/**
 * Normalize a root cause string to group similar causes together.
 */
function normalizeCause(cause: string): string {
  return cause
    .trim()
    .replace(/\.$/, "")
    .split(/[.!]/)
    .map((s) => s.trim())
    .filter(Boolean)[0]
    || cause.trim();
}

/**
 * Extract control/remediation actions from resolution text.
 */
function extractControls(resolution: string): string[] {
  const controlPatterns = [
    { pattern: /mfa|multi.?factor/i, control: "Enable MFA" },
    { pattern: /password.?reset|credential.?rotat/i, control: "Password Reset" },
    { pattern: /account.?lock|suspend.?account/i, control: "Account Lock" },
    { pattern: /key.?rotat|api.?key.?revok/i, control: "API Key Rotation" },
    { pattern: /iam.?polic|permission.?review|role.?review/i, control: "IAM Policy Review" },
    { pattern: /patch|update|upgrade/i, control: "Security Patching" },
    { pattern: /firewall|network.?block|ip.?block/i, control: "Network Blocking" },
    { pattern: /training|awareness|phishing.?sim/i, control: "Security Training" },
    { pattern: /secret.?scan|token.?scan/i, control: "Secret Scanning" },
    { pattern: /conditional.?access|zero.?trust/i, control: "Conditional Access" },
  ];

  const found: string[] = [];
  for (const { pattern, control } of controlPatterns) {
    if (pattern.test(resolution)) {
      found.push(control);
    }
  }

  // If no pattern matched, use the resolution as-is (truncated)
  if (found.length === 0) {
    found.push(resolution.length > 50 ? resolution.substring(0, 50) + "..." : resolution);
  }

  return found;
}

/**
 * Normalize a recommended action into a standard control name.
 */
function normalizeControl(action: string): string {
  const controlPatterns = [
    { pattern: /mfa|multi.?factor/i, control: "Enable MFA" },
    { pattern: /password|credential/i, control: "Password Reset" },
    { pattern: /lock|suspend/i, control: "Account Lock" },
    { pattern: /key.?rotat|api.?key/i, control: "API Key Rotation" },
    { pattern: /iam|permission|role/i, control: "IAM Policy Review" },
    { pattern: /patch|update/i, control: "Security Patching" },
    { pattern: /firewall|network|block/i, control: "Network Blocking" },
    { pattern: /train|aware/i, control: "Security Training" },
    { pattern: /scan|detect/i, control: "Secret Scanning" },
  ];

  for (const { pattern, control } of controlPatterns) {
    if (pattern.test(action)) return control;
  }

  return action.length > 40 ? action.substring(0, 40) + "..." : action;
}
