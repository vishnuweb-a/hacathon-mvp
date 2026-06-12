"use client";

import { useState } from "react";
import type { SearchResult } from "@/lib/hindsight";

export default function MemoryExplorer() {
  const [query, setQuery] = useState("");
  const [memories, setMemories] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/memory/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to search memories");
      }

      setMemories(data.memories);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-5xl font-sans">
      <h1 className="text-3xl font-bold mb-8">🧠 Memory Explorer</h1>

      <form onSubmit={handleSearch} className="mb-8 flex gap-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search past incidents (e.g., 'multiple failed logins', 'phishing')"
          className="flex-1 p-4 border rounded-lg shadow-sm text-lg focus:ring-2 focus:ring-blue-500 outline-none"
          disabled={loading}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Searching..." : "Recall"}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-8">
          Error: {error}
        </div>
      )}

      <div className="space-y-6">
        {memories.length === 0 && !loading && !error && query && (
          <p className="text-gray-500 text-center py-8">No relevant memories found.</p>
        )}

        {memories.map((memory) => (
          <div key={memory.id} className="border rounded-xl p-6 shadow-sm bg-white hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-semibold text-gray-900">
                {memory.metadata.title}
              </h2>
              <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                {Math.round(memory.relevance_score * 100)}% Match
              </span>
            </div>

            <p className="text-gray-600 mb-6">{memory.metadata.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-lg">
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Root Cause</h3>
                <p className="text-gray-800">{memory.metadata.root_cause}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Resolution</h3>
                <p className="text-gray-800">{memory.metadata.resolution}</p>
              </div>

              <div className="md:col-span-2">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Lessons Learned</h3>
                <p className="text-gray-800 bg-yellow-50 p-4 border border-yellow-100 rounded text-sm">
                  {memory.metadata.lessons_learned}
                </p>
              </div>
            </div>

            <div className="mt-4 flex gap-4 text-sm text-gray-500">
              <span>Severity: <strong className="capitalize text-gray-700">{memory.metadata.severity}</strong></span>
              <span>•</span>
              <span>Resolution Time: <strong className="text-gray-700">{memory.metadata.resolution_time_minutes} min</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
