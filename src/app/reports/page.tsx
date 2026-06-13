"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  Download,
  RefreshCw,
  Loader2,
  ShieldAlert,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Brain,
  Sparkles,
  ChevronRight,
  ArrowLeft,
  BookOpen,
  Target,
  Zap,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Report, ReportContent } from "@/types/report";
import type { Incident } from "@/types/incident";

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    try {
      const [reportsRes, incidentsRes] = await Promise.all([
        fetch("/api/reports/generate"),
        fetch("/api/incidents"),
      ]);
      const reportsData = await reportsRes.json();
      const incidentsData = await incidentsRes.json();

      if (reportsData.success) setReports(reportsData.reports || []);
      if (incidentsData.incidents) setIncidents(incidentsData.incidents || []);
    } catch {
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerate = async (incidentId: string) => {
    setGenerating(incidentId);
    setError(null);
    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incidentId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setReports((prev) => [data.report, ...prev]);
      setSelectedReport(data.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(null);
    }
  };

  const handleDownloadPDF = () => {
    if (!selectedReport || !reportRef.current) return;
    const content = reportRef.current;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>SentinelMind Report - ${selectedReport.report_content.incidentOverview.title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; color: #1a1a1a; line-height: 1.6; }
        h1 { font-size: 24px; margin-bottom: 8px; color: #111; }
        h2 { font-size: 18px; margin: 24px 0 12px; color: #333; border-bottom: 2px solid #e5e5e5; padding-bottom: 8px; }
        h3 { font-size: 14px; margin: 16px 0 8px; color: #555; text-transform: uppercase; letter-spacing: 1px; }
        p { margin-bottom: 8px; font-size: 14px; }
        .risk { display: inline-block; padding: 4px 12px; border-radius: 4px; font-weight: 600; font-size: 12px; }
        .risk-critical { background: #fee2e2; color: #991b1b; }
        .risk-high { background: #ffedd5; color: #9a3412; }
        .risk-medium { background: #fef9c3; color: #854d0e; }
        .risk-low { background: #dcfce7; color: #166534; }
        ul { padding-left: 20px; margin-bottom: 12px; }
        li { margin-bottom: 4px; font-size: 14px; }
        .timeline-item { display: flex; gap: 16px; margin-bottom: 8px; font-size: 13px; }
        .timeline-time { font-weight: 600; min-width: 60px; color: #555; }
        .header { text-align: center; margin-bottom: 32px; border-bottom: 3px solid #111; padding-bottom: 16px; }
        .header small { color: #777; }
        .section { margin-bottom: 24px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .grid-item { font-size: 13px; }
        .grid-label { color: #777; font-size: 11px; text-transform: uppercase; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <div class="header">
        <small>SentinelMind Security Intelligence Platform</small>
        <h1>Executive Security Incident Report</h1>
        <small>Generated: ${new Date(selectedReport.created_at).toLocaleDateString()}</small>
      </div>
      ${content.innerHTML}
      </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 sm:p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Executive Report Generator</h1>
            <p className="text-zinc-500 mt-1">
              One-click AI-powered executive security reports
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* LEFT: Generate & Report List */}
          <div className="lg:col-span-1 space-y-6">
            {/* Generate Section */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h2 className="font-semibold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider text-zinc-400">
                <Sparkles className="w-4 h-4 text-violet-400" />
                Generate New Report
              </h2>
              <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                {incidents.length === 0 ? (
                  <p className="text-sm text-zinc-500 py-4 text-center">
                    No incidents found.
                  </p>
                ) : (
                  incidents.map((inc) => (
                    <button
                      key={inc.id}
                      onClick={() => handleGenerate(inc.id)}
                      disabled={generating === inc.id}
                      className="w-full flex items-center justify-between p-3 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-violet-500/50 transition-colors text-left disabled:opacity-50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {inc.title}
                        </p>
                        <p className="text-xs text-zinc-500 capitalize">
                          {inc.severity} · {inc.status}
                        </p>
                      </div>
                      {generating === inc.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-violet-400 shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Past Reports */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h2 className="font-semibold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider text-zinc-400">
                <FileText className="w-4 h-4 text-cyan-400" />
                Saved Reports
              </h2>
              <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                {reports.length === 0 ? (
                  <p className="text-sm text-zinc-500 py-4 text-center">
                    No reports generated yet.
                  </p>
                ) : (
                  reports.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setSelectedReport(r)}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-lg border transition-colors text-left",
                        selectedReport?.id === r.id
                          ? "bg-violet-500/10 border-violet-500/30"
                          : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {r.report_content.incidentOverview.title}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {new Date(r.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0",
                          r.report_content.riskLevel === "Critical"
                            ? "bg-red-500/20 text-red-400"
                            : r.report_content.riskLevel === "High"
                              ? "bg-amber-500/20 text-amber-400"
                              : r.report_content.riskLevel === "Medium"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-emerald-500/20 text-emerald-400"
                        )}
                      >
                        {r.report_content.riskLevel}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Report Preview */}
          <div className="lg:col-span-2">
            {!selectedReport ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
                <FileText className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-zinc-400 mb-2">
                  No Report Selected
                </h3>
                <p className="text-sm text-zinc-500">
                  Generate a new report or select a saved one from the left
                  panel.
                </p>
              </div>
            ) : (
              <ReportPreview
                report={selectedReport}
                reportRef={reportRef}
                onDownload={handleDownloadPDF}
                onRegenerate={() => handleGenerate(selectedReport.incident_id)}
                regenerating={generating === selectedReport.incident_id}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────
// REPORT PREVIEW COMPONENT
// ──────────────────────────────────────────────────
function ReportPreview({
  report,
  reportRef,
  onDownload,
  onRegenerate,
  regenerating,
}: {
  report: Report;
  reportRef: React.RefObject<HTMLDivElement | null>;
  onDownload: () => void;
  onRegenerate: () => void;
  regenerating: boolean;
}) {
  const rc = report.report_content;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Report Header Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-800/30">
        <div>
          <h2 className="text-lg font-semibold">{rc.incidentOverview.title}</h2>
          <p className="text-xs text-zinc-500">
            Generated {new Date(report.created_at).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRegenerate}
            disabled={regenerating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            {regenerating ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
            Regenerate
          </button>
          <button
            onClick={onDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors"
          >
            <Download className="w-3 h-3" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Report Content (Scrollable) */}
      <div
        ref={reportRef}
        className="p-6 max-h-[calc(100vh-12rem)] overflow-y-auto custom-scrollbar space-y-8"
      >
        {/* Executive Summary */}
        <section>
          <SectionTitle icon={Sparkles} color="text-violet-400" title="Executive Summary" />
          <div className="flex items-center gap-3 mb-3">
            <span
              className={cn(
                "px-3 py-1 rounded-full text-xs font-bold uppercase",
                rc.riskLevel === "Critical"
                  ? "bg-red-500/20 text-red-400"
                  : rc.riskLevel === "High"
                    ? "bg-amber-500/20 text-amber-400"
                    : rc.riskLevel === "Medium"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-emerald-500/20 text-emerald-400"
              )}
            >
              Risk: {rc.riskLevel}
            </span>
          </div>
          <p className="text-zinc-300 leading-relaxed">{rc.executiveSummary}</p>
        </section>

        {/* Incident Overview */}
        <section>
          <SectionTitle icon={ShieldAlert} color="text-blue-400" title="Incident Overview" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <InfoItem label="Severity" value={rc.incidentOverview.severity} />
            <InfoItem label="Status" value={rc.incidentOverview.status} />
            <InfoItem label="Source" value={rc.incidentOverview.source} />
            <InfoItem label="Created" value={new Date(rc.incidentOverview.createdAt).toLocaleDateString()} />
            <InfoItem label="Resolved" value={rc.incidentOverview.resolvedAt ? new Date(rc.incidentOverview.resolvedAt).toLocaleDateString() : "Pending"} />
            <InfoItem label="Resolution Time" value={rc.incidentOverview.resolutionTimeMinutes ? `${rc.incidentOverview.resolutionTimeMinutes} min` : "N/A"} />
          </div>
        </section>

        {/* Business Impact */}
        <section>
          <SectionTitle icon={AlertTriangle} color="text-amber-400" title="Business Impact Assessment" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ImpactItem label="Operational Impact" value={rc.businessImpact.operationalImpact} />
            <ImpactItem label="Data Exposure Risk" value={rc.businessImpact.dataExposureRisk} />
            <ImpactItem label="Service Availability" value={rc.businessImpact.serviceAvailability} />
            <ImpactItem label="Financial Risk" value={rc.businessImpact.financialRisk} />
            <ImpactItem label="Reputation Risk" value={rc.businessImpact.reputationRisk} />
          </div>
        </section>

        {/* Timeline */}
        <section>
          <SectionTitle icon={Clock} color="text-cyan-400" title="Incident Timeline" />
          <div className="space-y-3 pl-4 border-l-2 border-zinc-800">
            {rc.timeline.map((item, i) => (
              <div key={i} className="flex gap-4 relative">
                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-zinc-800 border-2 border-cyan-500" />
                <span className="text-xs font-mono text-zinc-500 min-w-[50px] pt-0.5">
                  {item.time}
                </span>
                <p className="text-sm text-zinc-300">{item.event}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Root Cause Analysis */}
        <section>
          <SectionTitle icon={Target} color="text-red-400" title="Root Cause Analysis" />
          <p className="text-zinc-300 mb-3">{rc.rootCauseAnalysis.rootCause}</p>
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
            Contributing Factors
          </h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-zinc-400">
            {rc.rootCauseAnalysis.contributingFactors.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
          <p className="text-sm text-zinc-500 mt-3 italic">
            {rc.rootCauseAnalysis.historicalSimilarities}
          </p>
        </section>

        {/* Resolution */}
        <section>
          <SectionTitle icon={CheckCircle2} color="text-emerald-400" title="Resolution Details" />
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Actions Taken</h4>
              <p className="text-sm text-zinc-300">{rc.resolution.actionsTaken}</p>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Strategy</h4>
              <p className="text-sm text-zinc-300">{rc.resolution.resolutionStrategy}</p>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Time to Resolution</h4>
              <p className="text-sm text-zinc-300">{rc.resolution.timeToResolution}</p>
            </div>
          </div>
        </section>

        {/* Lessons Learned */}
        <section>
          <SectionTitle icon={BookOpen} color="text-indigo-400" title="Lessons Learned" />
          <ul className="space-y-2">
            {rc.lessonsLearned.map((lesson, i) => (
              <li
                key={i}
                className="flex gap-3 text-sm text-zinc-300 bg-zinc-950 p-3 rounded-lg border border-zinc-800"
              >
                <span className="text-indigo-400 font-bold">{i + 1}.</span>
                {lesson}
              </li>
            ))}
          </ul>
        </section>

        {/* Recommendations */}
        <section>
          <SectionTitle icon={TrendingUp} color="text-green-400" title="Prevention Recommendations" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                Short-Term Actions
              </h4>
              <ul className="space-y-1.5">
                {rc.recommendations.shortTerm.map((r, i) => (
                  <li key={i} className="text-sm text-zinc-300 flex gap-2">
                    <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
                Long-Term Actions
              </h4>
              <ul className="space-y-1.5">
                {rc.recommendations.longTerm.map((r, i) => (
                  <li key={i} className="text-sm text-zinc-300 flex gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Historical Context */}
        <section>
          <SectionTitle icon={Brain} color="text-cyan-400" title="Historical Context (Hindsight)" />
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 text-center">
              <p className="text-2xl font-bold text-cyan-400">
                {rc.historicalContext.similarIncidents}
              </p>
              <p className="text-xs text-zinc-500 mt-1">Similar Incidents</p>
            </div>
            <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800">
              <p className="text-xs text-zinc-500 mb-1">Most Common Cause</p>
              <p className="text-sm text-zinc-300 font-medium">
                {rc.historicalContext.mostCommonCause}
              </p>
            </div>
            <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800">
              <p className="text-xs text-zinc-500 mb-1">Best Remediation</p>
              <p className="text-sm text-zinc-300 font-medium">
                {rc.historicalContext.mostEffectiveRemediation}
              </p>
            </div>
          </div>
        </section>

        {/* Organizational Learning Impact */}
        <section>
          <SectionTitle icon={Brain} color="text-violet-400" title="Organizational Learning Impact" />
          <div className="bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 p-5 rounded-xl border border-violet-500/20">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-violet-400">
                  +{rc.organizationalLearning.memoriesContributed}
                </p>
                <p className="text-xs text-zinc-400 mt-1">Memories Contributed</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-fuchsia-300">
                  {rc.organizationalLearning.threatCategory}
                </p>
                <p className="text-xs text-zinc-400 mt-1">Threat Category</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-emerald-400">
                  {rc.organizationalLearning.copilotKnowledgeUpdated
                    ? "✓ Updated"
                    : "Pending"}
                </p>
                <p className="text-xs text-zinc-400 mt-1">Copilot Knowledge</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────
// SUB-COMPONENTS
// ──────────────────────────────────────────────────
function SectionTitle({
  icon: Icon,
  color,
  title,
}: {
  icon: React.ElementType;
  color: string;
  title: string;
}) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4">
      <Icon className={cn("w-4 h-4", color)} />
      {title}
    </h3>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
      <p className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="text-sm font-medium text-zinc-200 capitalize mt-0.5">
        {value}
      </p>
    </div>
  );
}

function ImpactItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
      <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">{label}</p>
      <p className="text-sm text-zinc-300">{value}</p>
    </div>
  );
}
