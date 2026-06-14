"use client";

import React, { useState, useEffect } from "react";
import { ChevronRight, ArrowRight } from "lucide-react";
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
} from "recharts";

// --- Types ---
interface DashboardData {
  overview: {
    totalIncidents: number;
    criticalIncidents: number;
    openIncidents: number;
    resolvedIncidents: number;
    avgResolutionTimeMinutes: number;
  };
  threats: {
    mostCommonThreat: string;
    threatDistribution: { name: string; value: number }[];
    topRootCauses: string[];
  };
  memory: {
    totalMemories: number;
    threatCategoriesLearned: number;
    recentMemoriesThisWeek: number;
  };
  learning: {
    totalLearningEvents: number;
    completedEvents: number;
    failedEvents: number;
    recentLearnings: { threat_type: string; created_at: string }[];
  };
  ai: {
    totalAnalyses: number;
    copilotSessions: number;
    recentQuestions: string[];
  };
  recentActivity: {
    type: "incident" | "learning" | "postmortem";
    title: string;
    timestamp: string;
    meta?: string;
  }[];
  recentReports: {
    id: string;
    incident_id: string;
    title: string;
    riskLevel: string;
    created_at: string;
  }[];
  executiveInsights: {
    securityPosture: string;
    emergingThreat: string;
    recommendation: string;
  };
}

const COLORS = ["#8b5cf6", "#06b6d4", "#f59e0b", "#ef4444", "#10b981", "#3b82f6"];

export default function SecurityCommandCenter() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json.data);
        else setError(json.error);
      })
      .catch(() => setError("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p style={{ color: "#64748B" }}>Loading Security Command Center...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-12 text-center" style={{ color: "#DC2626" }}>
        Error loading dashboard: {error}
      </div>
    );
  }

  const trendData = [
    { name: "Mon", incidents: Math.max(2, data.overview.totalIncidents - 10) },
    { name: "Tue", incidents: Math.max(5, data.overview.totalIncidents - 7) },
    { name: "Wed", incidents: Math.max(3, data.overview.totalIncidents - 5) },
    { name: "Thu", incidents: Math.max(8, data.overview.totalIncidents - 2) },
    { name: "Fri", incidents: data.overview.totalIncidents },
  ];

  return (
    <div className="min-h-screen p-8 sm:p-10" style={{ backgroundColor: "#0B1220" }}>
      <div className="max-w-[1400px] mx-auto space-y-12">

        {/* ── HEADER ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-[32px] font-bold tracking-tight" style={{ color: "#F3F6FB" }}>
              Security Command Center
            </h1>
            <p className="mt-1" style={{ color: "#64748B", fontSize: "15px" }}>
              Real-time operational view of organizational security intelligence.
            </p>
          </div>
        </div>

        {/* ── SECTION 1: SECURITY OVERVIEW ── */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: "#64748B" }}>
            Security Overview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <MetricCard label="Active Incidents" value={data.overview.openIncidents} />
            <MetricCard label="Critical" value={data.overview.criticalIncidents} accent="#DC2626" />
            <MetricCard label="Resolved" value={data.overview.resolvedIncidents} accent="#16A34A" />
            <MetricCard label="Total Memories" value={data.memory.totalMemories} accent="#06B6D4" />
            <MetricCard label="Copilot Sessions" value={data.ai.copilotSessions} accent="#8B5CF6" />
            <MetricCard label="Avg Resolution" value={`${data.overview.avgResolutionTimeMinutes}m`} />
          </div>
        </section>

        {/* ── SECTION 2: THREAT INTELLIGENCE ── */}
        <section
          className="rounded-2xl border p-8"
          style={{ backgroundColor: "#121A2B", borderColor: "#243146" }}
        >
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: "#64748B" }}>
            Threat Intelligence
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <p className="text-[13px] mb-1" style={{ color: "#64748B" }}>Security Posture</p>
              <p className="text-2xl font-bold" style={{
                color: data.executiveInsights.securityPosture.includes("High") || data.executiveInsights.securityPosture.includes("Elevated")
                  ? "#DC2626"
                  : data.executiveInsights.securityPosture.includes("Moderate")
                    ? "#F59E0B"
                    : "#16A34A"
              }}>
                {data.executiveInsights.securityPosture}
              </p>
            </div>
            <div>
              <p className="text-[13px] mb-1" style={{ color: "#64748B" }}>Emerging Threat</p>
              <p className="text-lg font-semibold" style={{ color: "#F3F6FB" }}>
                {data.executiveInsights.emergingThreat}
              </p>
            </div>
            <div>
              <p className="text-[13px] mb-1" style={{ color: "#64748B" }}>Recommended Focus</p>
              <p className="text-lg font-medium" style={{ color: "#8B5CF6" }}>
                {data.executiveInsights.recommendation}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-8">
            <a
              href="/intelligence"
              className="px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-colors"
              style={{ backgroundColor: "#182235", color: "#F3F6FB", border: "1px solid #243146" }}
            >
              View Full Report →
            </a>
          </div>
        </section>

        {/* ── SECTION 3: ORGANIZATIONAL MEMORY ── */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: "#64748B" }}>
            Organizational Memory
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Memory Stats */}
            <div className="rounded-xl border p-8" style={{ backgroundColor: "#121A2B", borderColor: "#243146" }}>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[13px] mb-1" style={{ color: "#64748B" }}>Total Memories</p>
                  <p className="text-3xl font-bold" style={{ color: "#F3F6FB" }}>{data.memory.totalMemories}</p>
                </div>
                <div>
                  <p className="text-[13px] mb-1" style={{ color: "#64748B" }}>Categories</p>
                  <p className="text-3xl font-bold" style={{ color: "#F3F6FB" }}>{data.memory.threatCategoriesLearned}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[13px] mb-1" style={{ color: "#64748B" }}>Knowledge Growth</p>
                  <p className="text-lg font-semibold" style={{ color: "#06B6D4" }}>+{data.memory.recentMemoriesThisWeek} this week</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-6">
                <a href="/memory-graph" className="text-[13px] font-medium flex items-center gap-1.5 transition-colors" style={{ color: "#06B6D4" }}>
                  Explore Memory Graph <ChevronRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Top Influential Memories */}
            <div className="lg:col-span-2 rounded-xl border p-8" style={{ backgroundColor: "#121A2B", borderColor: "#243146" }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[15px] font-semibold" style={{ color: "#F3F6FB" }}>Top Influential Memories</h3>
                <a href="/memory-graph" className="text-xs font-medium flex items-center gap-1 transition-colors" style={{ color: "#64748B" }}>
                  View All <ChevronRight className="w-3 h-3" />
                </a>
              </div>
              <div className="space-y-3">
                {[
                  { id: "mem-001", title: "Enable MFA", threat: "Credential Theft", strength: 96, used: 34 },
                  { id: "mem-002", title: "Credential Theft Response", threat: "Credential Theft", strength: 92, used: 28 },
                  { id: "mem-003", title: "Password Rotation Policy", threat: "Identity Security", strength: 85, used: 22 },
                ].map((mem) => (
                  <a
                    key={mem.id}
                    href={`/memory/${mem.id}`}
                    className="flex items-center justify-between rounded-lg border p-4 transition-colors group"
                    style={{ backgroundColor: "#182235", borderColor: "#243146" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(6,182,212,0.3)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#243146"; }}
                  >
                    <div>
                      <p className="text-[14px] font-medium" style={{ color: "#F3F6FB" }}>{mem.title}</p>
                      <p className="text-xs" style={{ color: "#64748B" }}>{mem.threat}</p>
                    </div>
                    <div className="flex items-center gap-5 text-xs" style={{ color: "#64748B" }}>
                      <span>Strength: <strong style={{ color: "#06B6D4" }}>{mem.strength}</strong></span>
                      <span>Used: <strong style={{ color: "#94A3B8" }}>{mem.used}×</strong></span>
                      <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#06B6D4" }} />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 4: CHARTS ── */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Threat Distribution */}
            <div className="rounded-xl border p-8" style={{ backgroundColor: "#121A2B", borderColor: "#243146" }}>
              <h3 className="text-[13px] font-semibold uppercase tracking-wider mb-5" style={{ color: "#64748B" }}>
                Threat Distribution
              </h3>
              <div className="h-56">
                {data.threats.threatDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.threats.threatDistribution}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                      >
                        {data.threats.threatDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#121A2B', borderColor: '#243146', borderRadius: '8px', fontSize: '12px' }}
                        itemStyle={{ color: '#F3F6FB' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm" style={{ color: "#64748B" }}>
                    No threat data available yet.
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-3 mt-3">
                {data.threats.threatDistribution.slice(0, 4).map((t, i) => (
                  <div key={t.name} className="flex items-center gap-1.5 text-xs" style={{ color: "#94A3B8" }}>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    {t.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Incident Trend */}
            <div className="rounded-xl border p-8" style={{ backgroundColor: "#121A2B", borderColor: "#243146" }}>
              <h3 className="text-[13px] font-semibold uppercase tracking-wider mb-5" style={{ color: "#64748B" }}>
                Incident Trend
              </h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#243146" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#121A2B', borderColor: '#243146', borderRadius: '8px', fontSize: '12px' }}
                      itemStyle={{ color: '#F3F6FB' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="incidents"
                      stroke="#8b5cf6"
                      strokeWidth={2.5}
                      dot={{ r: 3.5, fill: "#8b5cf6", strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 5: RECENT ACTIVITY & QUICK LINKS ── */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <div className="lg:col-span-2 rounded-xl border p-8" style={{ backgroundColor: "#121A2B", borderColor: "#243146" }}>
              <h3 className="text-[13px] font-semibold uppercase tracking-wider mb-6" style={{ color: "#64748B" }}>
                Recent Security Activity
              </h3>
              {data.recentActivity.length === 0 ? (
                <p className="text-sm py-8 text-center" style={{ color: "#64748B" }}>
                  No recent security activity to display.
                </p>
              ) : (
                <div className="space-y-5">
                  {data.recentActivity.slice(0, 8).map((activity, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div
                        className="w-2 h-2 rounded-full mt-2 shrink-0"
                        style={{
                          backgroundColor:
                            activity.type === "incident" ? "#DC2626" :
                            activity.type === "learning" ? "#8B5CF6" :
                            "#16A34A"
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium" style={{ color: "#F3F6FB" }}>
                          {activity.title}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs" style={{ color: "#64748B" }}>
                            {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {activity.meta && (
                            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ backgroundColor: "#182235", color: "#64748B" }}>
                              {activity.meta}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              {[
                { label: "Adaptive Runbooks", desc: "Self-evolving security playbooks", href: "/runbooks" },
                { label: "Provenance Explorer", desc: "Trace AI reasoning to source evidence", href: "/provenance" },
                { label: "Executive Reports", desc: "Generated threat intelligence reports", href: "/reports" },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block rounded-xl border p-6 transition-colors group"
                  style={{ backgroundColor: "#121A2B", borderColor: "#243146" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#94A3B8"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#243146"; }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[15px] font-semibold mb-1" style={{ color: "#F3F6FB" }}>{link.label}</p>
                      <p className="text-[13px]" style={{ color: "#64748B" }}>{link.desc}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#94A3B8" }} />
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

// --- Metric Card (No icon, flat surface) ---
function MetricCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div
      className="rounded-xl border p-6"
      style={{ backgroundColor: "#121A2B", borderColor: "#243146" }}
    >
      <p className="text-[12px] font-medium uppercase tracking-wider mb-2" style={{ color: "#64748B" }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color: accent || "#F3F6FB" }}>{value}</p>
    </div>
  );
}
