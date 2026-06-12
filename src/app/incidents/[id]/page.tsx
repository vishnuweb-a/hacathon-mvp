"use client";

import { useState, useEffect, useCallback } from "react";

interface Incident {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  source?: string | null;
  created_at: string;
}

interface Analysis {
  id: string;
  incident_id: string;
  root_cause: string;
  confidence: number;
  recommended_actions: string[];
  estimated_resolution_time: string;
  recommended_runbook: string;
  analysis_summary: string;
  created_at: string;
}

export default function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [incidentId, setIncidentId] = useState<string | null>(null);
  const [incident, setIncident] = useState<Incident | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  // Unwrap the params promise
  useEffect(() => {
    params.then((p) => setIncidentId(p.id));
  }, [params]);

  // Fetch incident + existing analysis
  const fetchData = useCallback(async () => {
    if (!incidentId) return;
    setLoading(true);
    try {
      // Fetch incident
      const incRes = await fetch(`/api/incidents/${incidentId}`);
      const incData = await incRes.json();
      if (!incData.success) throw new Error(incData.error);
      setIncident(incData.incident);

      // Try to fetch existing analysis
      const anaRes = await fetch(`/api/analyze/${incidentId}`);
      const anaData = await anaRes.json();
      if (anaData.success) {
        setAnalysis(anaData.analysis);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [incidentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Trigger AI analysis
  const handleAnalyze = async () => {
    if (!incidentId) return;
    setAnalyzing(true);
    setError("");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incidentId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setAnalysis(data.analysis);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  // --- Helpers ---
  const severityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500/10 text-red-400 border-red-500/20";
      case "high": return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "medium": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "low": return "bg-green-500/10 text-green-400 border-green-500/20";
      default: return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  const confidenceColor = (confidence: number) => {
    if (confidence >= 80) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    if (confidence >= 60) return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
    return "bg-orange-500/10 text-orange-400 border-orange-500/30";
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "investigating": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "resolved": return "bg-green-500/10 text-green-400 border-green-500/20";
      default: return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  // --- Loading State ---
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-gray-400 text-lg">Loading incident...</p>
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Incident Not Found</h1>
          <p className="text-gray-400">{error || "The requested incident does not exist."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-gray-400 hover:text-white transition-colors text-sm">
              ← Back
            </a>
            <span className="text-gray-600">|</span>
            <h1 className="text-lg font-semibold text-white">Incident Details</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColor(incident.status)}`}>
              {incident.status.toUpperCase()}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${severityColor(incident.severity)}`}>
              {incident.severity.toUpperCase()}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Incident Card */}
        <section className="mb-8">
          <div className="bg-gradient-to-br from-[#12121a] to-[#0f0f18] border border-white/5 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-3">{incident.title}</h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-6">{incident.description}</p>
            <div className="flex flex-wrap gap-6 text-sm text-gray-500">
              <span>Source: <strong className="text-gray-300">{incident.source || "N/A"}</strong></span>
              <span>Created: <strong className="text-gray-300">{new Date(incident.created_at).toLocaleString()}</strong></span>
              <span>ID: <strong className="text-gray-300 font-mono text-xs">{incident.id}</strong></span>
            </div>
          </div>
        </section>

        {/* Analyze Button */}
        {!analysis && !analyzing && (
          <section className="mb-8">
            <button
              onClick={handleAnalyze}
              id="analyze-incident-btn"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-4 px-8 rounded-xl text-lg transition-all duration-300 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <span className="text-2xl">🔍</span>
              Analyze Incident with AI
            </button>
          </section>
        )}

        {/* Analyzing Animation */}
        {analyzing && (
          <section className="mb-8">
            <div className="bg-gradient-to-br from-[#12121a] to-[#0f0f18] border border-indigo-500/20 rounded-2xl p-12 text-center">
              <div className="inline-flex items-center gap-4">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin" />
                  <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-purple-500 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
                </div>
                <div className="text-left">
                  <p className="text-xl font-semibold text-white">Analyzing with Gemini AI...</p>
                  <p className="text-gray-400 text-sm mt-1">Recalling memories • Building context • Generating analysis</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Error */}
        {error && !loading && (
          <section className="mb-8">
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6 text-red-400">
              <strong>Error:</strong> {error}
            </div>
          </section>
        )}

        {/* Analysis Results */}
        {analysis && (
          <section className="space-y-6 animate-in fade-in duration-500">
            {/* AI Analysis Header */}
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>🤖</span> AI Analysis
              </h2>
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50"
              >
                ↻ Re-analyze
              </button>
            </div>

            {/* Root Cause + Confidence */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 bg-gradient-to-br from-[#12121a] to-[#0f0f18] border border-white/5 rounded-2xl p-6">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Predicted Root Cause</h3>
                <p className="text-2xl font-bold text-white">{analysis.root_cause}</p>
              </div>
              <div className="bg-gradient-to-br from-[#12121a] to-[#0f0f18] border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Confidence</h3>
                <div className={`text-4xl font-black ${analysis.confidence >= 80 ? "text-emerald-400" : analysis.confidence >= 60 ? "text-yellow-400" : "text-orange-400"}`}>
                  {analysis.confidence}%
                </div>
                <span className={`mt-2 px-3 py-1 rounded-full text-xs font-medium border ${confidenceColor(analysis.confidence)}`}>
                  {analysis.confidence >= 80 ? "High Confidence" : analysis.confidence >= 60 ? "Moderate" : "Low Confidence"}
                </span>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gradient-to-br from-[#12121a] to-[#0f0f18] border border-white/5 rounded-2xl p-6">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Historical Context Summary</h3>
              <p className="text-gray-300 leading-relaxed text-lg">{analysis.analysis_summary}</p>
            </div>

            {/* Recommended Actions */}
            <div className="bg-gradient-to-br from-[#12121a] to-[#0f0f18] border border-white/5 rounded-2xl p-6">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Recommended Actions</h3>
              <ol className="space-y-3">
                {(analysis.recommended_actions || []).map((action: string, i: number) => (
                  <li key={i} className="flex items-start gap-4">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-sm font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-gray-300 pt-0.5">{action}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Resolution Time + Runbook */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-[#12121a] to-[#0f0f18] border border-white/5 rounded-2xl p-6">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Estimated Resolution Time</h3>
                <p className="text-2xl font-bold text-white flex items-center gap-2">
                  <span>⏱️</span> {analysis.estimated_resolution_time}
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#12121a] to-[#0f0f18] border border-white/5 rounded-2xl p-6">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Recommended Runbook</h3>
                <p className="text-2xl font-bold text-white flex items-center gap-2">
                  <span>📋</span> {analysis.recommended_runbook}
                </p>
              </div>
            </div>

            {/* Timestamp */}
            <p className="text-xs text-gray-600 text-right">
              Analysis generated: {new Date(analysis.created_at).toLocaleString()}
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
