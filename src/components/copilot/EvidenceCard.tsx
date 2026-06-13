import React from "react";
import { ShieldAlert, ShieldCheck, Shield, AlertTriangle } from "lucide-react";
import { HistoricalEvidence } from "@/types/copilot";
import { cn } from "@/lib/utils";

interface EvidenceCardProps {
  evidence: HistoricalEvidence;
}

export function EvidenceCard({ evidence }: EvidenceCardProps) {
  const severityColor = {
    critical: "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400",
    high: "border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400",
    medium: "border-yellow-500 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    low: "border-green-500 bg-green-500/10 text-green-600 dark:text-green-400",
  }[evidence.severity.toLowerCase()] || "border-zinc-500 bg-zinc-500/10 text-zinc-600 dark:text-zinc-400";

  const SeverityIcon = {
    critical: AlertTriangle,
    high: ShieldAlert,
    medium: Shield,
    low: ShieldCheck,
  }[evidence.severity.toLowerCase()] || Shield;

  return (
    <div className="flex flex-col gap-2 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm relative overflow-hidden">
      {/* Left severity indicator bar */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-1", severityColor.split(" ")[0])} />
      
      <div className="flex items-start justify-between pl-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("text-xs font-semibold uppercase tracking-wider flex items-center gap-1", severityColor.split(" ").slice(2).join(" "))}>
              <SeverityIcon className="w-3 h-3" />
              {evidence.severity}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
              {evidence.incident_id.substring(0, 8)}
            </span>
          </div>
          <h4 className="font-medium text-zinc-900 dark:text-zinc-100 text-sm">
            {evidence.title}
          </h4>
        </div>
      </div>

      <div className="pl-2 mt-2 space-y-2 text-xs">
        {evidence.root_cause && (
          <div>
            <span className="text-zinc-500 dark:text-zinc-400 font-medium">Root Cause: </span>
            <span className="text-zinc-700 dark:text-zinc-300">{evidence.root_cause}</span>
          </div>
        )}
        {evidence.resolution && (
          <div>
            <span className="text-zinc-500 dark:text-zinc-400 font-medium">Resolution: </span>
            <span className="text-zinc-700 dark:text-zinc-300">{evidence.resolution}</span>
          </div>
        )}
      </div>
    </div>
  );
}
