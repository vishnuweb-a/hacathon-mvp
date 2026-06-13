"use client";

import { useState, useEffect } from "react";
import {
  BookOpen,
  Shield,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  ChevronRight,
  BarChart3,
  XCircle,
  RefreshCw,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RunbookStep {
  name: string;
  occurrences: number;
  successRate: number;
  averageResolutionMinutes: number;
  failureRate: number;
  rank: number;
  trend: string;
}

interface ObsoleteStep {
  name: string;
  successRate: number;
  occurrences: number;
  recommendation: string;
  reason: string;
}

interface AdaptiveRunbook {
  threatType: string;
  steps: RunbookStep[];
  obsoleteSteps: ObsoleteStep[];
  confidenceScore: number;
  totalIncidentsAnalyzed: number;
  totalMemoriesUsed: number;
  recommendations: {
    newSteps: string[];
    reorderSuggestions: string[];
    riskWarnings: string[];
  };
  generatedAt: string;
  analysisMethod: string;
}

interface StoredRunbook {
  id: string;
  threat_type: string;
  runbook: AdaptiveRunbook;
  confidence_score: number;
  generated_at: string;
}

export default function RunbooksPage() {
  const [runbooks, setRunbooks] = useState<StoredRunbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedRunbook, setSelectedRunbook] = useState<StoredRunbook | null>(null);

  useEffect(() => {
    fetchRunbooks();
  }, []);

  const fetchRunbooks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/runbooks/latest");
      const { data } = await res.json();
      setRunbooks(data || []);
      if (data && data.length > 0) setSelectedRunbook(data[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/runbooks/generate", { method: "POST" });
      const { data } = await res.json();
      if (data) {
        setRunbooks(data);
        setSelectedRunbook(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "Improving") return <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />;
    if (trend === "Declining") return <TrendingDown className="w-3.5 h-3.5 text-red-400" />;
    return <Minus className="w-3.5 h-3.5 text-zinc-500" />;
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (score >= 50) return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    return "text-red-400 bg-red-500/10 border-red-500/20";
  };

  const getSuccessColor = (rate: number) => {
    if (rate >= 80) return "bg-emerald-500";
    if (rate >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  const rb = selectedRunbook?.runbook;

  return (
    <div className="min-h-screen bg-zinc-950 p-6 sm:p-10 text-zinc-200">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-amber-400" />
              Adaptive Runbook Intelligence
            </h1>
            <p className="text-zinc-400 mt-2 max-w-2xl">
              Self-evolving security runbooks powered by organizational memory. Every step is ranked by real-world effectiveness from historical incidents.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="shrink-0 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-3 rounded-xl font-medium text-sm hover:from-amber-400 hover:to-orange-500 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {generating ? "Generating..." : "Generate Adaptive Runbooks"}
          </button>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="text-center space-y-4">
              <RefreshCw className="w-10 h-10 text-amber-500 animate-spin mx-auto" />
              <p className="text-zinc-400">Loading adaptive runbooks...</p>
            </div>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && runbooks.length === 0 && (
          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-16 text-center border-dashed">
            <BookOpen className="w-14 h-14 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-zinc-300 mb-2">No Runbooks Generated Yet</h3>
            <p className="text-zinc-500 max-w-md mx-auto mb-6">
              Click "Generate Adaptive Runbooks" to analyze your organizational memory and create intelligent, self-evolving security runbooks.
            </p>
          </div>
        )}

        {/* MAIN CONTENT */}
        {!loading && runbooks.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

            {/* LEFT: Runbook Selector */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">Threat Runbooks</h2>
              {runbooks.map((stored) => (
                <button
                  key={stored.id}
                  onClick={() => setSelectedRunbook(stored)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border transition-all",
                    selectedRunbook?.id === stored.id
                      ? "bg-zinc-800/80 border-amber-500/30 shadow-lg shadow-amber-500/5"
                      : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">{stored.threat_type}</span>
                    <span className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full border",
                      getConfidenceColor(stored.confidence_score)
                    )}>
                      {stored.confidence_score}%
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500">
                    {stored.runbook.steps?.length || 0} steps • {stored.runbook.analysisMethod}
                  </div>
                </button>
              ))}
            </div>

            {/* RIGHT: Selected Runbook Detail */}
            {rb && (
              <div className="lg:col-span-3 space-y-6">

                {/* Runbook Header */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white">{rb.threatType} Runbook</h2>
                      <p className="text-sm text-zinc-400 mt-1">
                        {rb.totalIncidentsAnalyzed} incidents analyzed • Generated via {rb.analysisMethod} • {new Date(rb.generatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className={cn(
                      "text-center p-4 rounded-2xl border",
                      getConfidenceColor(rb.confidenceScore)
                    )}>
                      <p className="text-3xl font-bold">{rb.confidenceScore}%</p>
                      <p className="text-xs mt-1">Confidence</p>
                    </div>
                  </div>
                </div>

                {/* Step Rankings */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <BarChart3 className="w-5 h-5 text-amber-400" />
                    <h3 className="text-lg font-semibold">Ranked Remediation Steps</h3>
                  </div>
                  <div className="space-y-3">
                    {(rb.steps || []).map((step, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 bg-zinc-950 rounded-xl border border-zinc-800/50">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-sm font-bold text-amber-400 shrink-0">
                          {step.rank || i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-white text-sm">{step.name}</span>
                            {getTrendIcon(step.trend)}
                          </div>
                          {/* Success bar */}
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className={cn("h-full rounded-full transition-all", getSuccessColor(step.successRate))}
                                style={{ width: `${step.successRate}%` }}
                              />
                            </div>
                            <span className="text-xs text-zinc-400 w-12 text-right shrink-0">{step.successRate}%</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0 space-y-1">
                          <div className="text-xs text-zinc-500 flex items-center gap-1 justify-end">
                            <CheckCircle className="w-3 h-3" /> {step.occurrences} uses
                          </div>
                          {step.averageResolutionMinutes > 0 && (
                            <div className="text-xs text-zinc-500 flex items-center gap-1 justify-end">
                              <Clock className="w-3 h-3" /> {step.averageResolutionMinutes}m avg
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Obsolete Steps */}
                {rb.obsoleteSteps && rb.obsoleteSteps.length > 0 && (
                  <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <h3 className="text-lg font-semibold text-red-300">Obsolete Steps Detected</h3>
                    </div>
                    <div className="space-y-3">
                      {rb.obsoleteSteps.map((step, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 bg-zinc-950/50 rounded-xl border border-red-500/10">
                          <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                          <div className="flex-1">
                            <span className="font-medium text-zinc-200 text-sm">{step.name}</span>
                            <p className="text-xs text-zinc-500 mt-1">{step.reason}</p>
                          </div>
                          <span className={cn(
                            "text-xs font-medium px-2.5 py-1 rounded-full",
                            step.recommendation === "Deprecate"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-amber-500/20 text-amber-400"
                          )}>
                            {step.recommendation}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Recommendations */}
                {rb.recommendations && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {rb.recommendations.newSteps?.length > 0 && (
                      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                        <h4 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" /> Suggested New Steps
                        </h4>
                        <ul className="space-y-2">
                          {rb.recommendations.newSteps.map((s, i) => (
                            <li key={i} className="text-xs text-zinc-400 flex items-start gap-2">
                              <ChevronRight className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {rb.recommendations.reorderSuggestions?.length > 0 && (
                      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                        <h4 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4" /> Reorder Suggestions
                        </h4>
                        <ul className="space-y-2">
                          {rb.recommendations.reorderSuggestions.map((s, i) => (
                            <li key={i} className="text-xs text-zinc-400 flex items-start gap-2">
                              <ChevronRight className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {rb.recommendations.riskWarnings?.length > 0 && (
                      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                        <h4 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" /> Risk Warnings
                        </h4>
                        <ul className="space-y-2">
                          {rb.recommendations.riskWarnings.map((s, i) => (
                            <li key={i} className="text-xs text-zinc-400 flex items-start gap-2">
                              <ChevronRight className="w-3 h-3 text-red-500 mt-0.5 shrink-0" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
