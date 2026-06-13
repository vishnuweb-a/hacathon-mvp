import React from "react";
import { MessageSquarePlus } from "lucide-react";

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
}

const PROMPTS = [
  "Have we seen AWS credential theft before?",
  "What causes AWS login failures?",
  "Which runbooks work best for ransomware?",
  "Show common root causes for phishing.",
];

export function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
  return (
    <div className="w-full max-w-3xl mx-auto mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
      <div className="flex items-center gap-2 mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400 px-4">
        <MessageSquarePlus className="w-4 h-4" />
        Suggested questions
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 px-4">
        {PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => onSelect(prompt)}
            className="text-left text-sm p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white hover:bg-zinc-50 dark:bg-zinc-900/50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors shadow-sm"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
