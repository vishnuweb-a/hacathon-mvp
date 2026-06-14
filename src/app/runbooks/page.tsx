"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
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
    if (trend === "Improving") return <TrendingUp className="w-3.5 h-3.5" style={{ color: "#16A34A" }} />;
    if (trend === "Declining") return <TrendingDown className="w-3.5 h-3.5" style={{ color: "#DC2626" }} />;
    return <Minus className="w-3.5 h-3.5" style={{ color: "#64748B" }} />;
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return { text: "#16A34A", bg: "rgba(22, 163, 74, 0.1)", border: "rgba(22, 163, 74, 0.2)" };
    if (score >= 50) return { text: "#F59E0B", bg: "rgba(245, 158, 11, 0.1)", border: "rgba(245, 158, 11, 0.2)" };
    return { text: "#DC2626", bg: "rgba(220, 38, 38, 0.1)", border: "rgba(220, 38, 38, 0.2)" };
  };

  const getSuccessColor = (rate: number) => {
    if (rate >= 80) return "#16A34A";
    if (rate >= 60) return "#F59E0B";
    return "#DC2626";
  };

  const rb = selectedRunbook?.runbook;

  return (
    <div className="min-h-screen p-8 sm:p-10" style={{ backgroundColor: "#0B1220" }}>
      <div className="max-w-[1400px] mx-auto space-y-12">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-bold tracking-tight" style={{ color: "#F3F6FB" }}>
              Adaptive Runbook Intelligence
            </h1>
            <p className="mt-2 text-[15px]" style={{ color: "#64748B", maxWidth: "600px" }}>
              Self-evolving security runbooks powered by organizational memory. Every step is ranked by real-world effectiveness from historical incidents.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="shrink-0 px-6 py-3 rounded-lg font-semibold text-[13px] transition-colors disabled:opacity-50 flex items-center gap-2"
            style={{ backgroundColor: "#182235", color: "#F3F6FB", border: "1px solid #243146" }}
            onMouseEnter={(e) => { if (!generating) e.currentTarget.style.backgroundColor = "#243146"; }}
            onMouseLeave={(e) => { if (!generating) e.currentTarget.style.backgroundColor = "#182235"; }}
          >
            {generating && <RefreshCw className="w-4 h-4 animate-spin" />}
            {generating ? "Generating..." : "Generate Adaptive Runbooks"}
          </button>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="flex justify-center py-20">
            <p style={{ color: "#64748B" }}>Building Runbook Intelligence...</p>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && runbooks.length === 0 && (
          <div className="rounded-xl border p-16 text-center" style={{ backgroundColor: "#121A2B", borderColor: "#243146", borderStyle: "dashed" }}>
            <h3 className="text-[18px] font-semibold mb-2" style={{ color: "#F3F6FB" }}>No Runbooks Generated Yet</h3>
            <p className="text-[14px] max-w-md mx-auto" style={{ color: "#64748B" }}>
              Click "Generate Adaptive Runbooks" to analyze your organizational memory and create intelligent, self-evolving security runbooks.
            </p>
          </div>
        )}

        {/* MAIN CONTENT */}
        {!loading && runbooks.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

            {/* LEFT: Runbook Selector */}
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#64748B" }}>
                Threat Runbooks
              </h2>
              {runbooks.map((stored) => {
                const confColor = getConfidenceColor(stored.confidence_score);
                const isSelected = selectedRunbook?.id === stored.id;
                return (
                  <button
                    key={stored.id}
                    onClick={() => setSelectedRunbook(stored)}
                    className="w-full text-left p-5 rounded-xl border transition-all"
                    style={{
                      backgroundColor: isSelected ? "#182235" : "#121A2B",
                      borderColor: isSelected ? "#64748B" : "#243146"
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[14px] font-semibold" style={{ color: "#F3F6FB" }}>{stored.threat_type}</span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded" style={{ backgroundColor: confColor.bg, color: confColor.text, border: `1px solid ${confColor.border}` }}>
                        {stored.confidence_score}%
                      </span>
                    </div>
                    <div className="text-[12px]" style={{ color: "#64748B" }}>
                      {stored.runbook.steps?.length || 0} steps • {stored.runbook.analysisMethod}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* RIGHT: Selected Runbook Detail */}
            {rb && (
              <div className="lg:col-span-3 space-y-8">

                {/* Runbook Header */}
                <div className="rounded-xl border p-8" style={{ backgroundColor: "#121A2B", borderColor: "#243146" }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-[24px] font-bold" style={{ color: "#F3F6FB" }}>{rb.threatType} Runbook</h2>
                      <p className="text-[13px] mt-2" style={{ color: "#64748B" }}>
                        {rb.totalIncidentsAnalyzed} incidents analyzed • Generated via {rb.analysisMethod} • {new Date(rb.generatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    {(() => {
                      const c = getConfidenceColor(rb.confidenceScore);
                      return (
                        <div className="text-center p-5 rounded-xl border" style={{ backgroundColor: c.bg, borderColor: c.border }}>
                          <p className="text-[28px] font-bold" style={{ color: c.text }}>{rb.confidenceScore}%</p>
                          <p className="text-[11px] font-semibold uppercase tracking-wider mt-1" style={{ color: c.text }}>Confidence</p>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Step Rankings */}
                <div className="rounded-xl border p-8" style={{ backgroundColor: "#121A2B", borderColor: "#243146" }}>
                  <h3 className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: "#64748B" }}>
                    Ranked Remediation Steps
                  </h3>
                  <div className="space-y-4">
                    {(rb.steps || []).map((step, i) => (
                      <div key={i} className="flex items-center gap-5 p-5 rounded-xl border" style={{ backgroundColor: "#182235", borderColor: "#243146" }}>
                        <div className="text-[14px] font-bold w-6 text-center" style={{ color: "#94A3B8" }}>
                          {step.rank || i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-[14px]" style={{ color: "#F3F6FB" }}>{step.name}</span>
                            {getTrendIcon(step.trend)}
                          </div>
                          {/* Success bar */}
                          <div className="flex items-center gap-4">
                            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#243146" }}>
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${step.successRate}%`, backgroundColor: getSuccessColor(step.successRate) }}
                              />
                            </div>
                            <span className="text-[12px] font-medium w-10 text-right" style={{ color: "#64748B" }}>{step.successRate}%</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0 space-y-1.5">
                          <div className="text-[12px]" style={{ color: "#64748B" }}>
                            {step.occurrences} uses
                          </div>
                          {step.averageResolutionMinutes > 0 && (
                           <div className="text-[12px]" style={{ color: "#64748B" }}>
                             {step.averageResolutionMinutes}m avg
                           </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Obsolete Steps */}
                {rb.obsoleteSteps && rb.obsoleteSteps.length > 0 && (
                  <div className="rounded-xl border p-8" style={{ backgroundColor: "rgba(220, 38, 38, 0.05)", borderColor: "rgba(220, 38, 38, 0.2)" }}>
                    <h3 className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: "#DC2626" }}>
                      Obsolete Steps Detected
                    </h3>
                    <div className="space-y-3">
                      {rb.obsoleteSteps.map((step, i) => (
                        <div key={i} className="flex items-center gap-4 p-5 rounded-xl border" style={{ backgroundColor: "#182235", borderColor: "rgba(220, 38, 38, 0.1)" }}>
                          <div className="flex-1">
                            <span className="font-semibold text-[14px]" style={{ color: "#F3F6FB" }}>{step.name}</span>
                            <p className="text-[13px] mt-1" style={{ color: "#64748B" }}>{step.reason}</p>
                          </div>
                          <span 
                            className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded"
                            style={
                              step.recommendation === "Deprecate"
                                ? { backgroundColor: "rgba(220, 38, 38, 0.1)", color: "#DC2626" }
                                : { backgroundColor: "rgba(245, 158, 11, 0.1)", color: "#F59E0B" }
                            }
                          >
                            {step.recommendation}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Recommendations */}
                {rb.recommendations && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {rb.recommendations.newSteps?.length > 0 && (
                      <div className="rounded-xl border p-6" style={{ backgroundColor: "#121A2B", borderColor: "#243146" }}>
                        <h4 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#16A34A" }}>
                          Suggested New Steps
                        </h4>
                        <ul className="space-y-3">
                          {rb.recommendations.newSteps.map((s, i) => (
                            <li key={i} className="text-[13px] leading-relaxed" style={{ color: "#94A3B8" }}>
                              • {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {rb.recommendations.reorderSuggestions?.length > 0 && (
                      <div className="rounded-xl border p-6" style={{ backgroundColor: "#121A2B", borderColor: "#243146" }}>
                        <h4 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#F59E0B" }}>
                          Reorder Suggestions
                        </h4>
                        <ul className="space-y-3">
                          {rb.recommendations.reorderSuggestions.map((s, i) => (
                            <li key={i} className="text-[13px] leading-relaxed" style={{ color: "#94A3B8" }}>
                              • {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {rb.recommendations.riskWarnings?.length > 0 && (
                      <div className="rounded-xl border p-6" style={{ backgroundColor: "#121A2B", borderColor: "#243146" }}>
                        <h4 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#DC2626" }}>
                          Risk Warnings
                        </h4>
                        <ul className="space-y-3">
                          {rb.recommendations.riskWarnings.map((s, i) => (
                            <li key={i} className="text-[13px] leading-relaxed" style={{ color: "#94A3B8" }}>
                              • {s}
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
