/**
 * Memory Detail Service
 * Fetches all data needed for the Memory Detail View:
 *   - Memory content & metadata
 *   - Source evidence (incidents, postmortems, learning events)
 *   - Usage analytics (recall count, copilot, reports, runbooks)
 *   - Impact analytics (recommendations, runbooks, reports influenced)
 *   - Evolution timeline
 *   - Related memories
 *   - Memory strength score
 */

import { supabase } from "@/lib/supabase";
import { hindsight } from "@/lib/hindsight";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface MemoryOverview {
  id: string;
  title: string;
  threatType: string;
  description: string;
  createdDate: string;
  lastUpdated: string;
  status: "active" | "archived" | "evolving";
  strengthScore: number;
}

export interface MemoryContent {
  rootCause: string;
  resolution: string[];
  lessonsLearned: string;
  rawText: string;
}

export interface SourceEvidence {
  incidents: { id: string; title: string; severity: string; date: string }[];
  postmortems: { id: string; rootCause: string; resolution: string; date: string }[];
  learningEvents: { id: string; summary: string; threatType: string; date: string }[];
}

export interface UsageAnalytics {
  timesRecalled: number;
  copilotUsage: number;
  reportUsage: number;
  runbookUsage: number;
  intelligenceUsage: number;
}

export interface ImpactAnalytics {
  recommendationsInfluenced: number;
  runbooksInfluenced: number;
  reportsInfluenced: number;
  incidentsAssisted: number;
}

export interface TimelineEvent {
  id: string;
  date: string;
  type: "created" | "updated" | "referenced" | "learning" | "runbook" | "report" | "recommendation";
  title: string;
  description: string;
}

export interface RelatedMemory {
  id: string;
  title: string;
  threatType: string;
  strengthScore: number;
  similarityScore: number;
}

export interface MemoryDetailData {
  overview: MemoryOverview;
  content: MemoryContent;
  sourceEvidence: SourceEvidence;
  usage: UsageAnalytics;
  impact: ImpactAnalytics;
  timeline: TimelineEvent[];
  relatedMemories: RelatedMemory[];
}

// ─── Demo Data ──────────────────────────────────────────────────────────────

const DEMO_MEMORIES: Record<string, MemoryDetailData> = {
  default: {
    overview: {
      id: "mem-001",
      title: "Credential Theft Response",
      threatType: "Credential Theft",
      description:
        "Organizational knowledge about detecting and responding to credential theft incidents, including compromised passwords, stolen tokens, and unauthorized access patterns.",
      createdDate: "2025-06-10T08:00:00Z",
      lastUpdated: "2025-06-20T14:30:00Z",
      status: "active",
      strengthScore: 92,
    },
    content: {
      rootCause: "Compromised Credentials — Weak passwords, lack of MFA, phishing attacks leading to credential harvesting.",
      resolution: [
        "Enable MFA on all privileged accounts",
        "Reset compromised passwords immediately",
        "Audit all active sessions and revoke suspicious ones",
        "Implement conditional access policies",
        "Deploy credential monitoring alerts",
      ],
      lessonsLearned:
        "All privileged accounts require MFA. Password-only authentication is insufficient for any production system. Conditional access policies should restrict logins from unfamiliar geolocations. Session audit should be automated and continuous.",
      rawText:
        "Incident: Multiple failed AWS login attempts detected from foreign IPs. Root cause was compromised developer credentials obtained via a phishing campaign. Resolution involved rotating all credentials, enabling MFA organization-wide, and implementing conditional access. Key lesson: MFA reduces credential theft recurrence by 99.9%.",
    },
    sourceEvidence: {
      incidents: [
        { id: "inc-14", title: "Multiple Failed AWS Logins", severity: "critical", date: "2025-06-10T08:00:00Z" },
        { id: "inc-22", title: "Suspicious OAuth Token Usage", severity: "high", date: "2025-06-14T11:20:00Z" },
        { id: "inc-31", title: "Phishing Campaign — Credential Harvest", severity: "critical", date: "2025-06-18T09:00:00Z" },
      ],
      postmortems: [
        { id: "pm-7", rootCause: "Compromised developer password via phishing", resolution: "Organization-wide MFA enforcement", date: "2025-06-11T10:00:00Z" },
        { id: "pm-12", rootCause: "OAuth token stolen from browser session", resolution: "Token rotation policy + session timeouts", date: "2025-06-15T14:00:00Z" },
      ],
      learningEvents: [
        { id: "le-11", summary: "MFA reduces credential theft recurrence by 99.9%", threatType: "Credential Theft", date: "2025-06-11T12:00:00Z" },
        { id: "le-18", summary: "Conditional access blocks 94% of foreign login attempts", threatType: "Credential Theft", date: "2025-06-16T08:00:00Z" },
        { id: "le-24", summary: "Automated session auditing detects compromised tokens in < 5min", threatType: "Credential Theft", date: "2025-06-19T16:00:00Z" },
      ],
    },
    usage: {
      timesRecalled: 34,
      copilotUsage: 17,
      reportUsage: 8,
      runbookUsage: 4,
      intelligenceUsage: 5,
    },
    impact: {
      recommendationsInfluenced: 22,
      runbooksInfluenced: 4,
      reportsInfluenced: 3,
      incidentsAssisted: 18,
    },
    timeline: [
      { id: "t1", date: "2025-06-10T08:00:00Z", type: "created", title: "Memory Created", description: "Initial knowledge extracted from Incident #14 — Multiple Failed AWS Logins" },
      { id: "t2", date: "2025-06-11T10:00:00Z", type: "learning", title: "Root Cause Identified", description: "Postmortem confirmed compromised developer credentials via phishing" },
      { id: "t3", date: "2025-06-12T14:00:00Z", type: "recommendation", title: "MFA Recommendation Added", description: "SentinelMind generated recommendation: Enable MFA on all privileged accounts" },
      { id: "t4", date: "2025-06-14T11:20:00Z", type: "referenced", title: "Referenced in Incident #22", description: "Memory recalled during OAuth token theft analysis" },
      { id: "t5", date: "2025-06-15T08:00:00Z", type: "updated", title: "Conditional Access Added", description: "New resolution step added: Implement conditional access policies" },
      { id: "t6", date: "2025-06-16T12:00:00Z", type: "runbook", title: "Runbook Generated", description: "Credential Theft Response Runbook created using this memory" },
      { id: "t7", date: "2025-06-18T09:00:00Z", type: "referenced", title: "Referenced in Incident #31", description: "Memory recalled during phishing campaign credential harvesting incident" },
      { id: "t8", date: "2025-06-19T16:00:00Z", type: "learning", title: "Session Audit Learning", description: "New learning: Automated session auditing detects compromised tokens in < 5min" },
      { id: "t9", date: "2025-06-20T10:00:00Z", type: "report", title: "Threat Intelligence Report", description: "Memory referenced in Credential Theft Threat Intelligence Report" },
      { id: "t10", date: "2025-06-20T14:30:00Z", type: "updated", title: "Memory Strengthened", description: "Strength score updated to 92 based on usage and success rate" },
    ],
    relatedMemories: [
      { id: "mem-002", title: "Credential Theft Detection", threatType: "Credential Theft", strengthScore: 88, similarityScore: 92 },
      { id: "mem-003", title: "Password Rotation Policy", threatType: "Identity Security", strengthScore: 85, similarityScore: 89 },
      { id: "mem-004", title: "Conditional Access Enforcement", threatType: "Access Control", strengthScore: 82, similarityScore: 84 },
      { id: "mem-005", title: "Identity Security Baseline", threatType: "Identity Security", strengthScore: 78, similarityScore: 76 },
      { id: "mem-006", title: "Phishing Response Playbook", threatType: "Phishing", strengthScore: 90, similarityScore: 72 },
    ],
  },
};

// Secondary demo memories for related memory clicks
const SECONDARY_DEMOS: Record<string, Partial<MemoryDetailData>> = {
  "mem-002": {
    overview: { id: "mem-002", title: "Credential Theft Detection", threatType: "Credential Theft", description: "Patterns and indicators for detecting credential theft attempts including failed logins, impossible travel, and token anomalies.", createdDate: "2025-06-08T10:00:00Z", lastUpdated: "2025-06-18T09:00:00Z", status: "active", strengthScore: 88 },
    content: { rootCause: "Lack of anomaly detection for login patterns and token usage.", resolution: ["Deploy login anomaly detection", "Monitor impossible travel events", "Alert on token usage from new devices"], lessonsLearned: "Detection must combine multiple signals — failed logins alone are insufficient.", rawText: "Detection of credential theft requires multi-signal analysis combining failed logins, geolocation anomalies, and device fingerprint changes." },
  },
  "mem-003": {
    overview: { id: "mem-003", title: "Password Rotation Policy", threatType: "Identity Security", description: "Best practices for password rotation including frequency, complexity requirements, and automated enforcement.", createdDate: "2025-06-05T08:00:00Z", lastUpdated: "2025-06-15T12:00:00Z", status: "active", strengthScore: 85 },
    content: { rootCause: "Stale credentials remaining active beyond safe lifecycle.", resolution: ["Enforce 90-day rotation for service accounts", "Require complex passwords (16+ chars)", "Automate rotation via secrets manager"], lessonsLearned: "Manual rotation is unreliable. Automated rotation via infrastructure-as-code is the only scalable approach.", rawText: "Password rotation policies must be automated. Manual enforcement has a 40% compliance rate vs 99% for automated rotation." },
  },
  "mem-004": {
    overview: { id: "mem-004", title: "Conditional Access Enforcement", threatType: "Access Control", description: "Implementing conditional access policies to restrict logins based on location, device, and risk score.", createdDate: "2025-06-12T08:00:00Z", lastUpdated: "2025-06-20T10:00:00Z", status: "evolving", strengthScore: 82 },
    content: { rootCause: "Unrestricted access from any location and device.", resolution: ["Implement location-based access policies", "Require managed device for sensitive resources", "Block access from high-risk countries"], lessonsLearned: "Conditional access reduces unauthorized access attempts by 94% when combined with MFA.", rawText: "Conditional access policies combined with MFA provide defense-in-depth for identity security." },
  },
};

// ─── Main Service ───────────────────────────────────────────────────────────

export async function getMemoryDetail(memoryId: string): Promise<MemoryDetailData> {
  // Try fetching real data from Supabase + Hindsight
  try {
    const realData = await fetchRealMemoryDetail(memoryId);
    if (realData) return realData;
  } catch (err) {
    console.warn("[MemoryDetail] Falling back to demo data:", err);
  }

  // Check secondary demos
  if (SECONDARY_DEMOS[memoryId]) {
    const base = DEMO_MEMORIES.default;
    const override = SECONDARY_DEMOS[memoryId];
    return {
      ...base,
      overview: override.overview || base.overview,
      content: override.content || base.content,
      sourceEvidence: override.sourceEvidence || {
        incidents: [base.sourceEvidence.incidents[0]],
        postmortems: [base.sourceEvidence.postmortems[0]],
        learningEvents: [base.sourceEvidence.learningEvents[0]],
      },
      usage: { timesRecalled: 18 + Math.floor(Math.random() * 20), copilotUsage: 8, reportUsage: 4, runbookUsage: 2, intelligenceUsage: 3 },
      impact: { recommendationsInfluenced: 12, runbooksInfluenced: 2, reportsInfluenced: 2, incidentsAssisted: 10 },
      timeline: base.timeline.slice(0, 5),
      relatedMemories: base.relatedMemories.filter((m) => m.id !== memoryId).slice(0, 3),
    };
  }

  // Default demo
  return DEMO_MEMORIES.default;
}

// ─── Real Data Fetcher ──────────────────────────────────────────────────────

async function fetchRealMemoryDetail(memoryId: string): Promise<MemoryDetailData | null> {
  // 1. Try Hindsight first
  let memoryData: any = null;
  try {
    memoryData = await hindsight.get(memoryId);
  } catch {
    // Not available
  }

  // 2. Try learning_events as fallback source
  const { data: learningEvent } = await supabase
    .from("learning_events")
    .select("*, incidents(id, title, severity, status, created_at)")
    .eq("memory_id", memoryId)
    .maybeSingle();

  if (!memoryData && !learningEvent) return null;

  // Build overview
  const overview: MemoryOverview = {
    id: memoryId,
    title: memoryData?.metadata?.title || learningEvent?.threat_type || "Memory",
    threatType: memoryData?.metadata?.severity || learningEvent?.threat_type || "Unknown",
    description: memoryData?.metadata?.description || learningEvent?.knowledge_summary || "",
    createdDate: learningEvent?.created_at || new Date().toISOString(),
    lastUpdated: learningEvent?.updated_at || learningEvent?.created_at || new Date().toISOString(),
    status: "active",
    strengthScore: 0,
  };

  // Build content
  const content: MemoryContent = {
    rootCause: memoryData?.metadata?.root_cause || "See source evidence below",
    resolution: memoryData?.metadata?.resolution
      ? [memoryData.metadata.resolution]
      : ["See source evidence below"],
    lessonsLearned: memoryData?.metadata?.lessons_learned || learningEvent?.knowledge_summary || "",
    rawText: memoryData?.text || learningEvent?.knowledge_summary || "",
  };

  // Source evidence — fetch from supabase
  const incidents: SourceEvidence["incidents"] = [];
  const postmortems: SourceEvidence["postmortems"] = [];
  const learningEvents: SourceEvidence["learningEvents"] = [];

  if (learningEvent?.incident_id) {
    const { data: inc } = await supabase.from("incidents").select("*").eq("id", learningEvent.incident_id).maybeSingle();
    if (inc) incidents.push({ id: inc.id, title: inc.title, severity: inc.severity, date: inc.created_at });

    const { data: pm } = await supabase.from("postmortems").select("*").eq("incident_id", learningEvent.incident_id).maybeSingle();
    if (pm) postmortems.push({ id: pm.id, rootCause: pm.root_cause, resolution: pm.resolution, date: pm.created_at });
  }

  if (learningEvent) {
    learningEvents.push({ id: learningEvent.id, summary: learningEvent.knowledge_summary, threatType: learningEvent.threat_type, date: learningEvent.created_at });
  }

  // Usage & Impact from provenance logs
  const { data: provenanceLogs } = await supabase
    .from("memory_provenance_logs")
    .select("*")
    .eq("source_type", "memory")
    .eq("source_id", memoryId);

  const usage: UsageAnalytics = { timesRecalled: 0, copilotUsage: 0, reportUsage: 0, runbookUsage: 0, intelligenceUsage: 0 };
  const impact: ImpactAnalytics = { recommendationsInfluenced: 0, runbooksInfluenced: 0, reportsInfluenced: 0, incidentsAssisted: 0 };

  if (provenanceLogs) {
    usage.timesRecalled = provenanceLogs.length;
    for (const log of provenanceLogs) {
      if (log.target_type === "copilot_response") usage.copilotUsage++;
      if (log.target_type === "report") usage.reportUsage++;
      if (log.target_type === "intelligence") usage.intelligenceUsage++;
      if (log.target_type === "recommendation") impact.recommendationsInfluenced++;
      if (log.target_type === "analysis") impact.incidentsAssisted++;
    }
  }

  // Strength
  try {
    const { calculateMemoryStrength } = await import("@/services/provenance/calculateMemoryStrength");
    const strength = await calculateMemoryStrength(memoryId);
    overview.strengthScore = strength.strengthScore;
  } catch {
    overview.strengthScore = Math.min(usage.timesRecalled * 5 + 30, 100);
  }

  // Timeline
  const timeline: TimelineEvent[] = [];
  if (learningEvent) {
    timeline.push({ id: "t-created", date: learningEvent.created_at, type: "created", title: "Memory Created", description: `Knowledge extracted from ${overview.threatType} incident` });
  }
  if (provenanceLogs) {
    provenanceLogs.forEach((log, i) => {
      timeline.push({ id: `t-ref-${i}`, date: log.created_at, type: "referenced", title: `Referenced in ${log.target_type}`, description: log.context || `Used as evidence for ${log.target_type}` });
    });
  }
  timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return {
    overview,
    content,
    sourceEvidence: { incidents, postmortems, learningEvents },
    usage,
    impact,
    timeline,
    relatedMemories: [],
  };
}
