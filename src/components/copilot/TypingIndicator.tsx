import React from "react";
import { Bot } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex w-full gap-4 p-4 rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-300 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
      <div className="flex items-center justify-center h-8 w-8 rounded-full shrink-0 bg-gradient-to-br from-cyan-500 to-purple-600">
        <Bot className="w-5 h-5 text-white" />
      </div>
      <div className="flex items-center gap-1.5 px-2">
        <div className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce" style={{ animationDelay: "150ms" }} />
        <div className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}
