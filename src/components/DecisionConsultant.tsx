/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, Send, Sparkles, User, ShieldAlert, CheckCircle, ArrowRight, CornerDownRight } from "lucide-react";
import { AnalysisType } from "../types";

interface Message {
  id: string;
  role: "user" | "model";
  text: string;
}

interface DecisionConsultantProps {
  decision: string;
  type: AnalysisType;
  activeAnalysis: any;
}

export default function DecisionConsultant({ decision, type, activeAnalysis }: DecisionConsultantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial",
      role: "model",
      text: "Hello! I am your AI Decision Consultant. I've analyzed your evaluation framework. Let's tackle your blind spots, resolve remaining doubt, or map out an action plan. What's on your mind?"
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom of the chat logs
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Context-aware suggested questions based on analysis type
  const suggestions = {
    "pros-cons": [
      "Can you suggest a compromise that blends pros and mitigates cons?",
      "What are the hidden risks (cons) that I might have overlooked?",
      "Help me formulate a step-by-step action plan to execute this."
    ],
    "comparison": [
      "How can I combine the best traits of these top options?",
      "What are some low-risk experiments to test the leading option?",
      "If I prioritize speed over stability, which one should I choose?"
    ],
    "swot": [
      "How do I leverage my Strengths to neutralize the Threats?",
      "What's a major mitigation plan for my top Weaknesses?",
      "What immediate steps should I take to capture the best Opportunities?"
    ]
  };

  const currentSuggestions = suggestions[type] || suggestions["pros-cons"];

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    setError(null);
    const userMsgId = `msg-${Date.now()}`;
    const userMsg: Message = {
      id: userMsgId,
      role: "user",
      text: textToSend.trim()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Map history to server schema
      const historyPayload = messages.map((m) => ({
        role: m.role,
        text: m.text
      }));

      const response = await fetch("/api/consult-decision", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          decision,
          type,
          activeAnalysis,
          history: historyPayload,
          userMessage: textToSend.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "The consultant experienced an issue formulating advice.");
      }

      const data = await response.json();
      const assistantMsg: Message = {
        id: `msg-${Date.now() + 1}`,
        role: "model",
        text: data.reply
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error("Consultation error:", err);
      setError(err.message || "Failed to fetch response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  // Safe renderer for rich text replies with bullet points, bolding and numbered lists
  const renderMessageContent = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, index) => {
      let trimmed = line.trim();
      
      // Handle bold segments (**bold**)
      const parseBold = (str: string) => {
        const parts = str.split(/\*\*(.*?)\*\*/g);
        return parts.map((part, i) => {
          if (i % 2 === 1) {
            return <strong key={i} className="font-bold text-indigo-950">{part}</strong>;
          }
          return part;
        });
      };

      // Bullet points
      if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
        return (
          <div key={index} className="flex items-start gap-2 ml-4 my-1">
            <span className="text-indigo-500 mt-1.5 shrink-0 select-none">•</span>
            <p className="text-xs text-slate-700 leading-relaxed flex-1">
              {parseBold(trimmed.substring(2))}
            </p>
          </div>
        );
      }

      // Numbered lists
      const numberMatch = trimmed.match(/^(\d+)\.\s(.*)/);
      if (numberMatch) {
        return (
          <div key={index} className="flex items-start gap-2 ml-4 my-1">
            <span className="text-indigo-600 font-mono font-bold text-[10px] bg-indigo-50 border border-indigo-100/60 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 select-none">
              {numberMatch[1]}
            </span>
            <p className="text-xs text-slate-700 leading-relaxed flex-1 mt-0.5">
              {parseBold(numberMatch[2])}
            </p>
          </div>
        );
      }

      // Standard text line
      if (!trimmed) {
        return <div key={index} className="h-2" />;
      }

      return (
        <p key={index} className="text-xs text-slate-700 leading-relaxed my-1">
          {parseBold(line)}
        </p>
      );
    });
  };

  return (
    <div 
      className="bg-white border border-indigo-100 rounded-3xl overflow-hidden flex flex-col h-[520px] shadow-sm relative"
      id="decision-consultant-card"
    >
      {/* Header */}
      <div className="bg-indigo-950 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="bg-indigo-800 p-2 rounded-xl">
            <Sparkles className="w-4.5 h-4.5 text-indigo-300 animate-pulse" />
          </div>
          <div>
            <h3 className="font-sans font-bold text-sm tracking-wide">
              The Tiebreaker Consultant
            </h3>
            <p className="text-[10px] text-indigo-300 font-mono">
              Contextual Follow-up Sounding Board
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 rounded-full">
          Active Session
        </span>
      </div>

      {/* Suggestion Chips Panel */}
      <div className="bg-slate-50 border-b border-indigo-50/60 p-3 flex flex-col gap-1.5 shrink-0">
        <span className="text-[9px] font-mono font-bold text-slate-400 tracking-wider uppercase">
          Suggested Follow-ups:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {currentSuggestions.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(suggestion)}
              disabled={isLoading}
              className="text-left text-[11px] bg-white border border-indigo-100 text-indigo-950 font-medium px-3 py-1.5 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/40 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 shadow-2xs"
            >
              <CornerDownRight className="w-3 h-3 text-indigo-400 shrink-0" />
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/40">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 max-w-[85%] ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
            >
              {/* Avatar Icon */}
              <div 
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-sm border ${
                  isUser 
                    ? "bg-indigo-600 text-white border-indigo-700" 
                    : "bg-white text-indigo-950 border-indigo-100"
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-indigo-600" />}
              </div>

              {/* Message Bubble */}
              <div 
                className={`rounded-2xl p-3.5 shadow-sm border ${
                  isUser 
                    ? "bg-indigo-600 text-white border-indigo-700 rounded-tr-none" 
                    : "bg-white text-slate-800 border-indigo-100/80 rounded-tl-none"
                }`}
              >
                {isUser ? (
                  <p className="text-xs font-sans leading-relaxed text-white">{msg.text}</p>
                ) : (
                  <div className="space-y-1">
                    {renderMessageContent(msg.text)}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex items-start gap-2.5 max-w-[80%] mr-auto">
            <div className="w-7 h-7 rounded-lg bg-white text-indigo-950 border border-indigo-100 flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="w-4 h-4 text-indigo-600 animate-spin" />
            </div>
            <div className="bg-white text-slate-500 border border-indigo-100/80 rounded-2xl rounded-tl-none p-3.5 shadow-sm flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-[10px] font-mono text-slate-400">Specialist is typing...</span>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-rose-50 border border-rose-100 p-3 rounded-2xl flex items-center gap-2 text-rose-700 text-xs shadow-2xs">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
            <p className="flex-1 font-medium">{error}</p>
            <button 
              onClick={() => handleSendMessage(messages[messages.length - 1]?.text || "Retry")}
              className="text-[10px] font-bold text-rose-600 bg-rose-100 hover:bg-rose-200 px-2.5 py-1 rounded-lg transition-all"
            >
              Retry
            </button>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Message Input Box */}
      <form onSubmit={handleFormSubmit} className="p-3 border-t border-indigo-100 bg-white shrink-0 flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={`Ask about this ${type === "swot" ? "SWOT" : type === "comparison" ? "comparison" : "pros/cons"}...`}
          disabled={isLoading}
          className="flex-1 bg-slate-50 border border-indigo-100 rounded-xl px-3 py-2 text-xs text-indigo-950 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white p-2 rounded-xl transition-all shadow-sm flex items-center justify-center shrink-0 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
