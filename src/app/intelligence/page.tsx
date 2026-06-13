"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Radar,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Target,
  Eye,
  ArrowUpRight,
  Loader2,
  RefreshCw,
  Clock,
  ChevronRight,
  Shield,
  Activity,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import type {
  ThreatIntelligenceReport,
  StoredIntelligenceReport,
} from "@/types/intelligence";

// --- Premium Color Palette ---
const THREAT_COLORS = [
  "#f43f5e",
  "#8b5cf6",
  "#06b6d4",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ec4899",
  "#14b8a6",
  "#a855f7",
  "#ef4444",
];

const RISK_CONFIG = {
  Critical: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", glow: "shadow-red-500/20" },
  High: { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", glow: "shadow-orange-500/20" },
  Medium: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", glow: "shadow-amber-500/20" },
  Low: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", glow: "shadow-emerald-500/20" },
};

export default function IntelligencePage() {
  const [report, setReport] = useState<StoredIntelligenceReport | null>(null);
  const [history, setHistory] = useState<StoredIntelligenceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

  // Load latest report and history on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [latestRes, historyRes] = await Promise.all([
        fetch("/api/intelligence/latest"),
        fetch("/api/intelligence/history"),
      ]);
      const latestJson = await latestRes.json();
      const historyJson = await historyRes.json();

      if (latestJson.success && latestJson.data) {
        setReport(latestJson.data);
      }
      if (historyJson.success) {
        setHistory(historyJson.data || []);
      }
    } catch (err) {
      console.error("Failed to load intelligence data:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = useCallback(async () => {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch("/api/intelligence/analyze", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setReport(json.data);
        // Refresh history
        const histRes = await fetch("/api/intelligence/history");
        const histJson = await histRes.json();
        if (histJson.success) setHistory(histJson.data || []);
        setSelectedHistoryId(null);
      } else {
        setError(json.error || "Analysis failed");
      }
    } catch (err) {
      setError("Failed to generate intelligence report");
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const viewHistoricalReport = (stored: StoredIntelligenceReport) => {
    setReport(stored);
    setSelectedHistoryId(stored.id);
  };

  // Currently displayed report data
  const data = report?.report;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-zinc-800 animate-pulse" />
            <Radar className="w-8 h-8 text-rose-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" style={{ animationDuration: "3s" }} />
          </div>
          <p className="text-zinc-500 text-sm">Loading Intelligence Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 sm:p-8 overflow-x-hidden font-sans">
      <div className="max-w-[1440px] mx-auto space-y-6 animate-in fade-in duration-500">

        {/* === HEADER === */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500/20 to-violet-500/20 border border-rose-500/20">
                <Radar className="w-6 h-6 text-rose-400" />
              </div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-400 via-violet-400 to-cyan-400">
                Threat Intelligence Center
              </h1>
            </div>
            <p className="text-zinc-500 ml-14">
              Proactive threat analysis powered by AI-driven pattern detection.
            </p>
          </div>
          <button
            onClick={generateReport}
            disabled={analyzing}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-300",
              analyzing
                ? "bg-zinc-800 text-zinc-400 cursor-not-allowed"
                : "bg-gradient-to-r from-rose-500 to-violet-600 text-white hover:from-rose-400 hover:to-violet-500 shadow-lg shadow-rose-500/20 hover:shadow-rose-500/30 hover:scale-[1.02] active:scale-[0.98]"
            )}
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing Threats...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Generate Intelligence Report
              </>
            )}
          </button>
        </div>

        {/* Analyzing Overlay */}
        {analyzing && (
          <div className="bg-gradient-to-r from-rose-500/5 via-violet-500/5 to-cyan-500/5 border border-rose-500/20 rounded-2xl p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-2 border-rose-500/30 animate-ping absolute inset-0" />
                <div className="w-20 h-20 rounded-full border-2 border-violet-500/30 flex items-center justify-center">
                  <Radar className="w-10 h-10 text-rose-400 animate-spin" style={{ animationDuration: "2s" }} />
                </div>
              </div>
              <div>
                <p className="text-lg font-semibold text-zinc-200">Analyzing Organizational Threat Landscape</p>
                <p className="text-sm text-zinc-500 mt-1">Aggregating incidents, postmortems, learning events, and memories...</p>
              </div>
              <div className="flex gap-2 mt-2">
                {["Aggregating", "Detecting Patterns", "Computing Trends", "AI Intelligence"].map((step, i) => (
                  <span key={step} className={cn(
                    "text-xs px-3 py-1 rounded-full border transition-all duration-500",
                    "border-zinc-700 text-zinc-500 animate-pulse"
                  )} style={{ animationDelay: `${i * 0.3}s` }}>
                    {step}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
            <button onClick={generateReport} className="ml-auto text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        )}

        {/* === NO DATA STATE === */}
        {!data && !analyzing && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-2xl bg-zinc-800/50">
                <Eye className="w-12 h-12 text-zinc-600" />
              </div>
              <h2 className="text-xl font-semibold text-zinc-300">No Intelligence Reports Yet</h2>
              <p className="text-zinc-500 max-w-md">
                Click &quot;Generate Intelligence Report&quot; to analyze your organizational security history
                and identify emerging threats, recurring patterns, and prevention opportunities.
              </p>
            </div>
          </div>
        )}

        {/* === REPORT CONTENT === */}
        {data && !analyzing && (
          <>
            {/* Analysis Method Badge */}
            {data.analysisMetadata?.analysisMethod === "statistical" && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 w-fit">
                <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs text-amber-400 font-medium">Statistical Analysis Only — Gemini unavailable</span>
              </div>
            )}

            {/* === EXECUTIVE SUMMARY BANNER === */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900/95 to-zinc-900/90 border border-zinc-800">
              {/* Decorative gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-rose-500/5 via-transparent to-violet-500/5 pointer-events-none" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-rose-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

              <div className="relative p-6 md:p-8">
                <div className="flex items-center gap-2 mb-6 text-rose-400">
                  <Sparkles className="w-5 h-5" />
                  <h2 className="text-sm font-bold uppercase tracking-wider">Executive Threat Summary</h2>
                  {data.analysisMetadata?.generatedAt && (
                    <span className="text-xs text-zinc-600 ml-auto flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(data.analysisMetadata.generatedAt).toLocaleString()}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Security Posture */}
                  <div className="space-y-1">
                    <p className="text-zinc-500 text-xs uppercase tracking-wider">Security Posture</p>
                    <p className={cn("text-2xl font-bold", RISK_CONFIG[data.riskLevel]?.color || "text-zinc-300")}>
                      {data.securityPosture}
                    </p>
                  </div>

                  {/* Risk Level */}
                  <div className="space-y-1">
                    <p className="text-zinc-500 text-xs uppercase tracking-wider">Risk Level</p>
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border",
                      RISK_CONFIG[data.riskLevel]?.bg,
                      RISK_CONFIG[data.riskLevel]?.color,
                      RISK_CONFIG[data.riskLevel]?.border,
                    )}>
                      <Shield className="w-3.5 h-3.5" />
                      {data.riskLevel}
                    </span>
                  </div>

                  {/* Top Threat */}
                  <div className="space-y-1">
                    <p className="text-zinc-500 text-xs uppercase tracking-wider">Top Threat</p>
                    <p className="text-lg font-semibold text-zinc-200">
                      {data.topThreats?.[0]?.name || "None identified"}
                    </p>
                    {data.topThreats?.[0] && (
                      <p className="text-xs text-zinc-500">{data.topThreats[0].occurrences} occurrences</p>
                    )}
                  </div>

                  {/* Recommended Focus */}
                  <div className="space-y-1">
                    <p className="text-zinc-500 text-xs uppercase tracking-wider">Recommended Focus</p>
                    <p className="text-lg font-medium text-violet-300">
                      {data.recommendations?.immediate?.[0] || "Review security posture"}
                    </p>
                  </div>
                </div>

                {/* Executive Summary Text */}
                {data.executiveSummary && (
                  <div className="mt-6 pt-6 border-t border-zinc-800">
                    <p className="text-sm text-zinc-400 leading-relaxed">{data.executiveSummary}</p>
                  </div>
                )}
              </div>
            </div>

            {/* === MAIN GRID === */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* --- THREAT DISTRIBUTION (Pie) --- */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  Threat Distribution
                </h3>
                <div className="h-56">
                  {data.topThreats?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.topThreats.map((t) => ({ name: t.name, value: t.occurrences }))}
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                          stroke="none"
                        >
                          {data.topThreats.map((_, i) => (
                            <Cell key={`cell-${i}`} fill={THREAT_COLORS[i % THREAT_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "10px", fontSize: "12px" }}
                          itemStyle={{ color: "#e4e4e7" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-zinc-600 text-sm">No threat data</div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {data.topThreats?.slice(0, 5).map((t, i) => (
                    <span key={t.name} className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-800/50 px-2 py-1 rounded-md">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: THREAT_COLORS[i % THREAT_COLORS.length] }} />
                      {t.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* --- THREAT GROWTH TRENDS (Line) --- */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  Threat Growth Trends
                </h3>
                <div className="h-56">
                  {data.threatTrends?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={aggregateTrendsByMonth(data.threatTrends)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="month" stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "10px", fontSize: "12px" }}
                        />
                        <Line type="monotone" dataKey="total" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 3, fill: "#06b6d4", strokeWidth: 0 }} name="Incidents" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-zinc-600 text-sm">No trend data</div>
                  )}
                </div>
              </div>

              {/* --- RISK SCORE GAUGE --- */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col items-center justify-center">
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm self-start">
                  <Target className="w-4 h-4 text-amber-400" />
                  Risk Score
                </h3>
                <RiskGauge riskLevel={data.riskLevel} />
                <p className={cn("text-lg font-bold mt-4", RISK_CONFIG[data.riskLevel]?.color)}>
                  {data.riskLevel} Risk
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Based on {data.analysisMetadata?.totalIncidentsAnalyzed || 0} incidents
                </p>
              </div>
            </div>

            {/* === SECOND ROW: ROOT CAUSES BAR CHART + EMERGING THREATS === */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Root Cause Trends (Bar) */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm">
                  <BarChart3 className="w-4 h-4 text-violet-400" />
                  Root Cause Analysis
                </h3>
                {data.recurringRootCauses?.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data.recurringRootCauses.slice(0, 6).map((r) => ({
                          name: r.cause.length > 25 ? r.cause.substring(0, 25) + "..." : r.cause,
                          occurrences: r.occurrences,
                        }))}
                        layout="vertical"
                        margin={{ left: 10, right: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                        <XAxis type="number" stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis type="category" dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} width={130} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "10px", fontSize: "12px" }}
                        />
                        <Bar dataKey="occurrences" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={18} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-zinc-600 text-sm">No root cause data</div>
                )}

                {/* Root cause trend indicators */}
                {data.recurringRootCauses?.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {data.recurringRootCauses.slice(0, 4).map((rc) => (
                      <div key={rc.cause} className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400 truncate max-w-[60%]">{rc.cause}</span>
                        <span className={cn(
                          "flex items-center gap-1 font-medium",
                          rc.trend === "Increasing" ? "text-red-400" :
                          rc.trend === "Decreasing" ? "text-emerald-400" : "text-zinc-500"
                        )}>
                          {rc.trend === "Increasing" ? <TrendingUp className="w-3 h-3" /> :
                           rc.trend === "Decreasing" ? <TrendingDown className="w-3 h-3" /> :
                           <Minus className="w-3 h-3" />}
                          {rc.trend}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Emerging Threats */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  Emerging Threats
                </h3>
                {data.emergingThreats?.length > 0 ? (
                  <div className="space-y-3">
                    {data.emergingThreats.slice(0, 5).map((threat, i) => (
                      <div
                        key={threat.name}
                        className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 hover:border-red-500/30 transition-all group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-zinc-200 group-hover:text-white transition-colors">
                            {threat.name}
                          </span>
                          <span className={cn(
                            "flex items-center gap-1 text-sm font-bold",
                            threat.growthPercent > 50 ? "text-red-400" :
                            threat.growthPercent > 20 ? "text-orange-400" : "text-amber-400"
                          )}>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            +{threat.growthPercent}%
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-zinc-500">
                          <span>Last month: <span className="text-zinc-400">{threat.lastMonthCount}</span></span>
                          <ChevronRight className="w-3 h-3" />
                          <span>Current: <span className="text-zinc-300 font-medium">{threat.currentMonthCount}</span></span>
                        </div>
                        {/* Growth bar */}
                        <div className="mt-3 h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-700",
                              threat.growthPercent > 50 ? "bg-gradient-to-r from-red-500 to-orange-500" :
                              threat.growthPercent > 20 ? "bg-gradient-to-r from-orange-500 to-amber-500" :
                              "bg-gradient-to-r from-amber-500 to-yellow-500"
                            )}
                            style={{ width: `${Math.min(threat.growthPercent, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-zinc-600">
                    <CheckCircle2 className="w-8 h-8 mb-2 text-emerald-500/50" />
                    <p className="text-sm">No emerging threats detected</p>
                    <p className="text-xs text-zinc-700 mt-1">All threat categories are stable or declining</p>
                  </div>
                )}
              </div>
            </div>

            {/* === THIRD ROW: CONTROLS + RECOMMENDATIONS === */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Most Effective Controls */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Most Effective Controls
                </h3>
                {data.mostEffectiveControls?.length > 0 ? (
                  <div className="space-y-3">
                    {data.mostEffectiveControls.slice(0, 6).map((control, i) => (
                      <div key={control.control} className="group">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">
                            {control.control}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-500">{control.timesApplied}x applied</span>
                            <span className={cn(
                              "text-sm font-bold",
                              control.successRate >= 90 ? "text-emerald-400" :
                              control.successRate >= 70 ? "text-amber-400" : "text-red-400"
                            )}>
                              {control.successRate}%
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-700",
                              control.successRate >= 90 ? "bg-gradient-to-r from-emerald-500 to-green-400" :
                              control.successRate >= 70 ? "bg-gradient-to-r from-amber-500 to-yellow-400" :
                              "bg-gradient-to-r from-red-500 to-orange-400"
                            )}
                            style={{ width: `${control.successRate}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-40 text-zinc-600 text-sm">No control data</div>
                )}
              </div>

              {/* Recommendations */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Prevention Recommendations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Immediate */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-wider text-red-400">Immediate</span>
                    </div>
                    <div className="space-y-2">
                      {data.recommendations?.immediate?.map((rec, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-zinc-300 bg-red-500/5 border border-red-500/10 rounded-lg p-3">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Strategic */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Strategic</span>
                    </div>
                    <div className="space-y-2">
                      {data.recommendations?.strategic?.map((rec, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-zinc-300 bg-blue-500/5 border border-blue-500/10 rounded-lg p-3">
                          <Target className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* === THREAT FORECAST === */}
            {data.threatForecast && (
              <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/95 to-zinc-900/90 border border-zinc-800 rounded-xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-cyan-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center gap-2 mb-3 text-cyan-400">
                  <Activity className="w-4 h-4" />
                  <h3 className="text-sm font-bold uppercase tracking-wider">Threat Forecast</h3>
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed relative z-10">{data.threatForecast}</p>
                {data.analysisMetadata && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-zinc-800 text-zinc-500">
                      {data.analysisMetadata.totalIncidentsAnalyzed} incidents
                    </span>
                    <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-zinc-800 text-zinc-500">
                      {data.analysisMetadata.totalPostmortemsAnalyzed} postmortems
                    </span>
                    <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-zinc-800 text-zinc-500">
                      {data.analysisMetadata.totalLearningEventsAnalyzed} learning events
                    </span>
                    <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-zinc-800 text-zinc-500">
                      {data.analysisMetadata.totalMemoriesAnalyzed} memories
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* === REPORT HISTORY === */}
            {history.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-zinc-400" />
                  Report History
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {history.map((h) => {
                    const r = h.report;
                    const isActive = selectedHistoryId === h.id;
                    return (
                      <button
                        key={h.id}
                        onClick={() => viewHistoricalReport(h)}
                        className={cn(
                          "text-left p-4 rounded-lg border transition-all group",
                          isActive
                            ? "bg-violet-500/10 border-violet-500/30"
                            : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={cn(
                            "text-xs font-bold px-2 py-0.5 rounded",
                            RISK_CONFIG[r.riskLevel]?.bg,
                            RISK_CONFIG[r.riskLevel]?.color,
                          )}>
                            {r.riskLevel}
                          </span>
                          <span className="text-[10px] text-zinc-600">
                            {r.analysisMetadata?.analysisMethod === "gemini" ? "✦ AI" : "📊 Stats"}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 truncate">{r.securityPosture}</p>
                        <p className="text-[10px] text-zinc-600 mt-1">
                          {new Date(h.created_at).toLocaleString()}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// === HELPER COMPONENTS ===

/**
 * Animated risk gauge indicator using SVG arc.
 */
function RiskGauge({ riskLevel }: { riskLevel: "Low" | "Medium" | "High" | "Critical" }) {
  const scoreMap = { Low: 25, Medium: 50, High: 75, Critical: 95 };
  const score = scoreMap[riskLevel] || 50;
  const colorMap = { Low: "#10b981", Medium: "#f59e0b", High: "#f97316", Critical: "#ef4444" };
  const color = colorMap[riskLevel] || "#f59e0b";

  // SVG arc calculation
  const radius = 60;
  const circumference = Math.PI * radius; // half circle
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-40 h-24">
      <svg viewBox="0 0 140 80" className="w-full h-full">
        {/* Background arc */}
        <path
          d="M 10 70 A 60 60 0 0 1 130 70"
          fill="none"
          stroke="#27272a"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Score arc */}
        <path
          d="M 10 70 A 60 60 0 0 1 130 70"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
        />
        {/* Score text */}
        <text x="70" y="65" textAnchor="middle" className="fill-white text-2xl font-bold" fontSize="24">
          {score}
        </text>
        <text x="70" y="78" textAnchor="middle" className="fill-zinc-500" fontSize="8">
          / 100
        </text>
      </svg>
    </div>
  );
}

/**
 * Aggregate trend data by month for the line chart.
 */
function aggregateTrendsByMonth(trends: { month: string; category: string; count: number }[]) {
  const monthTotals: Record<string, number> = {};
  for (const t of trends) {
    monthTotals[t.month] = (monthTotals[t.month] || 0) + t.count;
  }
  return Object.entries(monthTotals).map(([month, total]) => ({ month, total }));
}
