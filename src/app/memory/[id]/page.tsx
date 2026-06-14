"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight, TrendingUp } from "lucide-react";

interface MemoryDetail {
  id: string;
  original_incident_id: string;
  threat_category: string;
  hindsight_reasoning: string;
  ai_confidence_score: number;
  recommendations: string[];
  created_at: string;
  // Extended fields for the detail view PRD
  source_incidents?: { id: string; title: string; date: string }[];
  source_postmortems?: { id: string; title: string; date: string }[];
  influenced_runbooks?: { id: string; title: string; uses: number }[];
  influenced_reports?: { id: string; title: string; date: string }[];
  evolution_timeline?: { date: string; change: string; reason: string }[];
}

export default function MemoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [memory, setMemory] = useState<MemoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "sources" | "influence" | "evolution">("overview");

  useEffect(() => {
    if (params.id) {
      fetchMemory(params.id as string);
    }
  }, [params.id]);

  const fetchMemory = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/memories/${id}`);
      const data = await res.json();
      if (data.success) {
        // Mocking extended data as per PRD for UI showcase
        setMemory({
          ...data.memory,
          source_incidents: [
            { id: "inc-101", title: "Unauthorized API Access", date: "2023-11-12" },
            { id: "inc-145", title: "Credential Stuffing Attack", date: "2024-01-05" },
          ],
          source_postmortems: [
            { id: "pm-042", title: "API Gateway Breach Analysis", date: "2023-11-15" }
          ],
          influenced_runbooks: [
            { id: "rb-auth", title: "Identity Breach Response", uses: 34 }
          ],
          influenced_reports: [
            { id: "rep-q1", title: "Q1 Threat Landscape", date: "2024-03-31" }
          ],
          evolution_timeline: [
            { date: "2023-11-15", change: "Memory Created", reason: "Initial extraction from incident pm-042" },
            { date: "2024-01-06", change: "Confidence Increased (+12%)", reason: "Validated by incident inc-145 resolution" },
            { date: "2024-02-10", change: "Recommendation Refined", reason: "Added context for SSO integration based on learning event" }
          ]
        });
      } else {
        setError(data.error || "Failed to load memory");
      }
    } catch (err) {
      setError("An error occurred while fetching the memory.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" style={{ backgroundColor: "#0B1220" }}>
        <p style={{ color: "#64748B" }}>Retrieving Memory Detail...</p>
      </div>
    );
  }

  if (error || !memory) {
    return (
      <div className="min-h-screen p-8" style={{ backgroundColor: "#0B1220" }}>
        <div className="max-w-[1000px] mx-auto text-center p-12 rounded-xl border" style={{ backgroundColor: "rgba(220, 38, 38, 0.05)", borderColor: "rgba(220, 38, 38, 0.2)" }}>
          <p style={{ color: "#DC2626", marginBottom: "1rem" }}>{error || "Memory not found"}</p>
          <button onClick={() => router.back()} className="px-4 py-2 rounded-lg font-semibold text-[13px]" style={{ backgroundColor: "#182235", color: "#F3F6FB", border: "1px solid #243146" }}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0B1220" }}>
      
      {/* ── HEADER ── */}
      <div className="border-b px-8 py-10" style={{ backgroundColor: "#121A2B", borderColor: "#243146" }}>
        <div className="max-w-[1200px] mx-auto">
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-1.5 text-[13px] font-medium mb-6 hover:underline"
            style={{ color: "#64748B" }}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Explorer
          </button>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded text-[11px] font-bold uppercase tracking-widest" style={{ backgroundColor: "rgba(139, 92, 246, 0.1)", color: "#8B5CF6" }}>
                  {memory.threat_category || "Uncategorized"}
                </span>
                <span className="text-[12px]" style={{ color: "#64748B" }}>
                  ID: {memory.id}
                </span>
              </div>
              <h1 className="text-[28px] font-bold leading-tight max-w-3xl" style={{ color: "#F3F6FB" }}>
                {memory.hindsight_reasoning}
              </h1>
            </div>
            
            <div className="shrink-0">
              <div className="p-5 rounded-xl border text-center min-w-[140px]" style={{ backgroundColor: "#182235", borderColor: "#243146" }}>
                <p className="text-[32px] font-bold" style={{ color: "#06B6D4" }}>{memory.ai_confidence_score}</p>
                <p className="text-[11px] font-bold uppercase tracking-widest mt-1" style={{ color: "#64748B" }}>Strength</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="max-w-[1200px] mx-auto px-8 py-10">
        
        {/* Navigation Tabs (Text Only) */}
        <div className="flex items-center gap-8 border-b mb-10" style={{ borderColor: "#243146" }}>
          {[
            { id: "overview", label: "Overview" },
            { id: "sources", label: "Source Evidence" },
            { id: "influence", label: "Platform Influence" },
            { id: "evolution", label: "Evolution Timeline" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className="pb-4 text-[13px] font-semibold tracking-wide transition-colors relative"
              style={{ color: activeTab === tab.id ? "#F3F6FB" : "#64748B" }}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 rounded-t" style={{ backgroundColor: "#06B6D4" }} />
              )}
            </button>
          ))}
        </div>

        {/* ── TAB CONTENT ── */}
        
        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="rounded-xl border p-8" style={{ backgroundColor: "#121A2B", borderColor: "#243146" }}>
                <h2 className="text-[12px] font-bold uppercase tracking-widest mb-6" style={{ color: "#64748B" }}>Core Insight</h2>
                <p className="text-[15px] leading-relaxed" style={{ color: "#F3F6FB" }}>
                  {memory.hindsight_reasoning}
                </p>
              </div>

              <div className="rounded-xl border p-8" style={{ backgroundColor: "#121A2B", borderColor: "#243146" }}>
                <h2 className="text-[12px] font-bold uppercase tracking-widest mb-6" style={{ color: "#64748B" }}>Derived Recommendations</h2>
                <ul className="space-y-4">
                  {memory.recommendations.map((rec, i) => (
                    <li key={i} className="flex gap-4">
                      <span className="text-[14px] font-bold mt-0.5" style={{ color: "#06B6D4" }}>{(i + 1).toString().padStart(2, "0")}</span>
                      <span className="text-[14px] leading-relaxed" style={{ color: "#94A3B8" }}>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="rounded-xl border p-6" style={{ backgroundColor: "#121A2B", borderColor: "#243146" }}>
                <h3 className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: "#64748B" }}>Metadata</h3>
                <div className="space-y-4 text-[13px]">
                  <div className="flex justify-between">
                    <span style={{ color: "#64748B" }}>Created</span>
                    <span style={{ color: "#F3F6FB" }}>{new Date(memory.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "#64748B" }}>Category</span>
                    <span style={{ color: "#F3F6FB" }}>{memory.threat_category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "#64748B" }}>Original Incident</span>
                    <Link href={`/incidents/${memory.original_incident_id}`} className="hover:underline" style={{ color: "#06B6D4" }}>
                      {memory.original_incident_id}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SOURCES */}
        {activeTab === "sources" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="rounded-xl border p-8" style={{ backgroundColor: "#121A2B", borderColor: "#243146" }}>
              <h2 className="text-[12px] font-bold uppercase tracking-widest mb-6" style={{ color: "#64748B" }}>Incidents Analyzed</h2>
              <div className="space-y-3">
                {memory.source_incidents?.map(inc => (
                  <div key={inc.id} className="flex items-center justify-between p-4 rounded-lg border" style={{ backgroundColor: "#182235", borderColor: "#243146" }}>
                    <div>
                      <p className="text-[14px] font-medium" style={{ color: "#F3F6FB" }}>{inc.title}</p>
                      <p className="text-[12px] mt-1" style={{ color: "#64748B" }}>{inc.id} • {new Date(inc.date).toLocaleDateString()}</p>
                    </div>
                    <Link href={`/incidents/${inc.id}`} className="text-[12px] font-medium hover:underline" style={{ color: "#06B6D4" }}>
                      View
                    </Link>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border p-8" style={{ backgroundColor: "#121A2B", borderColor: "#243146" }}>
              <h2 className="text-[12px] font-bold uppercase tracking-widest mb-6" style={{ color: "#64748B" }}>Postmortems & Learnings</h2>
              <div className="space-y-3">
                {memory.source_postmortems?.map(pm => (
                  <div key={pm.id} className="flex items-center justify-between p-4 rounded-lg border" style={{ backgroundColor: "#182235", borderColor: "#243146" }}>
                    <div>
                      <p className="text-[14px] font-medium" style={{ color: "#F3F6FB" }}>{pm.title}</p>
                      <p className="text-[12px] mt-1" style={{ color: "#64748B" }}>{pm.id} • {new Date(pm.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* INFLUENCE */}
        {activeTab === "influence" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="rounded-xl border p-8" style={{ backgroundColor: "#121A2B", borderColor: "#243146" }}>
              <h2 className="text-[12px] font-bold uppercase tracking-widest mb-6" style={{ color: "#64748B" }}>Runbook Integration</h2>
              <div className="space-y-3">
                {memory.influenced_runbooks?.map(rb => (
                  <div key={rb.id} className="flex items-center justify-between p-4 rounded-lg border" style={{ backgroundColor: "#182235", borderColor: "#243146" }}>
                    <div>
                      <p className="text-[14px] font-medium" style={{ color: "#F3F6FB" }}>{rb.title}</p>
                      <p className="text-[12px] mt-1" style={{ color: "#64748B" }}>{rb.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[14px] font-bold" style={{ color: "#F3F6FB" }}>{rb.uses}</p>
                      <p className="text-[11px] uppercase tracking-widest" style={{ color: "#64748B" }}>Uses</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border p-8" style={{ backgroundColor: "#121A2B", borderColor: "#243146" }}>
              <h2 className="text-[12px] font-bold uppercase tracking-widest mb-6" style={{ color: "#64748B" }}>Threat Intelligence</h2>
              <div className="space-y-3">
                {memory.influenced_reports?.map(rep => (
                  <div key={rep.id} className="flex items-center justify-between p-4 rounded-lg border" style={{ backgroundColor: "#182235", borderColor: "#243146" }}>
                    <div>
                      <p className="text-[14px] font-medium" style={{ color: "#F3F6FB" }}>{rep.title}</p>
                      <p className="text-[12px] mt-1" style={{ color: "#64748B" }}>Generated {new Date(rep.date).toLocaleDateString()}</p>
                    </div>
                    <Link href="/intelligence" className="text-[12px] font-medium hover:underline" style={{ color: "#06B6D4" }}>
                      View Report
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* EVOLUTION TIMELINE */}
        {activeTab === "evolution" && (
          <div className="rounded-xl border p-8" style={{ backgroundColor: "#121A2B", borderColor: "#243146" }}>
            <div className="max-w-2xl">
              {memory.evolution_timeline?.map((event, i) => (
                <div key={i} className="flex gap-6 pb-8 relative">
                  {/* Line */}
                  {i !== memory.evolution_timeline!.length - 1 && (
                    <div className="absolute top-8 left-2.5 w-px h-full" style={{ backgroundColor: "#243146" }} />
                  )}
                  {/* Node */}
                  <div className="relative mt-1">
                    <div className="w-5 h-5 rounded-full border-4 flex shrink-0" style={{ backgroundColor: "#121A2B", borderColor: "#06B6D4" }} />
                  </div>
                  {/* Content */}
                  <div>
                    <span className="text-[12px] font-bold" style={{ color: "#64748B" }}>{new Date(event.date).toLocaleDateString()}</span>
                    <h3 className="text-[15px] font-bold mt-1 mb-2" style={{ color: "#F3F6FB" }}>{event.change}</h3>
                    <p className="text-[14px]" style={{ color: "#94A3B8" }}>{event.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
