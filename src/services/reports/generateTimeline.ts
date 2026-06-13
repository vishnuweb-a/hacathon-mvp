import type { ReportContext } from "./buildReportContext";

/**
 * Generates a plausible incident timeline from the available context.
 */
export function generateTimeline(
  ctx: ReportContext
): { time: string; event: string }[] {
  const timeline: { time: string; event: string }[] = [];
  const created = new Date(ctx.incident.created_at);

  timeline.push({
    time: formatTime(created),
    event: `Incident detected: ${ctx.incident.title}`,
  });

  timeline.push({
    time: formatTime(addMinutes(created, 2)),
    event: `Alert triggered from source: ${ctx.incident.source || "Security Monitoring System"}`,
  });

  timeline.push({
    time: formatTime(addMinutes(created, 5)),
    event: "Investigation initiated by SOC team",
  });

  if (ctx.postmortem) {
    const resTime = ctx.postmortem.resolution_time_minutes;
    const midPoint = Math.round(resTime * 0.4);
    const nearEnd = Math.round(resTime * 0.8);

    timeline.push({
      time: formatTime(addMinutes(created, midPoint)),
      event: "Root cause identified",
    });

    timeline.push({
      time: formatTime(addMinutes(created, nearEnd)),
      event: "Containment actions executed",
    });

    timeline.push({
      time: formatTime(addMinutes(created, resTime)),
      event: "Incident resolved and verified",
    });

    // Postmortem creation
    const pmCreated = new Date(ctx.postmortem.created_at);
    timeline.push({
      time: formatTime(pmCreated),
      event: "Postmortem documented and knowledge extracted",
    });
  }

  if (ctx.learningEvent) {
    timeline.push({
      time: formatTime(addMinutes(created, (ctx.postmortem?.resolution_time_minutes || 30) + 5)),
      event: `Organizational memory updated: ${ctx.learningEvent.threat_type}`,
    });
  }

  return timeline;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}
