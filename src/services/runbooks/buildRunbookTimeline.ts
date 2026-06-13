/**
 * Runbook Timeline Builder
 * Builds a chronological evolution timeline for a specific threat category's runbook.
 */

import { supabase } from "@/lib/supabase";
import type { RunbookTimeline, RunbookTimelineEntry } from "@/types/runbook";

/**
 * Build a timeline showing how a runbook evolved over time.
 */
export async function buildRunbookTimeline(
  threatType: string
): Promise<RunbookTimeline> {
  const entries: RunbookTimelineEntry[] = [];

  // 1. Fetch historical runbook generations for this threat type
  const { data: runbooks } = await supabase
    .from("adaptive_runbooks")
    .select("id, runbook, confidence_score, generated_at")
    .eq("threat_type", threatType)
    .order("generated_at", { ascending: true });

  if (runbooks && runbooks.length > 0) {
    for (let i = 0; i < runbooks.length; i++) {
      const rb = runbooks[i];
      const runbook = rb.runbook as any;

      entries.push({
        date: rb.generated_at,
        type: "runbook_generated",
        label: `Runbook v${i + 1} Generated`,
        description: `Confidence: ${rb.confidence_score}% | ${runbook?.steps?.length || 0} steps | Method: ${runbook?.analysisMethod || "statistical"}`,
      });

      // If we have a previous version, detect changes
      if (i > 0) {
        const prevRunbook = runbooks[i - 1].runbook as any;
        const prevSteps = new Set((prevRunbook?.steps || []).map((s: any) => s.name));
        const currSteps = new Set((runbook?.steps || []).map((s: any) => s.name));

        // New steps
        for (const step of currSteps) {
          if (!prevSteps.has(step)) {
            entries.push({
              date: rb.generated_at,
              type: "step_added",
              label: `Step Added: ${step}`,
              description: `New remediation step identified from organizational learning.`,
            });
          }
        }

        // Deprecated steps
        for (const step of prevSteps) {
          if (!currSteps.has(step)) {
            entries.push({
              date: rb.generated_at,
              type: "step_deprecated",
              label: `Step Deprecated: ${step}`,
              description: `Step removed due to low effectiveness or obsolescence.`,
            });
          }
        }
      }
    }
  }

  // 2. Fetch related learning events for context
  const { data: learningEvents } = await supabase
    .from("learning_events")
    .select("threat_type, knowledge_summary, created_at")
    .eq("threat_type", threatType)
    .eq("status", "completed")
    .order("created_at", { ascending: true });

  for (const le of learningEvents || []) {
    entries.push({
      date: le.created_at,
      type: "step_improved",
      label: `Knowledge Updated: ${le.threat_type}`,
      description: le.knowledge_summary?.substring(0, 120) || "New knowledge extracted from incident.",
    });
  }

  // Sort by date
  entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return { threatType, entries };
}
