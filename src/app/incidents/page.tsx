"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ShieldAlert, Shield, ShieldCheck } from "lucide-react";
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
      critical: { color: "text-red-500 bg-red-500/10 border-red-500/20", icon: AlertTriangle },
      high: { color: "text-orange-400 bg-orange-500/10 border-orange-500/20", icon: ShieldAlert },
      medium: { color: "text-amber-400 bg-amber-500/10 border-amber-500/20", icon: Shield },
      low: { color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: ShieldCheck },
    }[s] || { color: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20", icon: Shield };

    const Icon = config.icon;
    return (
      <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border", config.color)}>
        <Icon className="w-3 h-3" />
        {severity}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    const config = {
      open: { bg: "#DC2626", text: "#DC2626" },
      investigating: { bg: "#3b82f6", text: "#3b82f6" },
      resolved: { bg: "#16A34A", text: "#16A34A" },
    }[s] || { bg: "#64748B", text: "#64748B" };

    return (
      <span
        className="px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
        style={{ backgroundColor: `${config.bg}15`, color: config.text }}
      >
        {status}
      </span>
    );
  };

  if (loading && incidents.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p style={{ color: "#64748B" }}>Loading incidents...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 sm:p-10" style={{ backgroundColor: "#0B1220" }}>
      <div className="max-w-[1200px] mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-bold tracking-tight" style={{ color: "#F3F6FB" }}>
              Incidents
            </h1>
            <p className="text-[14px] mt-1" style={{ color: "#64748B" }}>
              Manage and analyze security incidents
            </p>
          </div>
          <CreateIncidentDialog onSuccess={fetchIncidents} />
        </div>

        <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "#121A2B", borderColor: "#243146" }}>
          {incidents.length === 0 ? (
            <div className="p-12 text-center" style={{ color: "#64748B" }}>
              No incidents have been reported yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead style={{ backgroundColor: "#182235" }}>
                  <tr>
                    <th className="px-6 py-4 font-medium text-[12px] uppercase tracking-wider" style={{ color: "#64748B", borderBottom: "1px solid #243146" }}>Title</th>
                    <th className="px-6 py-4 font-medium text-[12px] uppercase tracking-wider" style={{ color: "#64748B", borderBottom: "1px solid #243146" }}>Severity</th>
                    <th className="px-6 py-4 font-medium text-[12px] uppercase tracking-wider" style={{ color: "#64748B", borderBottom: "1px solid #243146" }}>Status</th>
                    <th className="px-6 py-4 font-medium text-[12px] uppercase tracking-wider" style={{ color: "#64748B", borderBottom: "1px solid #243146" }}>Source</th>
                    <th className="px-6 py-4 font-medium text-[12px] uppercase tracking-wider" style={{ color: "#64748B", borderBottom: "1px solid #243146" }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((incident) => (
                    <tr
                      key={incident.id}
                      className="transition-colors"
                      style={{ borderBottom: "1px solid #243146" }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#182235"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                    >
                      <td className="px-6 py-5">
                        <Link href={`/incidents/${incident.id}`} className="font-medium text-[14px] hover:underline" style={{ color: "#F3F6FB" }}>
                          {incident.title}
                        </Link>
                      </td>
                      <td className="px-6 py-5">{getSeverityBadge(incident.severity)}</td>
                      <td className="px-6 py-5">{getStatusBadge(incident.status)}</td>
                      <td className="px-6 py-5 text-[13px]" style={{ color: "#64748B" }}>
                        {incident.source || "—"}
                      </td>
                      <td className="px-6 py-5 text-[13px] whitespace-nowrap" style={{ color: "#64748B" }}>
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
