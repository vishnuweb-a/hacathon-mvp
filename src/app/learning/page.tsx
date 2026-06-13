"use client";

import React, { useState, useEffect } from "react";
import {
  Brain,
  ShieldCheck,
  Clock,
  Layers,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import type { LearningStats, LearningEvent } from "@/types/learning";

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
          <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-white">{value}</p>
          {sub && <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{sub}</p>}
        </div>
        <div className={`rounded-lg p-2.5 ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      {/* Decorative gradient bar */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 ${color}`} />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    completed: { color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10", icon: CheckCircle2 },
    pending: { color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10", icon: Loader2 },
    failed: { color: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10", icon: XCircle },
  }[status] || { color: "text-zinc-500 bg-zinc-100", icon: Loader2 };

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
}

export default function LearningPage() {
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/learning/stats");
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-6 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                Continuous Learning
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Knowledge extracted automatically from resolved incidents
              </p>
            </div>
          </div>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Brain}
              label="Memories Generated"
              value={stats.totalMemories}
              sub="Knowledge learned from incidents"
              color="bg-gradient-to-br from-violet-500 to-fuchsia-600"
            />
            <StatCard
              icon={Layers}
              label="Threat Categories"
              value={stats.threatCategories.length}
              sub="Distinct categories identified"
              color="bg-gradient-to-br from-cyan-500 to-blue-600"
            />
            <StatCard
              icon={Clock}
              label="Avg Resolution Time"
              value={`${stats.avgResolutionTimeMinutes} min`}
              sub="Across all postmortems"
              color="bg-gradient-to-br from-amber-500 to-orange-600"
            />
            <StatCard
              icon={ShieldCheck}
              label="Learning Events"
              value={stats.recentEvents.length}
              sub="Recent pipeline runs"
              color="bg-gradient-to-br from-emerald-500 to-green-600"
            />
          </div>
        )}

        {/* Threat Category Breakdown */}
        {stats && stats.threatCategories.length > 0 && (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
              Threat Categories Learned
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {stats.threatCategories.map((tc) => (
                <div
                  key={tc.category}
                  className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800"
                >
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate">
                    {tc.category}
                  </span>
                  <span className="ml-2 text-sm font-bold text-zinc-900 dark:text-white bg-zinc-200 dark:bg-zinc-700 px-2 py-0.5 rounded-full">
                    {tc.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Learning Events */}
        {stats && stats.recentEvents.length > 0 && (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                Recent Learning Events
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                    <th className="text-left px-6 py-3 font-medium text-zinc-500 dark:text-zinc-400">Threat Type</th>
                    <th className="text-left px-6 py-3 font-medium text-zinc-500 dark:text-zinc-400">Summary</th>
                    <th className="text-left px-6 py-3 font-medium text-zinc-500 dark:text-zinc-400">Status</th>
                    <th className="text-left px-6 py-3 font-medium text-zinc-500 dark:text-zinc-400">Memory ID</th>
                    <th className="text-left px-6 py-3 font-medium text-zinc-500 dark:text-zinc-400">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentEvents.map((event) => (
                    <tr
                      key={event.id}
                      className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-zinc-900 dark:text-white whitespace-nowrap">
                        {event.threat_type || "—"}
                      </td>
                      <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 max-w-xs truncate">
                        {event.knowledge_summary || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={event.status} />
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-zinc-500 dark:text-zinc-500">
                        {event.memory_id ? event.memory_id.substring(0, 12) + "…" : "—"}
                      </td>
                      <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                        {new Date(event.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {stats && stats.totalMemories === 0 && !loading && (
          <div className="text-center py-16 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700">
            <Brain className="w-12 h-12 mx-auto text-zinc-400 dark:text-zinc-600 mb-4" />
            <h3 className="text-lg font-medium text-zinc-700 dark:text-zinc-300">No learning events yet</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Submit a postmortem for a resolved incident to trigger the learning pipeline.
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && !stats && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
          </div>
        )}
      </div>
    </div>
  );
}
