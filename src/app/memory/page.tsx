"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Brain, Filter, ChevronRight, RefreshCw, X } from "lucide-react";

interface Memory {
  id: string;
  original_incident_id: string;
  threat_category: string;
  hindsight_reasoning: string;
  ai_confidence_score: number;
  recommendations: string[];
  created_at: string;
}

export default function MemoryExplorer() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchMemories();
  }, []);

  const fetchMemories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/memories");
      const data = await res.json();
      if (data.success) {
        setMemories(data.memories);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const categories = Array.from(new Set(memories.map((m) => m.threat_category))).filter(Boolean);

  const filteredMemories = memories.filter((m) => {
    const matchesSearch =
      m.threat_category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.hindsight_reasoning?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? m.threat_category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen p-8 sm:p-10" style={{ backgroundColor: "#0B1220" }}>
      <div className="max-w-[1000px] mx-auto space-y-12">
        
        {/* HEADER */}
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-[32px] font-bold tracking-tight" style={{ color: "#F3F6FB" }}>
            Hindsight Memory Explorer
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed" style={{ color: "#64748B" }}>
            Browse and query the organizational knowledge graph. SentinelMind learns from every resolved incident and postmortem, distilling them into actionable memories.
          </p>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Search className="h-5 w-5" style={{ color: "#64748B" }} />
            </div>
            <input
              type="text"
              className="block w-full pl-14 pr-5 py-5 rounded-2xl transition-all outline-none text-[15px]"
              style={{ backgroundColor: "#121A2B", color: "#F3F6FB", border: "1px solid #243146" }}
              placeholder="Search organizational memories, threat types, or reasoning..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#64748B"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#243146"; }}
            />
          </div>

          {categories.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="w-4 h-4 mr-2" style={{ color: "#64748B" }} />
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
                  style={
                    cat === selectedCategory
                      ? { backgroundColor: "rgba(6, 182, 212, 0.1)", color: "#06B6D4", border: "1px solid rgba(6, 182, 212, 0.2)" }
                      : { backgroundColor: "#121A2B", color: "#94A3B8", border: "1px solid #243146" }
                  }
                >
                  {cat}
                </button>
              ))}
              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors flex items-center gap-1"
                  style={{ backgroundColor: "transparent", color: "#64748B", border: "1px solid transparent" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#F3F6FB"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#64748B"; }}
                >
                  <X className="w-3 h-3" /> Clear Filter
                </button>
              )}
            </div>
          )}
        </div>

        {/* RESULTS */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <RefreshCw className="w-6 h-6 animate-spin" style={{ color: "#06B6D4" }} />
            <p style={{ color: "#64748B" }}>Retrieving organizational memories...</p>
          </div>
        ) : filteredMemories.length === 0 ? (
          <div className="rounded-2xl border p-16 text-center" style={{ backgroundColor: "#121A2B", borderColor: "#243146", borderStyle: "dashed" }}>
            <h3 className="text-[18px] font-semibold mb-2" style={{ color: "#F3F6FB" }}>No Memories Found</h3>
            <p className="text-[14px]" style={{ color: "#64748B" }}>
              Try adjusting your search terms or clearing the selected category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            <div className="flex items-center justify-between px-2">
              <span className="text-[12px] font-bold uppercase tracking-widest" style={{ color: "#64748B" }}>
                {filteredMemories.length} {filteredMemories.length === 1 ? "Result" : "Results"}
              </span>
            </div>
            
            {filteredMemories.map((memory) => (
              <Link
                key={memory.id}
                href={`/memory/${memory.id}`}
                className="block rounded-2xl border p-8 transition-colors group"
                style={{ backgroundColor: "#121A2B", borderColor: "#243146" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#64748B"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#243146"; }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold tracking-widest uppercase mb-3" style={{ backgroundColor: "rgba(139, 92, 246, 0.1)", color: "#8B5CF6" }}>
                      <Brain className="w-3 h-3" />
                      {memory.threat_category || "Uncategorized"}
                    </span>
                    <h3 className="text-[18px] font-semibold leading-snug" style={{ color: "#F3F6FB" }}>
                      {memory.hindsight_reasoning.length > 120
                        ? `${memory.hindsight_reasoning.substring(0, 120)}...`
                        : memory.hindsight_reasoning}
                    </h3>
                  </div>
                  <div className="text-right shrink-0 ml-6">
                    <div className="inline-block px-3 py-1 rounded border text-[13px] font-bold" style={{ backgroundColor: "rgba(6, 182, 212, 0.1)", color: "#06B6D4", borderColor: "rgba(6, 182, 212, 0.2)" }}>
                      {memory.ai_confidence_score}% Strength
                    </div>
                  </div>
                </div>

                {memory.recommendations && memory.recommendations.length > 0 && (
                  <div className="mt-6 pt-6" style={{ borderTop: "1px solid #243146" }}>
                    <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "#64748B" }}>Top Insight</p>
                    <p className="text-[14px]" style={{ color: "#94A3B8" }}>
                      {memory.recommendations[0]}
                    </p>
                  </div>
                )}

                <div className="mt-6 flex items-center justify-between text-[12px]">
                  <span style={{ color: "#64748B" }}>
                    Learned on {new Date(memory.created_at).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1 font-medium group-hover:underline" style={{ color: "#06B6D4" }}>
                    View Memory Detail <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
