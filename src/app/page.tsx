"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Database,
  Brain,
  Sparkles,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  BookOpen,
  Terminal,
  Zap,
  ChevronRight,
  GitBranch,
  ArrowRight,
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

// --- Colors for Charts ---
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
      .catch((err) => setError("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center text-red-500 bg-black min-h-screen">
        Error loading dashboard: {error}
      </div>
    );
  }

  // Mock data for Incident Trend Chart (Line Chart) based on total incidents for demo
  const trendData = [
    { name: "Mon", incidents: Math.max(2, data.overview.totalIncidents - 10) },
    { name: "Tue", incidents: Math.max(5, data.overview.totalIncidents - 7) },
    { name: "Wed", incidents: Math.max(3, data.overview.totalIncidents - 5) },
    { name: "Thu", incidents: Math.max(8, data.overview.totalIncidents - 2) },
    { name: "Fri", incidents: data.overview.totalIncidents },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 sm:p-8 overflow-x-hidden font-sans">
      <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
              Security Intelligence Command Center
            </h1>
            <p className="text-zinc-500 mt-1">
              Real-time operational view of SentinelMind OS.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              System Active
            </span>
          </div>
        </div>

        {/* SECTION 11: EXECUTIVE INSIGHTS (Top Priority) */}
        <div className="bg-gradient-to-r from-zinc-900 to-zinc-900/50 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Sparkles className="w-32 h-32 text-indigo-500" />
          </div>
          <div className="flex items-center gap-2 mb-4 text-indigo-400">
            <Sparkles className="w-5 h-5" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Gemini Executive Insight</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            <div>
              <p className="text-zinc-500 text-sm mb-1">Security Posture</p>
              <p className={cn(
                "text-2xl font-semibold",
                data.executiveInsights.securityPosture.includes("High") || data.executiveInsights.securityPosture.includes("Elevated") ? "text-red-400" :
                data.executiveInsights.securityPosture.includes("Moderate") ? "text-amber-400" : "text-emerald-400"
              )}>
                {data.executiveInsights.securityPosture}
              </p>
            </div>
            <div>
              <p className="text-zinc-500 text-sm mb-1">Emerging Threat</p>
              <p className="text-lg font-medium text-zinc-200">
                {data.executiveInsights.emergingThreat}
              </p>
            </div>
            <div>
              <p className="text-zinc-500 text-sm mb-1">Recommendation</p>
              <p className="text-lg font-medium text-indigo-300">
                {data.executiveInsights.recommendation}
              </p>
            </div>
          </div>
        </div>

        {/* THREAT INTELLIGENCE PROMO */}
        <div className="bg-gradient-to-r from-rose-500/10 via-violet-500/10 to-cyan-500/10 border border-rose-500/20 rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-rose-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 rounded-xl bg-zinc-950/50 border border-rose-500/20 text-rose-400">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Proactive Threat Intelligence</h2>
              <p className="text-sm text-zinc-400 max-w-xl">
                Analyze patterns across incidents, postmortems, and learning events to predict emerging threats and visualize your security posture.
              </p>
            </div>
          </div>
          <a
            href="/intelligence"
            className="shrink-0 relative z-10 bg-gradient-to-r from-rose-500 to-violet-600 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:from-rose-400 hover:to-violet-500 shadow-lg shadow-rose-500/20 hover:shadow-rose-500/30 transition-all flex items-center gap-2 group"
          >
            Launch Intelligence Center
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* PROVENANCE EXPLORER PROMO */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-zinc-950/50 border border-emerald-500/20 text-emerald-400">
              <GitBranch className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Memory Provenance Explorer</h2>
              <p className="text-sm text-zinc-400 max-w-xl">
                Trace every recommendation back to its historical evidence. See the exact memories and past incidents that informed SentinelMind's decisions.
              </p>
            </div>
          </div>
          <a
            href="/provenance"
            className="shrink-0 bg-zinc-800 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-zinc-700 border border-zinc-700 transition-all flex items-center gap-2"
          >
            Explore Reasoning Chain
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* ADAPTIVE RUNBOOK PROMO */}
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-500/20 rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 rounded-xl bg-zinc-950/50 border border-amber-500/20 text-amber-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Adaptive Runbook Intelligence</h2>
              <p className="text-sm text-zinc-400 max-w-xl">
                Self-evolving security runbooks that automatically improve by learning from historical incidents, identifying the most effective remediation steps over time.
              </p>
            </div>
          </div>
          <a
            href="/runbooks"
            className="shrink-0 relative z-10 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:from-amber-400 hover:to-orange-500 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all flex items-center gap-2 group"
          >
            Open Runbooks
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* MAIN GRID: 4 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* LEFT PANEL (Col 1-3): Metrics & Charts */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* SECTION 1: SECURITY OVERVIEW */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard title="Total Incidents" value={data.overview.totalIncidents} icon={Database} color="text-blue-400" bg="bg-blue-500/10" />
              <StatCard title="Critical" value={data.overview.criticalIncidents} icon={AlertTriangle} color="text-red-400" bg="bg-red-500/10" />
              <StatCard title="Open" value={data.overview.openIncidents} icon={Activity} color="text-amber-400" bg="bg-amber-500/10" />
              <StatCard title="Resolved" value={data.overview.resolvedIncidents} icon={CheckCircle2} color="text-emerald-400" bg="bg-emerald-500/10" />
              <StatCard title="Avg Resolution" value={`${data.overview.avgResolutionTimeMinutes}m`} icon={Clock} color="text-indigo-400" bg="bg-indigo-500/10" />
            </div>

            {/* SECTIONS 3 & 6: AI & MEMORY METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Memory Intelligence */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4 text-cyan-400">
                  <Database className="w-5 h-5" />
                  <h2 className="font-semibold">Memory Intelligence</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-zinc-500 text-sm">Total Memories</p>
                    <p className="text-2xl font-bold">{data.memory.totalMemories}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-sm">Categories Learned</p>
                    <p className="text-2xl font-bold">{data.memory.threatCategoriesLearned}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-zinc-500 text-sm">Knowledge Growth</p>
                    <p className="text-lg text-cyan-300">+{data.memory.recentMemoriesThisWeek} this week</p>
                  </div>
                </div>
              </div>

              {/* AI Intelligence */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4 text-violet-400">
                  <Brain className="w-5 h-5" />
                  <h2 className="font-semibold">AI Intelligence</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-zinc-500 text-sm">Analyses Generated</p>
                    <p className="text-2xl font-bold">{data.ai.totalAnalyses}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-sm">Copilot Sessions</p>
                    <p className="text-2xl font-bold">{data.ai.copilotSessions}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-zinc-500 text-sm">Latest Query</p>
                    <p className="text-sm text-violet-300 truncate">
                      "{data.ai.recentQuestions[0] || "No recent queries"}"
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTIONS 8 & 9: CHARTS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Threat Distribution (Donut) */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-zinc-400" />
                  Threat Distribution
                </h2>
                <div className="h-64">
                  {data.threats.threatDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.threats.threatDistribution}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {data.threats.threatDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                          itemStyle={{ color: '#e4e4e7' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-zinc-600">No threat data yet</div>
                  )}
                </div>
                {/* Legend */}
                <div className="flex flex-wrap gap-3 mt-2">
                  {data.threats.threatDistribution.slice(0, 3).map((t, i) => (
                    <div key={t.name} className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      {t.name}
                    </div>
                  ))}
                </div>
              </div>

              {/* Incident Trend (Line) */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-zinc-400" />
                  Incident Trend
                </h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="incidents" 
                        stroke="#8b5cf6" 
                        strokeWidth={3}
                        dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 0 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* SECTION 5: RECENT EXECUTIVE REPORTS (Real Data) */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-amber-400">
                  <BookOpen className="w-5 h-5" />
                  <h2 className="font-semibold text-white">Recent Executive Reports</h2>
                </div>
                <a href="/reports" className="text-xs font-medium text-amber-400 hover:text-amber-300">
                  View All
                </a>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.recentReports?.length === 0 ? (
                  <p className="text-sm text-zinc-500 col-span-3 text-center py-4">No reports generated yet.</p>
                ) : (
                  data.recentReports?.map((report) => (
                    <a key={report.id} href={`/reports`} className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-amber-500/50 transition-colors group block">
                      <p className="font-medium text-zinc-200 truncate group-hover:text-amber-400 transition-colors">{report.title}</p>
                      <div className="flex justify-between items-end mt-2">
                        <p className="text-xs text-zinc-500">{new Date(report.created_at).toLocaleDateString()}</p>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                          report.riskLevel === "Critical" ? "bg-red-500/20 text-red-400" :
                          report.riskLevel === "High" ? "bg-orange-500/20 text-orange-400" :
                          report.riskLevel === "Medium" ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-emerald-500/20 text-emerald-400"
                        )}>
                          {report.riskLevel} Risk
                        </span>
                      </div>
                    </a>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* RIGHT PANEL (Col 4): Recent Activity Feed */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 h-full min-h-[600px] flex flex-col">
              <h2 className="font-semibold mb-6 flex items-center gap-2 sticky top-0 bg-zinc-900 z-10 pb-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Recent Security Activity
              </h2>
              
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
                {data.recentActivity.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-8">No recent activity</p>
                ) : (
                  <div className="relative before:absolute before:inset-y-0 before:left-[11px] before:w-px before:bg-zinc-800">
                    {data.recentActivity.map((activity, i) => (
                      <div key={i} className="relative flex gap-4 mb-6 last:mb-0 group">
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 border-zinc-900 z-10",
                          activity.type === 'incident' ? "bg-red-500/20 text-red-400" :
                          activity.type === 'learning' ? "bg-violet-500/20 text-violet-400" :
                          "bg-emerald-500/20 text-emerald-400"
                        )}>
                          {activity.type === 'incident' ? <AlertTriangle className="w-3 h-3" /> :
                           activity.type === 'learning' ? <Brain className="w-3 h-3" /> :
                           <CheckCircle2 className="w-3 h-3" />}
                        </div>
                        <div className="flex-1 pt-0.5">
                          <p className="text-sm font-medium text-zinc-200 leading-snug group-hover:text-white transition-colors">
                            {activity.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-zinc-500">
                              {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {activity.meta && (
                              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
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
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// --- Helper Components ---
function StatCard({ title, value, icon: Icon, color, bg }: { title: string, value: string | number, icon: any, color: string, bg: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between hover:bg-zinc-800/50 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <p className="text-zinc-400 text-sm">{title}</p>
        <div className={cn("p-2 rounded-lg", bg, color)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
