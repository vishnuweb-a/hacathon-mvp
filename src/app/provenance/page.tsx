"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Database,
  Brain,
  Shield,
  FileText,
  ArrowRight,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";

export default function ProvenanceExplorer() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  const [influentialMemories, setInfluentialMemories] = useState<any[]>([]);
  const [loadingMemories, setLoadingMemories] = useState(true);

  // Fetch top influential memories on mount
  useEffect(() => {
    // Mock fetch for the UI MVP
    setTimeout(() => {
      setInfluentialMemories([
        { id: "mem-1", label: "Enabling MFA stops 99% of credential theft", category: "Credential Theft", referenceCount: 42, strengthScore: 96 },
        { id: "mem-2", label: "Always rotate API keys after unexpected high usage", category: "API Key Exposure", referenceCount: 28, strengthScore: 91 },
        { id: "mem-3", label: "Phishing links typically originate from newly registered domains", category: "Phishing", referenceCount: 15, strengthScore: 82 },
        { id: "mem-4", label: "Lock down IAM roles when excessive permissions are detected", category: "Privilege Escalation", referenceCount: 11, strengthScore: 75 },
      ]);
      setLoadingMemories(false);
    }, 1000);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    setIsSearching(true);
    try {
      const res = await fetch(`/api/provenance/search?q=${encodeURIComponent(query)}`);
      const { data } = await res.json();
      setSearchResults(data?.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const getSourceTypeStyles = (type: string) => {
    switch (type) {
      case "incident": return { bg: "rgba(245, 158, 11, 0.1)", color: "#F59E0B" }; // amber
      case "postmortem": return { bg: "rgba(6, 182, 212, 0.1)", color: "#06B6D4" }; // cyan
      case "learning_event": return { bg: "rgba(139, 92, 246, 0.1)", color: "#8B5CF6" }; // violet
      case "memory": return { bg: "rgba(16, 185, 129, 0.1)", color: "#10B981" }; // emerald
      default: return { bg: "rgba(148, 163, 184, 0.1)", color: "#94A3B8" }; // slate
    }
  };

  return (
    <div className="min-h-screen p-8 sm:p-10" style={{ backgroundColor: "#0B1220" }}>
      <div className="max-w-[1200px] mx-auto space-y-12">
        
        {/* HEADER */}
        <div>
          <h1 className="text-[32px] font-bold tracking-tight" style={{ color: "#F3F6FB" }}>
            Memory Provenance Explorer
          </h1>
          <p className="mt-2 text-[15px]" style={{ color: "#64748B", maxWidth: "600px" }}>
            Trace every AI recommendation, threat prediction, and executive insight back to the historical incidents, postmortems, and learning events that produced it.
          </p>
        </div>

        {/* SEARCH BAR */}
        <form onSubmit={handleSearch} className="relative max-w-3xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5" style={{ color: "#64748B" }} />
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-4 py-4 rounded-xl transition-all"
            style={{ 
              backgroundColor: "#121A2B", 
              border: "1px solid #243146", 
              color: "#F3F6FB",
              outline: "none"
            }}
            placeholder="Search organizational memory..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={(e) => { e.currentTarget.style.borderColor = "#64748B"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "#243146"; }}
          />
          <button
            type="submit"
            disabled={isSearching || !query}
            className="absolute inset-y-2 right-2 px-6 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            style={{ backgroundColor: "#182235", color: "#F3F6FB", border: "1px solid #243146" }}
            onMouseEnter={(e) => { if (!isSearching && query) e.currentTarget.style.backgroundColor = "#243146"; }}
            onMouseLeave={(e) => { if (!isSearching && query) e.currentTarget.style.backgroundColor = "#182235"; }}
          >
            {isSearching ? "Searching..." : "Trace"}
          </button>
        </form>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Search Results & Evidence Chain */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#64748B" }}>
                  Relevant Memories Found ({searchResults.length})
                </h2>
                <div className="space-y-4">
                  {searchResults.map((res, i) => {
                    const style = getSourceTypeStyles(res.type);
                    return (
                      <div 
                        key={i} 
                        className="rounded-xl border p-6 transition-colors"
                        style={{ backgroundColor: "#121A2B", borderColor: "#243146" }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#64748B"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#243146"; }}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <span 
                            className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                            style={{ backgroundColor: style.bg, color: style.color }}
                          >
                            {res.type.replace('_', ' ')}
                          </span>
                          <span className="text-[12px] font-semibold" style={{ color: "#94A3B8" }}>
                            {Math.round(res.relevance * 100)}% Match
                          </span>
                        </div>
                        <p className="text-[14px] leading-relaxed" style={{ color: "#F3F6FB" }}>
                          "{res.context}"
                        </p>
                        <button className="mt-5 text-[13px] font-medium flex items-center gap-1.5 transition-colors" style={{ color: "#94A3B8" }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = "#F3F6FB"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = "#94A3B8"; }}
                        >
                          View Reasoning Chain <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty State */}
            {searchResults.length === 0 && !isSearching && (
              <div className="rounded-xl border p-12 text-center" style={{ backgroundColor: "#121A2B", borderColor: "#243146", borderStyle: "dashed" }}>
                <h3 className="text-[16px] font-semibold mb-2" style={{ color: "#F3F6FB" }}>Explore the Reasoning Chain</h3>
                <p className="text-[14px] max-w-md mx-auto" style={{ color: "#64748B" }}>
                  Search for a topic or recommendation above to see exactly which historical events, postmortems, and learning memories influenced SentinelMind's decisions.
                </p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Memory Strength & Timeline */}
          <div className="space-y-8">
            
            {/* Top Influential Memories */}
            <div className="rounded-xl border p-8" style={{ backgroundColor: "#121A2B", borderColor: "#243146" }}>
              <h2 className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: "#64748B" }}>
                Top Influential Memories
              </h2>
              
              {loadingMemories ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl animate-pulse" style={{ backgroundColor: "#182235" }} />)}
                </div>
              ) : (
                <div className="space-y-4">
                  {influentialMemories.map((mem) => (
                    <div key={mem.id} className="group relative">
                      <div className="flex justify-between text-[11px] font-semibold tracking-wide uppercase mb-2">
                        <span style={{ color: "#64748B" }}>{mem.category}</span>
                        <span style={{ color: "#06B6D4" }}>{mem.strengthScore} Strength</span>
                      </div>
                      <div 
                        className="rounded-xl border p-4 text-[13px] transition-colors cursor-pointer"
                        style={{ backgroundColor: "#182235", borderColor: "#243146", color: "#F3F6FB" }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#06B6D4"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#243146"; }}
                      >
                        {mem.label}
                        <div className="mt-3 text-[11px] font-medium tracking-wide uppercase" style={{ color: "#64748B" }}>
                          Referenced {mem.referenceCount} times
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Filters (No Icons) */}
            <div className="rounded-xl border p-8" style={{ backgroundColor: "#121A2B", borderColor: "#243146" }}>
              <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#64748B" }}>
                Evidence Sources
              </h2>
              <div className="space-y-2">
                {["Historical Incidents", "Postmortems", "Learning Events", "Hindsight Memories"].map((label, i) => (
                  <button 
                    key={i} 
                    className="w-full flex items-center justify-between p-3 rounded-lg transition-colors text-[13px] font-medium"
                    style={{ color: "#F3F6FB" }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#182235"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                  >
                    {label}
                    <ChevronRight className="w-4 h-4" style={{ color: "#64748B" }} />
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
