import type { ThreatCategory } from "@/types/learning";

/**
 * Rule-based threat classification as a fallback when Gemini classification
 * is already included in extractKnowledge. Can also be used independently.
 */

const THREAT_PATTERNS: { pattern: RegExp; category: ThreatCategory }[] = [
  { pattern: /credential|password|login|brute.?force|mfa/i, category: "Credential Theft" },
  { pattern: /phish|spear.?phish|social.?engineer/i, category: "Phishing" },
  { pattern: /malware|trojan|virus|worm/i, category: "Malware" },
  { pattern: /ransom/i, category: "Ransomware" },
  { pattern: /exfiltrat|data.?leak|data.?breach/i, category: "Data Exfiltration" },
  { pattern: /iam|permission|role|policy|misconfigur/i, category: "IAM Misconfiguration" },
  { pattern: /insider/i, category: "Insider Threat" },
  { pattern: /api.?key|secret|token.?expos/i, category: "API Key Exposure" },
  { pattern: /ddos|denial.?of.?service|flood/i, category: "DDoS" },
  { pattern: /supply.?chain|dependency|package/i, category: "Supply Chain Attack" },
];

/**
 * Classifies the threat category from text using rule-based pattern matching.
 * This acts as a fallback if Gemini classification fails.
 */
export function classifyThreatFallback(text: string): ThreatCategory {
  for (const { pattern, category } of THREAT_PATTERNS) {
    if (pattern.test(text)) {
      return category;
    }
  }
  return "Unknown";
}

/**
 * Validates and normalizes a threat type string into a known ThreatCategory.
 */
export function normalizeThreatType(threatType: string): ThreatCategory {
  const validCategories: ThreatCategory[] = [
    "Credential Theft",
    "Phishing",
    "Malware",
    "Ransomware",
    "Data Exfiltration",
    "IAM Misconfiguration",
    "Insider Threat",
    "API Key Exposure",
    "DDoS",
    "Supply Chain Attack",
    "Unknown",
  ];

  const found = validCategories.find(
    (c) => c.toLowerCase() === threatType.toLowerCase()
  );

  return found || "Unknown";
}
