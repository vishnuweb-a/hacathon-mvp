"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles } from "lucide-react";
import { ChatBubble } from "@/components/copilot/ChatBubble";
import { EvidenceCard } from "@/components/copilot/EvidenceCard";
import { ConfidenceBadge } from "@/components/copilot/ConfidenceBadge";
import { TypingIndicator } from "@/components/copilot/TypingIndicator";
import { MemoryRetrievalIndicator } from "@/components/copilot/MemoryRetrievalIndicator";
import { SuggestedPrompts } from "@/components/copilot/SuggestedPrompts";
import { CopilotResponse } from "@/types/copilot";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  data?: CopilotResponse;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I am your Security Copilot. I can search organizational memory, analyze past incidents, and recommend actions based on our postmortems. How can I help you today?",
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRetrieving, setIsRetrieving] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isRetrieving]);

  const handleSubmit = async (e?: React.FormEvent, presetPrompt?: string) => {
    if (e) e.preventDefault();
    const textToSend = presetPrompt || input;
    if (!textToSend.trim() || isLoading) return;

    setInput("");
    
    // Add user message
    const userMsgId = Date.now().toString();
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", content: textToSend }
    ]);

    setIsLoading(true);
    setIsRetrieving(true);

    try {
      // Simulate memory retrieval delay for visual feedback
      setTimeout(() => setIsRetrieving(false), 1500);

      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend }),
      });

      const data = await res.json();
      
      if (!data.success) throw new Error(data.error);

      // Add assistant message
      setMessages((prev) => [
        ...prev,
        { 
          id: (Date.now() + 1).toString(), 
          role: "assistant", 
          content: data.answer.summary,
          data: data.answer 
        }
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        { 
          id: (Date.now() + 1).toString(), 
          role: "assistant", 
          content: "Sorry, I encountered an error while searching organizational memory." 
        }
      ]);
    } finally {
      setIsLoading(false);
      setIsRetrieving(false);
    }
  };

  const renderAssistantContent = (msg: Message) => {
    if (!msg.data) return <p>{msg.content}</p>;

    return (
      <div className="space-y-4">
        <p>{msg.content}</p>
        
        {msg.data.historicalEvidence && msg.data.historicalEvidence.length > 0 && (
          <div className="space-y-2 mt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Historical Evidence Found
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {msg.data.historicalEvidence.map((ev, idx) => (
                <EvidenceCard key={idx} evidence={ev} />
              ))}
            </div>
          </div>
        )}

        {msg.data.recommendations && msg.data.recommendations.length > 0 && (
          <div className="space-y-2 mt-4 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Recommendations
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              {msg.data.recommendations.map((rec, idx) => (
                <li key={idx} className="text-zinc-700 dark:text-zinc-300">{rec}</li>
              ))}
            </ul>
          </div>
        )}

        {msg.data.confidence && (
          <div className="mt-4 flex justify-end">
            <ConfidenceBadge confidence={msg.data.confidence} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-zinc-50 dark:bg-black font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-black/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-zinc-900 dark:text-white leading-tight">Security Copilot</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Powered by Hindsight & Gemini</p>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 w-full max-w-4xl mx-auto flex flex-col gap-6">
        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            role={msg.role}
            content={msg.role === "assistant" ? renderAssistantContent(msg) : msg.content}
          />
        ))}

        {isRetrieving && <MemoryRetrievalIndicator />}
        {isLoading && !isRetrieving && <TypingIndicator />}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts (only show if no user messages yet) */}
      {messages.length === 1 && !isLoading && (
        <SuggestedPrompts onSelect={(prompt) => handleSubmit(undefined, prompt)} />
      )}

      {/* Input Area */}
      <div className="p-4 sm:p-6 bg-white dark:bg-black border-t border-zinc-200 dark:border-zinc-800 w-full">
        <form 
          onSubmit={handleSubmit}
          className="max-w-4xl mx-auto relative flex items-center"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about historical incidents, root causes, or runbooks..."
            className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-full pl-6 pr-14 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 dark:text-white transition-all shadow-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-2.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
