"use client";

import { useState, useEffect } from "react";
import {
  GitBranch,
  Search,
  Database,
  Brain,
  Shield,
  FileText,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Using dynamic generic types to match our backend structure
export default function ProvenanceExplorer() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  const [influentialMemories, setInfluentialMemories] = useState<any[]>([]);
  const [loadingMemories, setLoadingMemories] = useState(true);

  // Fetch top influential memories on mount
  useEffect(() => {
    // We'll mock this fetch for the UI MVP, but it would call a real API in production
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

  const getSourceIcon = (type: string) => {
    switch (type) {
      case "incident": return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case "postmortem": return <FileText className="w-4 h-4 text-cyan-500" />;
      case "learning_event": return <Brain className="w-4 h-4 text-violet-500" />;
      case "memory": return <Database className="w-4 h-4 text-emerald-500" />;
      default: return <Shield className="w-4 h-4 text-zinc-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-6 sm:p-10 text-zinc-200">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <GitBranch className="w-8 h-8 text-emerald-400" />
            Memory Provenance Explorer
          </h1>
          <p className="text-zinc-400 mt-2 max-w-2xl">
            Trace every AI recommendation, threat prediction, and executive insight back to the historical incidents, postmortems, and learning events that produced it.
          </p>
        </div>

        {/* SEARCH BAR */}
        <form onSubmit={handleSearch} className="relative max-w-3xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-zinc-500" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-3 py-4 border border-zinc-800 rounded-2xl bg-zinc-900/50 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-lg"
            placeholder="E.g., Why did SentinelMind recommend MFA for credential theft?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            disabled={isSearching || !query}
            className="absolute inset-y-2 right-2 px-6 bg-emerald-500 hover:bg-emerald-400 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            {isSearching ? "Searching..." : "Trace"}
          </button>
        </form>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Search Results & Evidence Chain */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-400" />
                  Relevant Memories Found ({searchResults.length})
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  {searchResults.map((res, i) => (
                    <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getSourceIcon(res.type)}
                          <span className="text-sm font-medium text-zinc-300 capitalize">{res.type.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
                          <TrendingUp className="w-3 h-3" />
                          {Math.round(res.relevance * 100)}% Match
                        </div>
                      </div>
                      <p className="text-zinc-200 text-sm leading-relaxed">
                        "{res.context}"
                      </p>
                      <button className="mt-4 text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1">
                        View Reasoning Chain <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Placeholder / Empty State */}
            {searchResults.length === 0 && !isSearching && (
              <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-12 text-center border-dashed">
                <GitBranch className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-zinc-300 mb-2">Explore the Reasoning Chain</h3>
                <p className="text-zinc-500 max-w-md mx-auto">
                  Search for a topic or recommendation above to see exactly which historical events, postmortems, and learning memories influenced SentinelMind's decisions.
                </p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Memory Strength & Timeline */}
          <div className="space-y-8">
            
            {/* Top Influential Memories */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <Brain className="w-5 h-5 text-violet-400" />
                <h2 className="text-lg font-semibold">Top Influential Memories</h2>
              </div>
              
              {loadingMemories ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-16 bg-zinc-800/50 rounded-xl" />)}
                </div>
              ) : (
                <div className="space-y-4">
                  {influentialMemories.map((mem) => (
                    <div key={mem.id} className="group relative">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-400">{mem.category}</span>
                        <span className="text-emerald-400 font-medium">{mem.strengthScore}% Strength</span>
                      </div>
                      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-300 group-hover:border-zinc-700 transition-colors cursor-pointer">
                        {mem.label}
                        <div className="mt-2 text-xs text-zinc-500 flex items-center gap-1">
                          <Database className="w-3 h-3" />
                          Referenced {mem.referenceCount} times
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Filters */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Evidence Sources</h2>
              <div className="space-y-2">
                {[
                  { label: "Historical Incidents", icon: AlertTriangle, color: "text-amber-500" },
                  { label: "Postmortems", icon: FileText, color: "text-cyan-500" },
                  { label: "Learning Events", icon: Brain, color: "text-violet-500" },
                  { label: "Hindsight Memories", icon: Database, color: "text-emerald-500" }
                ].map((src, i) => (
                  <button key={i} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-zinc-800/50 transition-colors text-sm text-zinc-300">
                    <div className="flex items-center gap-3">
                      <src.icon className={cn("w-4 h-4", src.color)} />
                      {src.label}
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-600" />
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
