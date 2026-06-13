"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Database, ShieldAlert, Shield, ShieldCheck, AlertTriangle } from "lucide-react";
import type { Incident } from "@/types/incident";
import { cn } from "@/lib/utils";
import { CreateIncidentDialog } from "@/components/incidents/CreateIncidentDialog";

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIncidents = () => {
    setLoading(true);
    fetch("/api/incidents")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setIncidents(data.incidents);
        }
      })
      .catch((err) => console.error("Failed to load incidents:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const getSeverityBadge = (severity: string) => {
    const s = severity.toLowerCase();
    const config = {
      critical: { color: "text-red-600 bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/20", icon: AlertTriangle },
      high: { color: "text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/20", icon: ShieldAlert },
      medium: { color: "text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-500/10 dark:border-yellow-500/20", icon: Shield },
      low: { color: "text-green-600 bg-green-50 border-green-200 dark:bg-green-500/10 dark:border-green-500/20", icon: ShieldCheck },
    }[s] || { color: "text-zinc-600 bg-zinc-50 border-zinc-200", icon: Shield };

    const Icon = config.icon;

    return (
      <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border", config.color)}>
        <Icon className="w-3 h-3" />
        {severity}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    const config = {
      open: "text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400",
      investigating: "text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400",
      resolved: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400",
    }[s] || "text-zinc-600 bg-zinc-50";

    return (
      <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium capitalize", config)}>
        {status}
      </span>
    );
  };

  if (loading && incidents.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-6 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                Incidents
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Manage and analyze security incidents
              </p>
            </div>
          </div>
          <CreateIncidentDialog onSuccess={fetchIncidents} />
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
          {incidents.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
              No incidents found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-6 py-4 font-medium text-zinc-500 dark:text-zinc-400">Title</th>
                    <th className="px-6 py-4 font-medium text-zinc-500 dark:text-zinc-400">Severity</th>
                    <th className="px-6 py-4 font-medium text-zinc-500 dark:text-zinc-400">Status</th>
                    <th className="px-6 py-4 font-medium text-zinc-500 dark:text-zinc-400">Source</th>
                    <th className="px-6 py-4 font-medium text-zinc-500 dark:text-zinc-400">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {incidents.map((incident) => (
                    <tr key={incident.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <Link href={`/incidents/${incident.id}`} className="font-medium text-zinc-900 dark:text-zinc-100 hover:text-primary transition-colors">
                          {incident.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        {getSeverityBadge(incident.severity)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(incident.status)}
                      </td>
                      <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                        {incident.source || "—"}
                      </td>
                      <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                        {new Date(incident.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
