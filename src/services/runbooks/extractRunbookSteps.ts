/**
 * Runbook Step Extractor
 * Aggregates data from incidents, postmortems, learning events, analyses,
 * and Hindsight memories to extract remediation actions grouped by threat category.
 */

import { supabase } from "@/lib/supabase";
import { hindsight } from "@/lib/hindsight";

export interface ExtractedStep {
  threatType: string;
  stepName: string;
  incidentId: string | null;
  wasSuccessful: boolean;
  resolutionMinutes: number;
  source: string; // 'postmortem' | 'analysis' | 'memory' | 'learning_event'
}

// Control extraction patterns (shared with detectPatterns.ts)
const CONTROL_PATTERNS = [
  { pattern: /mfa|multi.?factor/i, control: "Enable MFA" },
  { pattern: /password.?reset|credential.?rotat|reset.?password/i, control: "Force Password Reset" },
  { pattern: /account.?lock|suspend.?account|disable.?account/i, control: "Lock Compromised Accounts" },
  { pattern: /key.?rotat|api.?key.?revok|rotate.?key/i, control: "Rotate API Keys" },
  { pattern: /iam.?polic|permission.?review|role.?review|least.?privilege/i, control: "Review IAM Policies" },
  { pattern: /patch|update|upgrade/i, control: "Apply Security Patches" },
  { pattern: /firewall|network.?block|ip.?block|block.?ip/i, control: "Block Malicious IPs" },
  { pattern: /training|awareness|phishing.?sim/i, control: "Security Awareness Training" },
  { pattern: /secret.?scan|token.?scan/i, control: "Enable Secret Scanning" },
  { pattern: /conditional.?access|zero.?trust/i, control: "Implement Conditional Access" },
  { pattern: /audit|log.?review|session.?review/i, control: "Audit Active Sessions" },
  { pattern: /backup|restore|recovery/i, control: "Verify Backup & Recovery" },
  { pattern: /quarantine|isolat/i, control: "Quarantine Affected Systems" },
  { pattern: /vpn.?reset|legacy.?vpn/i, control: "Legacy VPN Reset" },
  { pattern: /endpoint|edr|antivirus/i, control: "Deploy EDR/Endpoint Protection" },
];

/**
 * Extract all remediation steps from organizational data.
 */
export async function extractRunbookSteps(): Promise<ExtractedStep[]> {
  const steps: ExtractedStep[] = [];

  // 1. From postmortems (strongest signal — actual resolutions)
  const { data: postmortems } = await supabase
    .from("postmortems")
    .select("id, incident_id, root_cause, resolution, lessons_learned, resolution_time_minutes, created_at");

  // Get learning events for threat type mapping
  const { data: learningEvents } = await supabase
    .from("learning_events")
    .select("incident_id, threat_type")
    .eq("status", "completed");

  // Build incident → threat type map
  const incidentThreatMap: Record<string, string> = {};
  for (const le of learningEvents || []) {
    if (le.incident_id && le.threat_type) {
      incidentThreatMap[le.incident_id] = le.threat_type;
    }
  }

  // Get incident statuses for success tracking
  const { data: incidents } = await supabase
    .from("incidents")
    .select("id, status, title, description");

  const incidentStatusMap: Record<string, string> = {};
  for (const inc of incidents || []) {
    incidentStatusMap[inc.id] = inc.status;
  }

  for (const pm of postmortems || []) {
    const threatType = incidentThreatMap[pm.incident_id] || classifyFromText(pm.root_cause + " " + pm.resolution);
    const controls = extractControls(pm.resolution);
    const wasSuccessful = incidentStatusMap[pm.incident_id] === "resolved";

    for (const control of controls) {
      steps.push({
        threatType,
        stepName: control,
        incidentId: pm.incident_id,
        wasSuccessful,
        resolutionMinutes: pm.resolution_time_minutes || 0,
        source: "postmortem",
      });
    }
  }

  // 2. From AI analyses (recommended actions)
  const { data: analyses } = await supabase
    .from("incident_analyses")
    .select("id, incident_id, root_cause, recommended_actions");

  for (const analysis of analyses || []) {
    const threatType = incidentThreatMap[analysis.incident_id] || classifyFromText(analysis.root_cause);
    const wasSuccessful = incidentStatusMap[analysis.incident_id] === "resolved";

    for (const action of analysis.recommended_actions || []) {
      const control = normalizeToControl(action);
      steps.push({
        threatType,
        stepName: control,
        incidentId: analysis.incident_id,
        wasSuccessful,
        resolutionMinutes: 0,
        source: "analysis",
      });
    }
  }

  // 3. From Hindsight memories
  try {
    const memories = await hindsight.recall("security-incidents", "security remediation resolution steps");
    for (const mem of memories) {
      const controls = extractControls(
        (mem.metadata?.resolution || "") + " " + (mem.metadata?.lessons_learned || "")
      );
      const threatType = classifyFromText(
        (mem.metadata?.root_cause || "") + " " + (mem.metadata?.title || "")
      );

      for (const control of controls) {
        steps.push({
          threatType,
          stepName: control,
          incidentId: mem.metadata?.incident_id || null,
          wasSuccessful: mem.metadata?.status === "resolved",
          resolutionMinutes: typeof mem.metadata?.resolution_time_minutes === "number"
            ? mem.metadata.resolution_time_minutes
            : parseInt(String(mem.metadata?.resolution_time_minutes || "0"), 10),
          source: "memory",
        });
      }
    }
  } catch {
    console.warn("[Runbooks] Hindsight recall failed, continuing without memories.");
  }

  return steps;
}

function extractControls(text: string): string[] {
  const found: string[] = [];
  for (const { pattern, control } of CONTROL_PATTERNS) {
    if (pattern.test(text)) {
      found.push(control);
    }
  }
  if (found.length === 0 && text.trim()) {
    found.push(text.length > 50 ? text.substring(0, 50).trim() : text.trim());
  }
  return found;
}

function normalizeToControl(action: string): string {
  for (const { pattern, control } of CONTROL_PATTERNS) {
    if (pattern.test(action)) return control;
  }
  return action.length > 50 ? action.substring(0, 50).trim() : action.trim();
}

function classifyFromText(text: string): string {
  const categories: { pattern: RegExp; type: string }[] = [
    { pattern: /credential|password|login|auth/i, type: "Credential Theft" },
    { pattern: /phishing|spear.?phish|social.?engineer/i, type: "Phishing" },
    { pattern: /malware|trojan|virus|worm/i, type: "Malware" },
    { pattern: /ransom/i, type: "Ransomware" },
    { pattern: /exfiltrat|data.?leak|data.?loss/i, type: "Data Exfiltration" },
    { pattern: /iam|permission|misconfigur|role/i, type: "IAM Misconfiguration" },
    { pattern: /insider/i, type: "Insider Threat" },
    { pattern: /api.?key|secret|token.?expos/i, type: "API Key Exposure" },
    { pattern: /ddos|denial.?of.?service/i, type: "DDoS" },
    { pattern: /supply.?chain/i, type: "Supply Chain Attack" },
    { pattern: /privilege|escalat/i, type: "Privilege Escalation" },
  ];
  for (const { pattern, type } of categories) {
    if (pattern.test(text)) return type;
  }
  return "Unknown";
}
