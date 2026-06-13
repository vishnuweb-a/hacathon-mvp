import React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, HelpCircle, AlertCircle } from "lucide-react";

interface ConfidenceBadgeProps {
  confidence: "High" | "Medium" | "Low";
}

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const config = {
    High: {
      color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20",
      icon: CheckCircle2,
    },
    Medium: {
      color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20",
      icon: HelpCircle,
    },
    Low: {
      color: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20",
      icon: AlertCircle,
    },
  }[confidence];

  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.color
      )}
      title="Confidence level based on historical evidence"
    >
      <Icon className="w-3.5 h-3.5" />
      {confidence} Confidence
    </div>
  );
}
