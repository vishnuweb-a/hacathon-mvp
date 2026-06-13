import React from "react";
import { cn } from "@/lib/utils";
import { User, Bot } from "lucide-react";

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: React.ReactNode;
}

export function ChatBubble({ role, content }: ChatBubbleProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex w-full gap-4 p-4 rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-300",
        isUser
          ? "bg-zinc-100 dark:bg-zinc-800/50 flex-row-reverse"
          : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center h-8 w-8 rounded-full shrink-0",
          isUser
            ? "bg-zinc-300 dark:bg-zinc-700"
            : "bg-gradient-to-br from-cyan-500 to-purple-600"
        )}
      >
        {isUser ? (
          <User className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>
      <div
        className={cn(
          "flex-1 text-sm md:text-base leading-relaxed text-zinc-900 dark:text-zinc-100",
          isUser && "text-right"
        )}
      >
        {content}
      </div>
    </div>
  );
}
