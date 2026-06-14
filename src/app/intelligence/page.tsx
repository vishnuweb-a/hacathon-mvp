"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Clock,
  ChevronRight,
  Shield,
  ArrowUpRight,
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
} from "recharts";
import type {
  StoredIntelligenceReport,
} from "@/types/intelligence";

const THREAT_COLORS = [
  "#DC2626",
  "#8B5CF6",
  "#06B6D4",
  "#F59E0B",
  "#16A34A",
  "#3B82F6",
];

const RISK_CONFIG = {
  Critical: { text: "#DC2626", bg: "rgba(220, 38, 38, 0.1)", border: "rgba(220, 38, 38, 0.2)" },
  High: { text: "#F59E0B", bg: "rgba(245, 158, 11, 0.1)", border: "rgba(245, 158, 11, 0.2)" },
  Medium: { text: "#06B6D4", bg: "rgba(6, 182, 212, 0.1)", border: "rgba(6, 182, 212, 0.2)" },
  Low: { text: "#16A34A", bg: "rgba(22, 163, 74, 0.1)", border: "rgba(22, 163, 74, 0.2)" },
};

export default function IntelligencePage() {
  const [report, setReport] = useState<StoredIntelligenceReport | null>(null);
  const [history, setHistory] = useState<StoredIntelligenceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

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

  const data = report?.report;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p style={{ color: "#64748B" }}>Building Threat Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 sm:p-10" style={{ backgroundColor: "#0B1220" }}>
      <div className="max-w-[1440px] mx-auto space-y-12">

        {/* ── HEADER ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-[32px] font-bold tracking-tight" style={{ color: "#F3F6FB" }}>
              Threat Intelligence Center
            </h1>
            <p className="mt-2 text-[15px]" style={{ color: "#64748B" }}>
              Proactive threat analysis powered by AI-driven pattern detection.
            </p>
          </div>
          <button
            onClick={generateReport}
            disabled={analyzing}
            className="shrink-0 px-6 py-3 rounded-lg font-semibold text-[13px] transition-colors disabled:opacity-50 flex items-center gap-2"
            style={{ backgroundColor: "#182235", color: "#F3F6FB", border: "1px solid #243146" }}
            onMouseEnter={(e) => { if (!analyzing) e.currentTarget.style.backgroundColor = "#243146"; }}
            onMouseLeave={(e) => { if (!analyzing) e.currentTarget.style.backgroundColor = "#182235"; }}
          >
            {analyzing && <RefreshCw className="w-4 h-4 animate-spin" />}
            {analyzing ? "Analyzing Threats..." : "Generate Intelligence Report"}
          </button>
        </div>

        {/* Analyzing Overlay (Simplified) */}
        {analyzing && (
          <div className="rounded-xl border p-12 text-center" style={{ backgroundColor: "#121A2B", borderColor: "#243146" }}>
            <p className="text-[18px] font-semibold" style={{ color: "#F3F6FB" }}>Analyzing Organizational Threat Landscape</p>
            <p className="text-[14px] mt-2" style={{ color: "#64748B" }}>Aggregating incidents, postmortems, learning events, and memories...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-xl border p-6 text-center" style={{ backgroundColor: "rgba(220, 38, 38, 0.05)", borderColor: "rgba(220, 38, 38, 0.2)" }}>
            <p className="text-[14px]" style={{ color: "#DC2626" }}>{error}</p>
            <button onClick={generateReport} className="mt-4 text-[13px] font-semibold underline" style={{ color: "#DC2626" }}>
              Retry Analysis
            </button>
          </div>
        )}

        {/* ── NO DATA STATE ── */}
        {!data && !analyzing && (
          <div className="rounded-xl border p-16 text-center" style={{ backgroundColor: "#121A2B", borderColor: "#243146", borderStyle: "dashed" }}>
            <h2 className="text-[18px] font-semibold mb-2" style={{ color: "#F3F6FB" }}>No Intelligence Reports Yet</h2>
            <p className="text-[14px] max-w-md mx-auto" style={{ color: "#64748B" }}>
              Click "Generate Intelligence Report" to analyze your organizational security history and identify emerging threats, recurring patterns, and prevention opportunities.
            </p>
          </div>
        )}

        {/* ── REPORT CONTENT ── */}
        {data && !analyzing && (
          <>
            {/* ── EXECUTIVE SUMMARY ── */}
            <div className="rounded-2xl border p-8 md:p-10" style={{ backgroundColor: "#121A2B", borderColor: "#243146" }}>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#64748B" }}>Executive Threat Summary</h2>
                {data.analysisMetadata?.generatedAt && (
                  <span className="text-[11px] font-semibold uppercase tracking-widest flex items-center gap-1.5" style={{ color: "#64748B" }}>
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(data.analysisMetadata.generatedAt).toLocaleString()}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                {/* Security Posture */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: "#64748B" }}>Security Posture</p>
                  <p className="text-[24px] font-bold" style={{ color: RISK_CONFIG[data.riskLevel]?.text || "#F3F6FB" }}>
                    {data.securityPosture}
                  </p>
                </div>

                {/* Risk Level */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: "#64748B" }}>Risk Level</p>
                  <span 
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-[13px] font-bold tracking-wide"
                    style={{ 
                      backgroundColor: RISK_CONFIG[data.riskLevel]?.bg, 
                      color: RISK_CONFIG[data.riskLevel]?.text,
                      border: `1px solid ${RISK_CONFIG[data.riskLevel]?.border}`
                    }}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    {data.riskLevel}
                  </span>
                </div>

                {/* Top Threat */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: "#64748B" }}>Top Threat</p>
                  <p className="text-[16px] font-semibold" style={{ color: "#F3F6FB" }}>
                    {data.topThreats?.[0]?.name || "None identified"}
                  </p>
                  {data.topThreats?.[0] && (
                    <p className="text-[12px] mt-1" style={{ color: "#64748B" }}>{data.topThreats[0].occurrences} occurrences</p>
                  )}
                </div>

                {/* Recommended Focus */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: "#64748B" }}>Recommended Focus</p>
                  <p className="text-[16px] font-medium" style={{ color: "#8B5CF6" }}>
                    {data.recommendations?.immediate?.[0] || "Review security posture"}
                  </p>
                </div>
              </div>

              {/* Executive Summary Text */}
              {data.executiveSummary && (
                <div className="mt-8 pt-8" style={{ borderTop: "1px solid #243146" }}>
                  <p className="text-[14px] leading-relaxed" style={{ color: "#94A3B8" }}>{data.executiveSummary}</p>
                </div>
              )}
            </div>

            {/* ── CHARTS ROW ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* Threat Distribution (Pie) */}
              <div className="rounded-xl border p-8" style={{ backgroundColor: "#121A2B", borderColor: "#243146" }}>
                <h3 className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: "#64748B" }}>
                  Threat Distribution
                </h3>
                <div className="h-64">
                  {data.topThreats?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.topThreats.map((t) => ({ name: t.name, value: t.occurrences }))}
                          innerRadius={65}
                          outerRadius={90}
                          paddingAngle={4}
                          dataKey="value"
                          stroke="none"
                        >
                          {data.topThreats.map((_, i) => (
                            <Cell key={`cell-${i}`} fill={THREAT_COLORS[i % THREAT_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: "#121A2B", borderColor: "#243146", borderRadius: "8px", fontSize: "12px" }}
                          itemStyle={{ color: "#F3F6FB" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-[13px]" style={{ color: "#64748B" }}>No threat data</div>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 mt-4">
                  {data.topThreats?.slice(0, 5).map((t, i) => (
                    <span key={t.name} className="flex items-center gap-1.5 text-[12px]" style={{ color: "#94A3B8" }}>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: THREAT_COLORS[i % THREAT_COLORS.length] }} />
                      {t.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Threat Growth Trends (Line) */}
              <div className="rounded-xl border p-8" style={{ backgroundColor: "#121A2B", borderColor: "#243146" }}>
                <h3 className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: "#64748B" }}>
                  Threat Growth Trends
                </h3>
                <div className="h-64">
                  {data.threatTrends?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={aggregateTrendsByMonth(data.threatTrends)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#243146" vertical={false} />
                        <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#121A2B", borderColor: "#243146", borderRadius: "8px", fontSize: "12px" }}
                        />
                        <Line type="monotone" dataKey="total" stroke="#06B6D4" strokeWidth={2.5} dot={{ r: 3.5, fill: "#06B6D4", strokeWidth: 0 }} name="Incidents" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-[13px]" style={{ color: "#64748B" }}>No trend data</div>
                  )}
                </div>
              </div>

              {/* Risk Score Gauge */}
              <div className="rounded-xl border p-8 flex flex-col items-center justify-center" style={{ backgroundColor: "#121A2B", borderColor: "#243146" }}>
                <h3 className="text-xs font-semibold uppercase tracking-widest mb-6 self-start" style={{ color: "#64748B" }}>
                  Calculated Risk Score
                </h3>
                <RiskGauge riskLevel={data.riskLevel} />
                <p className="text-[20px] font-bold mt-6" style={{ color: RISK_CONFIG[data.riskLevel]?.text }}>
                  {data.riskLevel} Risk
                </p>
                <p className="text-[12px] mt-2" style={{ color: "#64748B" }}>
                  Based on {data.analysisMetadata?.totalIncidentsAnalyzed || 0} incidents
                </p>
              </div>
            </div>

            {/* ── ROOT CAUSES & EMERGING THREATS ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* Root Cause Trends */}
              <div className="rounded-xl border p-8" style={{ backgroundColor: "#121A2B", borderColor: "#243146" }}>
                <h3 className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: "#64748B" }}>
                  Root Cause Analysis
                </h3>
                {data.recurringRootCauses?.length > 0 ? (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data.recurringRootCauses.slice(0, 6).map((r) => ({
                          name: r.cause.length > 25 ? r.cause.substring(0, 25) + "..." : r.cause,
                          occurrences: r.occurrences,
                        }))}
                        layout="vertical"
                        margin={{ left: 10, right: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#243146" horizontal={false} />
                        <XAxis type="number" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis type="category" dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} width={130} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#121A2B", borderColor: "#243146", borderRadius: "8px", fontSize: "12px" }}
                        />
                        <Bar dataKey="occurrences" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-72 text-[13px]" style={{ color: "#64748B" }}>No root cause data</div>
                )}
              </div>

              {/* Emerging Threats */}
              <div className="rounded-xl border p-8" style={{ backgroundColor: "#121A2B", borderColor: "#243146" }}>
                <h3 className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: "#64748B" }}>
                  Emerging Threats
                </h3>
                {data.emergingThreats?.length > 0 ? (
                  <div className="space-y-4">
                    {data.emergingThreats.slice(0, 5).map((threat) => (
                      <div
                        key={threat.name}
                        className="rounded-lg border p-5"
                        style={{ backgroundColor: "#182235", borderColor: "#243146" }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold text-[14px]" style={{ color: "#F3F6FB" }}>
                            {threat.name}
                          </span>
                          <span className="flex items-center gap-1 text-[13px] font-bold" style={{
                            color: threat.growthPercent > 50 ? "#DC2626" :
                                   threat.growthPercent > 20 ? "#F59E0B" : "#F59E0B"
                          }}>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            +{threat.growthPercent}%
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-[12px]" style={{ color: "#64748B" }}>
                          <span>Last month: <span style={{ color: "#94A3B8" }}>{threat.lastMonthCount}</span></span>
                          <ChevronRight className="w-3 h-3" />
                          <span>Current: <span className="font-semibold" style={{ color: "#F3F6FB" }}>{threat.currentMonthCount}</span></span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-72">
                    <p className="text-[14px]" style={{ color: "#94A3B8" }}>No emerging threats detected</p>
                    <p className="text-[12px] mt-1" style={{ color: "#64748B" }}>All threat categories are stable or declining</p>
                  </div>
                )}
              </div>
            </div>

            {/* ── CONTROLS + RECOMMENDATIONS ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* Most Effective Controls */}
              <div className="rounded-xl border p-8" style={{ backgroundColor: "#121A2B", borderColor: "#243146" }}>
                <h3 className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: "#64748B" }}>
                  Most Effective Controls
                </h3>
                {data.mostEffectiveControls?.length > 0 ? (
                  <div className="space-y-5">
                    {data.mostEffectiveControls.slice(0, 6).map((control) => (
                      <div key={control.control}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[13px]" style={{ color: "#F3F6FB" }}>
                            {control.control}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-[11px]" style={{ color: "#64748B" }}>{control.timesApplied}x applied</span>
                            <span className="text-[14px] font-bold" style={{
                              color: control.successRate >= 90 ? "#16A34A" :
                                     control.successRate >= 70 ? "#F59E0B" : "#DC2626"
                            }}>
                              {control.successRate}%
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#243146" }}>
                          <div
                            className="h-full rounded-full"
                            style={{ 
                              width: `${control.successRate}%`,
                              backgroundColor: control.successRate >= 90 ? "#16A34A" :
                                              control.successRate >= 70 ? "#F59E0B" : "#DC2626"
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-40 text-[13px]" style={{ color: "#64748B" }}>No control data</div>
                )}
              </div>

              {/* Recommendations */}
              <div className="rounded-xl border p-8" style={{ backgroundColor: "#121A2B", borderColor: "#243146" }}>
                <h3 className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: "#64748B" }}>
                  Prevention Recommendations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Immediate */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#DC2626" }}>Immediate</span>
                    </div>
                    <div className="space-y-3">
                      {data.recommendations?.immediate?.map((rec, i) => (
                        <div key={i} className="text-[13px] p-3 rounded border" style={{ color: "#F3F6FB", backgroundColor: "rgba(220, 38, 38, 0.05)", borderColor: "rgba(220, 38, 38, 0.2)" }}>
                          {rec}
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Strategic */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#3B82F6" }}>Strategic</span>
                    </div>
                    <div className="space-y-3">
                      {data.recommendations?.strategic?.map((rec, i) => (
                        <div key={i} className="text-[13px] p-3 rounded border" style={{ color: "#F3F6FB", backgroundColor: "rgba(59, 130, 246, 0.05)", borderColor: "rgba(59, 130, 246, 0.2)" }}>
                          {rec}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── THREAT FORECAST ── */}
            {data.threatForecast && (
              <div className="rounded-xl border p-8" style={{ backgroundColor: "#182235", borderColor: "#243146" }}>
                <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#06B6D4" }}>
                  Threat Forecast
                </h3>
                <p className="text-[14px] leading-relaxed" style={{ color: "#F3F6FB" }}>{data.threatForecast}</p>
                {data.analysisMetadata && (
                  <div className="flex flex-wrap gap-3 mt-6">
                    <span className="text-[11px] uppercase tracking-wider" style={{ color: "#64748B" }}>
                      {data.analysisMetadata.totalIncidentsAnalyzed} incidents
                    </span>
                    <span className="text-[11px] uppercase tracking-wider" style={{ color: "#64748B" }}>
                      {data.analysisMetadata.totalPostmortemsAnalyzed} postmortems
                    </span>
                    <span className="text-[11px] uppercase tracking-wider" style={{ color: "#64748B" }}>
                      {data.analysisMetadata.totalMemoriesAnalyzed} memories
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* ── REPORT HISTORY ── */}
            {history.length > 0 && (
              <div className="rounded-xl border p-8" style={{ backgroundColor: "#121A2B", borderColor: "#243146" }}>
                <h3 className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: "#64748B" }}>
                  Report History
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {history.map((h) => {
                    const r = h.report;
                    const isActive = selectedHistoryId === h.id;
                    const riskStyle = RISK_CONFIG[r.riskLevel] || RISK_CONFIG.Low;
                    return (
                      <button
                        key={h.id}
                        onClick={() => viewHistoricalReport(h)}
                        className="text-left p-5 rounded-xl border transition-colors"
                        style={{
                          backgroundColor: isActive ? "#182235" : "transparent",
                          borderColor: isActive ? "#64748B" : "#243146"
                        }}
                        onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.borderColor = "#64748B"; }}
                        onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.borderColor = "#243146"; }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span 
                            className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                            style={{ backgroundColor: riskStyle.bg, color: riskStyle.text }}
                          >
                            {r.riskLevel}
                          </span>
                          <span className="text-[10px] font-medium" style={{ color: "#64748B" }}>
                            {r.analysisMetadata?.analysisMethod === "gemini" ? "AI" : "Stats"}
                          </span>
                        </div>
                        <p className="text-[12px] truncate" style={{ color: "#94A3B8" }}>{r.securityPosture}</p>
                        <p className="text-[10px] mt-2" style={{ color: "#64748B" }}>
                          {new Date(h.created_at).toLocaleDateString()}
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

function RiskGauge({ riskLevel }: { riskLevel: "Low" | "Medium" | "High" | "Critical" }) {
  const scoreMap = { Low: 25, Medium: 50, High: 75, Critical: 95 };
  const score = scoreMap[riskLevel] || 50;
  const colorMap = { Low: "#16A34A", Medium: "#F59E0B", High: "#F97316", Critical: "#DC2626" };
  const color = colorMap[riskLevel] || "#F59E0B";

  const radius = 60;
  const circumference = Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-40 h-24">
      <svg viewBox="0 0 140 80" className="w-full h-full">
        {/* Background arc */}
        <path
          d="M 10 70 A 60 60 0 0 1 130 70"
          fill="none"
          stroke="#243146"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Score arc */}
        <path
          d="M 10 70 A 60 60 0 0 1 130 70"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
        {/* Score text */}
        <text x="70" y="65" textAnchor="middle" className="text-[28px] font-bold" fill="#F3F6FB">
          {score}
        </text>
        <text x="70" y="78" textAnchor="middle" className="text-[10px] font-semibold uppercase tracking-widest" fill="#64748B">
          Score
        </text>
      </svg>
    </div>
  );
}

function aggregateTrendsByMonth(trends: { month: string; category: string; count: number }[]) {
  const monthTotals: Record<string, number> = {};
  for (const t of trends) {
    monthTotals[t.month] = (monthTotals[t.month] || 0) + t.count;
  }
  return Object.entries(monthTotals).map(([month, total]) => ({ month, total }));
}
