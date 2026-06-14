/**
 * Graph Node Builder
 * Fetches data from all Supabase tables and generates graph nodes.
 * Falls back to realistic demo data when database is empty.
 */

import { supabase } from "@/lib/supabase";
import type { GraphNode, GraphNodeType } from "@/types/graph";

/**
 * Build all graph nodes from organizational data sources.
 */
export async function buildNodes(): Promise<GraphNode[]> {
  const nodes: GraphNode[] = [];

  // 1. Fetch incidents
  const { data: incidents } = await supabase
    .from("incidents")
    .select("id, title, description, severity, status, created_at")
    .order("created_at", { ascending: false });

  if (incidents) {
    for (const inc of incidents) {
      nodes.push({
        id: `incident-${inc.id}`,
        type: "incident",
        label: inc.title,
        description: `[${inc.severity?.toUpperCase()}] ${inc.description?.substring(0, 120) || ""}`,
        influenceScore: 0,
        metadata: { ...inc, originalId: inc.id },
      });
    }
  }

  // 2. Fetch postmortems
  const { data: postmortems } = await supabase
    .from("postmortems")
    .select("id, incident_id, root_cause, resolution, lessons_learned, created_at");

  if (postmortems) {
    for (const pm of postmortems) {
      nodes.push({
        id: `postmortem-${pm.id}`,
        type: "postmortem",
        label: `Root Cause: ${pm.root_cause?.substring(0, 50) || "Analysis"}`,
        description: `Resolution: ${pm.resolution?.substring(0, 120) || "Applied remediation"}`,
        influenceScore: 0,
        metadata: { ...pm, originalId: pm.id },
      });
    }
  }

  // 3. Fetch learning events
  const { data: learningEvents } = await supabase
    .from("learning_events")
    .select("id, incident_id, memory_id, threat_type, knowledge_summary, status, created_at")
    .eq("status", "completed");

  if (learningEvents) {
    for (const le of learningEvents) {
      nodes.push({
        id: `learning-${le.id}`,
        type: "learning_event",
        label: le.threat_type || "Threat Classified",
        description: le.knowledge_summary?.substring(0, 120) || "Knowledge extracted and stored",
        influenceScore: 0,
        metadata: { ...le, originalId: le.id },
      });

      // Add memory nodes if they exist
      if (le.memory_id) {
        nodes.push({
          id: `memory-${le.memory_id}`,
          type: "memory",
          label: `Memory: ${le.threat_type}`,
          description: "Organizational knowledge retained in Hindsight",
          influenceScore: 0,
          metadata: { memoryId: le.memory_id, threatType: le.threat_type, originalId: le.memory_id },
        });
      }
    }
  }

  // 4. Fetch adaptive runbooks
  const { data: runbooks } = await supabase
    .from("adaptive_runbooks")
    .select("id, threat_type, confidence_score, generated_at");

  if (runbooks) {
    for (const rb of runbooks) {
      nodes.push({
        id: `runbook-${rb.id}`,
        type: "runbook",
        label: `${rb.threat_type} Runbook`,
        description: `Confidence: ${rb.confidence_score}% — Auto-generated response playbook`,
        influenceScore: 0,
        metadata: { ...rb, originalId: rb.id },
      });
    }
  }

  // 5. Fetch threat intelligence reports
  const { data: reports } = await supabase
    .from("threat_intelligence_reports")
    .select("id, report, created_at");

  if (reports) {
    for (const rpt of reports) {
      const reportData = rpt.report as any;
      nodes.push({
        id: `intelligence-${rpt.id}`,
        type: "intelligence",
        label: `Threat Report: ${reportData?.riskLevel || "Analysis"}`,
        description: reportData?.executiveSummary?.substring(0, 120) || "Threat intelligence report",
        influenceScore: 0,
        metadata: { ...rpt, originalId: rpt.id },
      });
    }
  }

  // 6. Fetch provenance logs to create recommendation nodes
  const { data: provLogs } = await supabase
    .from("memory_provenance_logs")
    .select("id, source_type, source_id, target_type, target_id, context, relevance, created_at");

  if (provLogs) {
    const recSet = new Set<string>();
    for (const log of provLogs) {
      if (log.target_type === "recommendation" && !recSet.has(log.target_id)) {
        recSet.add(log.target_id);
        nodes.push({
          id: `recommendation-${log.target_id}`,
          type: "recommendation",
          label: log.context || `Recommendation ${log.target_id.substring(0, 8)}`,
          description: "Generated from organizational memory and AI analysis",
          influenceScore: 0,
          metadata: { originalId: log.target_id, relevance: log.relevance },
        });
      }
    }
  }

  // 7. Generate threat nodes by grouping threat_types
  const threatTypes = new Set<string>();
  if (learningEvents) {
    for (const le of learningEvents) {
      if (le.threat_type) threatTypes.add(le.threat_type);
    }
  }

  for (const threat of threatTypes) {
    nodes.push({
      id: `threat-${threat.toLowerCase().replace(/\s+/g, "-")}`,
      type: "threat",
      label: threat,
      description: `Threat category with linked incidents, runbooks, and intelligence`,
      influenceScore: 0,
      metadata: { threatType: threat },
    });
  }

  // If no real data exists, return demo nodes
  if (nodes.length === 0) {
    return getDemoNodes();
  }

  // Deduplicate nodes by id
  const seen = new Set<string>();
  return nodes.filter((n) => {
    if (seen.has(n.id)) return false;
    seen.add(n.id);
    return true;
  });
}

/**
 * Generate realistic demo nodes for when the database is empty.
 */
function getDemoNodes(): GraphNode[] {
  const threats = [
    "Credential Theft", "Phishing", "Ransomware", "API Key Exposure",
    "IAM Misconfiguration", "Data Exfiltration", "Insider Threat",
    "DDoS", "Supply Chain Attack", "Privilege Escalation",
  ];

  const incidents = [
    { id: "14", title: "Multiple Failed AWS Console Logins", severity: "critical", threat: "Credential Theft" },
    { id: "27", title: "Suspicious Email Attachment Opened", severity: "high", threat: "Phishing" },
    { id: "42", title: "Unauthorized S3 Bucket Access", severity: "critical", threat: "Data Exfiltration" },
    { id: "53", title: "Leaked API Key on GitHub", severity: "high", threat: "API Key Exposure" },
    { id: "61", title: "Brute Force SSH Attempts", severity: "medium", threat: "Credential Theft" },
    { id: "78", title: "Ransomware Detected on Endpoint", severity: "critical", threat: "Ransomware" },
    { id: "85", title: "Overly Permissive IAM Role", severity: "high", threat: "IAM Misconfiguration" },
    { id: "92", title: "Lateral Movement Detected", severity: "critical", threat: "Privilege Escalation" },
    { id: "101", title: "Spear Phishing Campaign", severity: "high", threat: "Phishing" },
    { id: "115", title: "Compromised CI/CD Pipeline", severity: "critical", threat: "Supply Chain Attack" },
    { id: "128", title: "DDoS Attack on API Gateway", severity: "high", threat: "DDoS" },
    { id: "134", title: "Insider Data Download", severity: "critical", threat: "Insider Threat" },
  ];

  const learnings = [
    { id: "l1", label: "MFA Required", threat: "Credential Theft" },
    { id: "l2", label: "Rotate Credentials", threat: "API Key Exposure" },
    { id: "l3", label: "Audit IAM Policies", threat: "IAM Misconfiguration" },
    { id: "l4", label: "Email Filtering Rules", threat: "Phishing" },
    { id: "l5", label: "Endpoint Isolation Protocol", threat: "Ransomware" },
    { id: "l6", label: "Network Segmentation", threat: "Privilege Escalation" },
    { id: "l7", label: "Rate Limiting", threat: "DDoS" },
    { id: "l8", label: "DLP Policies", threat: "Data Exfiltration" },
    { id: "l9", label: "Supply Chain Auditing", threat: "Supply Chain Attack" },
    { id: "l10", label: "Access Review Cycles", threat: "Insider Threat" },
  ];

  const recommendations = [
    { id: "r1", label: "Enable MFA for All Accounts", threat: "Credential Theft" },
    { id: "r2", label: "Force Password Reset", threat: "Credential Theft" },
    { id: "r3", label: "Implement Secret Scanning", threat: "API Key Exposure" },
    { id: "r4", label: "Deploy Advanced Email Protection", threat: "Phishing" },
    { id: "r5", label: "Enable Conditional Access", threat: "IAM Misconfiguration" },
    { id: "r6", label: "Implement Zero Trust Architecture", threat: "Privilege Escalation" },
    { id: "r7", label: "Deploy WAF Rules", threat: "DDoS" },
    { id: "r8", label: "Enable Data Loss Prevention", threat: "Data Exfiltration" },
  ];

  const runbookDemos = [
    { id: "rb1", label: "Credential Theft Runbook", threat: "Credential Theft", confidence: 94 },
    { id: "rb2", label: "Phishing Response Runbook", threat: "Phishing", confidence: 89 },
    { id: "rb3", label: "Ransomware Containment Runbook", threat: "Ransomware", confidence: 91 },
    { id: "rb4", label: "API Key Rotation Runbook", threat: "API Key Exposure", confidence: 87 },
    { id: "rb5", label: "IAM Remediation Runbook", threat: "IAM Misconfiguration", confidence: 85 },
    { id: "rb6", label: "Data Exfiltration Response", threat: "Data Exfiltration", confidence: 88 },
  ];

  const intelReports = [
    { id: "ir1", label: "Credential Theft Trend Report", risk: "High" },
    { id: "ir2", label: "Q2 Threat Landscape Analysis", risk: "Critical" },
    { id: "ir3", label: "Phishing Campaign Forecast", risk: "Medium" },
    { id: "ir4", label: "Ransomware Evolution Report", risk: "Critical" },
    { id: "ir5", label: "Executive Security Briefing", risk: "High" },
  ];

  const nodes: GraphNode[] = [];

  // Threat nodes
  for (const t of threats) {
    nodes.push({
      id: `threat-${t.toLowerCase().replace(/\s+/g, "-")}`,
      type: "threat",
      label: t,
      description: `Threat category: ${t}`,
      influenceScore: Math.floor(Math.random() * 40) + 60,
      metadata: { threatType: t },
    });
  }

  // Incident nodes
  for (const inc of incidents) {
    nodes.push({
      id: `incident-${inc.id}`,
      type: "incident",
      label: `Incident #${inc.id}: ${inc.title}`,
      description: `[${inc.severity.toUpperCase()}] ${inc.title}`,
      influenceScore: Math.floor(Math.random() * 30) + 20,
      metadata: { ...inc, originalId: inc.id },
    });
  }

  // Postmortem nodes (one per incident for first 8)
  for (let i = 0; i < 8; i++) {
    const inc = incidents[i];
    nodes.push({
      id: `postmortem-pm${i + 1}`,
      type: "postmortem",
      label: `Postmortem #${i + 1}`,
      description: `Root cause analysis for Incident #${inc.id}`,
      influenceScore: Math.floor(Math.random() * 30) + 30,
      metadata: { incidentId: inc.id, originalId: `pm${i + 1}` },
    });
  }

  // Learning event nodes
  for (const le of learnings) {
    nodes.push({
      id: `learning-${le.id}`,
      type: "learning_event",
      label: le.label,
      description: `Learning extracted from ${le.threat} incidents`,
      influenceScore: Math.floor(Math.random() * 40) + 50,
      metadata: { threatType: le.threat, originalId: le.id },
    });
  }

  // Memory nodes
  for (const le of learnings) {
    nodes.push({
      id: `memory-m${le.id}`,
      type: "memory",
      label: `Memory: ${le.label}`,
      description: `Hindsight memory for ${le.threat}`,
      influenceScore: Math.floor(Math.random() * 40) + 50,
      metadata: { threatType: le.threat, originalId: `m${le.id}` },
    });
  }

  // Recommendation nodes
  for (const rec of recommendations) {
    nodes.push({
      id: `recommendation-${rec.id}`,
      type: "recommendation",
      label: rec.label,
      description: `Recommended action for ${rec.threat} mitigation`,
      influenceScore: Math.floor(Math.random() * 40) + 60,
      metadata: { threatType: rec.threat, originalId: rec.id },
    });
  }

  // Runbook nodes
  for (const rb of runbookDemos) {
    nodes.push({
      id: `runbook-${rb.id}`,
      type: "runbook",
      label: rb.label,
      description: `Confidence: ${rb.confidence}% — Adaptive response playbook`,
      influenceScore: rb.confidence,
      metadata: { threatType: rb.threat, confidence: rb.confidence, originalId: rb.id },
    });
  }

  // Intelligence nodes
  for (const ir of intelReports) {
    nodes.push({
      id: `intelligence-${ir.id}`,
      type: "intelligence",
      label: ir.label,
      description: `Risk Level: ${ir.risk}`,
      influenceScore: Math.floor(Math.random() * 30) + 60,
      metadata: { riskLevel: ir.risk, originalId: ir.id },
    });
  }

  return nodes;
}
