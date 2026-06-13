import React from "react";
import { DatabaseZap } from "lucide-react";

export function MemoryRetrievalIndicator() {
  return (
    <div className="flex justify-center w-full my-4">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-400 animate-pulse border border-zinc-200 dark:border-zinc-700">
        <DatabaseZap className="w-3.5 h-3.5 text-cyan-500" />
        Searching organizational memory...
      </div>
    </div>
  );
}
