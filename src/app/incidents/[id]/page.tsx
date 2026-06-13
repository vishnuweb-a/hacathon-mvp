"use client";

import React, { useState, useEffect, use, useRef } from "react";
import {
  FileText,
  CheckCircle2,
  Clock,
  Activity,
  DatabaseZap,
  Sparkles,
  Loader2,
  ArrowLeft,
  Info,
} from "lucide-react";
import type { Incident } from "@/types/incident";
import type { Postmortem } from "@/types/postmortem";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function IncidentDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [incident, setIncident] = useState<Incident | null>(null);
  const [postmortem, setPostmortem] = useState<Postmortem | null>(null);

  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [submittingPm, setSubmittingPm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [pmSuccess, setPmSuccess] = useState<{
    memoryStored: boolean;
    threatType?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  // Form refs for auto-fill
  const rootCauseRef = useRef<HTMLTextAreaElement>(null);
  const resolutionRef = useRef<HTMLTextAreaElement>(null);
  const lessonsRef = useRef<HTMLTextAreaElement>(null);
  const timeRef = useRef<HTMLInputElement>(null);

  const fetchIncidentData = async () => {
    try {
      // 1. Fetch incident
      const res = await fetch("/api/incidents");
      const data = await res.json();
      const found = data.incidents?.find((i: Incident) => i.id === id);
      if (found) {
        setIncident(found);
      } else {
        setError("Incident not found.");
      }

      // 2. Fetch postmortem (if exists)
      const pmRes = await fetch(`/api/incidents/${id}/postmortem`);
      if (pmRes.ok) {
        const pmData = await pmRes.json();
        if (pmData.success && pmData.postmortem) {
          setPostmortem(pmData.postmortem);
        }
      }
    } catch {
      setError("Failed to load incident details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidentData();
  }, [id]);

  const handleStatusUpdate = (
    newStatus: "open" | "investigating" | "resolved"
  ) => {
    setUpdatingStatus(true);
    setTimeout(() => {
      setIncident((prev) => (prev ? { ...prev, status: newStatus } : null));
      setUpdatingStatus(false);
    }, 500);
  };

  // ---- AI Auto-Generate Postmortem ----
  const handleAutoGenerate = async () => {
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch(`/api/incidents/${id}/auto-postmortem`, {
        method: "POST",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Generation failed");

      const pm = data.postmortem;

      // Auto-fill the form fields
      if (rootCauseRef.current) rootCauseRef.current.value = pm.root_cause;
      if (resolutionRef.current) resolutionRef.current.value = pm.resolution;
      if (lessonsRef.current) lessonsRef.current.value = pm.lessons_learned;
      if (timeRef.current)
        timeRef.current.value = String(pm.resolution_time_minutes);

      // Flash animation on the form
      const form = document.getElementById("postmortem-form");
      if (form) {
        form.classList.add("ring-2", "ring-violet-500/50");
        setTimeout(
          () => form.classList.remove("ring-2", "ring-violet-500/50"),
          2000
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to auto-generate"
      );
    } finally {
      setGenerating(false);
    }
  };

  const handlePostmortemSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setSubmittingPm(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const payload = {
      root_cause: formData.get("root_cause") as string,
      resolution: formData.get("resolution") as string,
      lessons_learned: formData.get("lessons_learned") as string,
      resolution_time_minutes: parseInt(
        formData.get("resolution_time_minutes") as string,
        10
      ),
    };

    try {
      const res = await fetch(`/api/incidents/${id}/postmortem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success)
        throw new Error(data.error || "Failed to submit postmortem");

      setPostmortem(data.postmortem);
      if (data.learning) {
        setPmSuccess({
          memoryStored: data.learning.memoryStored,
          threatType: data.learning.threatType,
        });
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred submitting the postmortem"
      );
    } finally {
      setSubmittingPm(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="p-8 text-center text-red-500">
        {error || "Incident not found"}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-6 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back Link */}
        <Link
          href="/incidents"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Incidents
        </Link>

        {/* ─── Two Column Layout ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* LEFT COLUMN: INCIDENT DETAILS (col-span-2) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                    {incident.title}
                  </h1>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 font-mono">
                    ID: {incident.id}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    {incident.severity}
                  </span>
                  <span
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium capitalize",
                      incident.status === "resolved"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400"
                        : incident.status === "investigating"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400"
                          : "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400"
                    )}
                  >
                    {incident.status}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                  Description
                </h3>
                <p className="text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-lg border border-zinc-100 dark:border-zinc-800 leading-relaxed">
                  {incident.description}
                </p>
              </div>

              {/* Status Actions */}
              <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                  Update Status
                </h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleStatusUpdate("investigating")}
                    disabled={
                      incident.status === "investigating" || updatingStatus
                    }
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                  >
                    <Activity className="w-4 h-4 text-blue-500" />
                    Investigating
                  </button>
                  <button
                    onClick={() => handleStatusUpdate("resolved")}
                    disabled={incident.status === "resolved" || updatingStatus}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 disabled:opacity-50 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Mark as Resolved
                  </button>
                </div>
              </div>

              {/* Generate Report Button */}
              <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  onClick={async () => {
                    setGeneratingReport(true);
                    try {
                      const res = await fetch("/api/reports/generate", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ incidentId: id }),
                      });
                      const data = await res.json();
                      if (data.success) {
                        window.location.href = "/reports";
                      } else {
                        setError(data.error || "Failed to generate report");
                      }
                    } catch {
                      setError("Failed to generate report");
                    } finally {
                      setGeneratingReport(false);
                    }
                  }}
                  disabled={generatingReport}
                  className="w-full inline-flex justify-center items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 shadow-sm disabled:opacity-60 transition-all"
                >
                  {generatingReport ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  {generatingReport ? "Generating Report..." : "Generate Executive Report"}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: SOLUTION / POSTMORTEM SIDE PANEL (col-span-1) */}
          <div className="lg:col-span-1 sticky top-6">
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col h-full max-h-[calc(100vh-3rem)]">
              
              {/* Panel Header */}
              <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-500" />
                  <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
                    Solution & Postmortem
                  </h2>
                </div>
                {/* Auto-Generate Button */}
                {incident.status === "resolved" && !postmortem && (
                  <button
                    onClick={handleAutoGenerate}
                    disabled={generating}
                    className="w-full inline-flex justify-center items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700 shadow-sm disabled:opacity-60 transition-all"
                  >
                    {generating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {generating
                      ? "Generating with AI..."
                      : "Auto-Generate via AI"}
                  </button>
                )}
              </div>

              {/* Panel Content Scroll Area */}
              <div className="overflow-y-auto flex-1 custom-scrollbar">
                
                {/* State 1: Not Resolved */}
                {incident.status !== "resolved" && !postmortem && (
                  <div className="p-8 text-center text-zinc-500 dark:text-zinc-400 flex flex-col items-center">
                    <Info className="w-10 h-10 mb-3 text-zinc-300 dark:text-zinc-600" />
                    <p className="text-sm">
                      Incident is currently active. Mark it as resolved to add a solution.
                    </p>
                  </div>
                )}

                {/* State 2: Error in Generation or Fetching */}
                {error && (
                  <div className="m-5 p-3 text-sm text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg">
                    {error}
                  </div>
                )}

                {/* State 3: Learning Success Message */}
                {pmSuccess && (
                  <div className="m-5 p-4 rounded-lg bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 flex items-start gap-3">
                    <DatabaseZap className="w-5 h-5 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-violet-900 dark:text-violet-300">
                        AI Knowledge Extracted
                      </h4>
                      <p className="text-xs text-violet-700 dark:text-violet-400 mt-1">
                        Categorized as <strong>{pmSuccess.threatType}</strong>. Saved to memory.
                      </p>
                    </div>
                  </div>
                )}

                {/* State 4: Form (Resolved but no postmortem yet) */}
                {incident.status === "resolved" && !postmortem && (
                  <form
                    id="postmortem-form"
                    onSubmit={handlePostmortemSubmit}
                    className="p-5 space-y-4 transition-all duration-500"
                  >
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                        Root Cause
                      </label>
                      <textarea
                        ref={rootCauseRef}
                        name="root_cause"
                        required
                        rows={3}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-zinc-900 dark:text-white transition-all resize-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                        Resolution
                      </label>
                      <textarea
                        ref={resolutionRef}
                        name="resolution"
                        required
                        rows={3}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-zinc-900 dark:text-white transition-all resize-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                        Lessons Learned
                      </label>
                      <textarea
                        ref={lessonsRef}
                        name="lessons_learned"
                        required
                        rows={3}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-zinc-900 dark:text-white transition-all resize-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                        Time (mins)
                      </label>
                      <input
                        ref={timeRef}
                        type="number"
                        name="resolution_time_minutes"
                        required
                        min={0}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-zinc-900 dark:text-white transition-all"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={submittingPm}
                        className="w-full px-4 py-2.5 text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-black rounded-lg transition-colors disabled:opacity-50 flex justify-center items-center gap-2 shadow-sm"
                      >
                        {submittingPm && (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        )}
                        {submittingPm ? "Saving..." : "Save & Learn"}
                      </button>
                    </div>
                  </form>
                )}

                {/* State 5: Permanent Read-Only Solution */}
                {postmortem && (
                  <div className="p-5 space-y-6">
                    <div>
                      <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                        Root Cause
                      </h3>
                      <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                        {postmortem.root_cause}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                        Resolution
                      </h3>
                      <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                        {postmortem.resolution}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                        Lessons Learned
                      </h3>
                      <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                        {postmortem.lessons_learned}
                      </p>
                    </div>
                    <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      <Clock className="w-4 h-4" />
                      Resolution Time: {postmortem.resolution_time_minutes}{" "}
                      minutes
                    </div>
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
