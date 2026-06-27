/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Trash2, Shield, AlertTriangle, TrendingUp, Skull, ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";
import { SwotAnalysis, SwotItem } from "../types";

interface SwotViewProps {
  analysis: SwotAnalysis;
  onUpdate: (updatedAnalysis: SwotAnalysis) => void;
}

type SwotQuadrant = "strengths" | "weaknesses" | "opportunities" | "threats";

export default function SwotView({ analysis, onUpdate }: SwotViewProps) {
  const { strengths, weaknesses, opportunities, threats } = analysis;
  
  // States
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<SwotQuadrant | "all">("all");
  const [impactFilter, setImpactFilter] = useState<"All" | "High" | "Medium" | "Low">("All");

  // Inputs for adding a point
  const [newPointText, setNewPointText] = useState("");
  const [newPointExplain, setNewPointExplain] = useState("");
  const [newPointImpact, setNewPointImpact] = useState<"High" | "Medium" | "Low">("Medium");
  const [targetQuadrant, setTargetQuadrant] = useState<SwotQuadrant>("strengths");

  // Toggle point expansion
  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Delete Item
  const handleDeleteItem = (id: string, quadrant: SwotQuadrant) => {
    const updatedList = analysis[quadrant].filter((item) => item.id !== id);
    onUpdate({
      ...analysis,
      [quadrant]: updatedList,
    });
  };

  // Add Custom Item
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPointText.trim()) return;

    const newItem: SwotItem = {
      id: `custom-swot-${Date.now()}`,
      point: newPointText.trim(),
      explanation: newPointExplain.trim() || "User-added factor.",
      potentialImpact: newPointImpact,
    };

    onUpdate({
      ...analysis,
      [targetQuadrant]: [...analysis[targetQuadrant], newItem],
    });

    setNewPointText("");
    setNewPointExplain("");
  };

  // Filters points based on impact and quadrant
  const getFilteredPoints = (items: SwotItem[]) => {
    if (impactFilter === "All") return items;
    return items.filter((item) => item.potentialImpact === impactFilter);
  };

  // Render Quadrant Card
  const renderQuadrant = (
    title: string,
    key: SwotQuadrant,
    icon: React.ReactNode,
    borderColorClass: string,
    accentColorClass: string,
    bgHeaderClass: string
  ) => {
    const items = analysis[key];
    const filteredItems = getFilteredPoints(items);

    return (
      <div 
        className="bg-white border border-indigo-100 rounded-3xl overflow-hidden flex flex-col h-full transition-all shadow-sm"
        id={`swot-${key}-card`}
      >
        {/* Quadrant Header */}
        <div className={`p-4 border-b border-indigo-50 ${bgHeaderClass} flex justify-between items-center`}>
          <div className="flex items-center gap-2">
            {icon}
            <h4 className={`font-sans font-bold text-sm tracking-wide ${accentColorClass}`}>
              {title}
            </h4>
          </div>
          <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100/50">
            {filteredItems.length} points
          </span>
        </div>

        {/* Quadrant Body */}
        <div className="p-4 flex-1 space-y-3 overflow-y-auto max-h-[350px]">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No items {impactFilter !== "All" ? `with ${impactFilter} impact` : ""} here.
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {filteredItems.map((item) => {
                const isExpanded = expandedItems[item.id];
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-slate-50 border border-indigo-100/40 rounded-xl p-3 space-y-1.5 hover:border-indigo-200 hover:bg-white transition-all shadow-sm"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 cursor-pointer" onClick={() => toggleExpand(item.id)}>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                            item.potentialImpact === "High" 
                              ? "bg-rose-100 text-rose-700 border border-rose-200" 
                              : item.potentialImpact === "Medium"
                              ? "bg-amber-100 text-amber-700 border border-amber-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}>
                            {item.potentialImpact} Impact
                          </span>
                          <span className="font-sans font-bold text-indigo-950 text-sm">{item.point}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => toggleExpand(item.id)}
                          className="text-indigo-400 hover:text-indigo-600 p-1 rounded transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id, key)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-xs text-slate-600 leading-relaxed bg-white/80 p-2 rounded-lg border border-indigo-100/50 mt-1"
                      >
                        {item.explanation}
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6" id="swot-analysis-layout">
      {/* 1. Filtering Controls */}
      <div className="bg-white border border-indigo-100 rounded-3xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm" id="swot-controls">
        {/* Quadrant views tab selection (for narrow layouts / focus) */}
        <div className="flex flex-wrap gap-1 bg-indigo-50 p-1 rounded-xl border border-indigo-100/50 w-full md:w-auto">
          {(["all", "strengths", "weaknesses", "opportunities", "threats"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 md:flex-initial text-xs px-3 py-1.5 rounded-lg capitalize font-bold transition-all ${
                activeTab === tab
                  ? "bg-white text-indigo-950 shadow-sm border border-indigo-100/50"
                  : "text-indigo-600 hover:text-indigo-800"
              }`}
            >
              {tab === "all" ? "View 2x2 Bento" : tab}
            </button>
          ))}
        </div>

        {/* Impact filter pill selectors */}
        <div className="flex items-center gap-2 bg-indigo-50 p-1 rounded-xl border border-indigo-100/50 w-full md:w-auto justify-between md:justify-start">
          <span className="text-[10px] font-mono text-indigo-400 pl-2">Filter Impact:</span>
          <div className="flex gap-1">
            {(["All", "High", "Medium", "Low"] as const).map((impact) => (
              <button
                key={impact}
                onClick={() => setImpactFilter(impact)}
                className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all ${
                  impactFilter === impact
                    ? "bg-white text-indigo-950 shadow-sm border border-indigo-100/50"
                    : "text-indigo-600 hover:text-indigo-800"
                }`}
              >
                {impact}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Interactive Quadrants Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6" id="swot-bento-grid">
        {(activeTab === "all" || activeTab === "strengths") && (
          renderQuadrant(
            "STRENGTHS (Internal Advantage)",
            "strengths",
            <Shield className="text-emerald-600 w-4.5 h-4.5" />,
            "border-emerald-100",
            "text-emerald-700",
            "bg-emerald-50/30"
          )
        )}
        {(activeTab === "all" || activeTab === "weaknesses") && (
          renderQuadrant(
            "WEAKNESSES (Internal Risks)",
            "weaknesses",
            <AlertTriangle className="text-rose-600 w-4.5 h-4.5" />,
            "border-rose-100",
            "text-rose-700",
            "bg-rose-50/30"
          )
        )}
        {(activeTab === "all" || activeTab === "opportunities") && (
          renderQuadrant(
            "OPPORTUNITIES (External Leverage)",
            "opportunities",
            <TrendingUp className="text-indigo-600 w-4.5 h-4.5" />,
            "border-indigo-100",
            "text-indigo-700",
            "bg-indigo-50/30"
          )
        )}
        {(activeTab === "all" || activeTab === "threats") && (
          renderQuadrant(
            "THREATS (External Vulnerabilities)",
            "threats",
            <Skull className="text-amber-600 w-4.5 h-4.5" />,
            "border-amber-100",
            "text-amber-700",
            "bg-amber-50/30"
          )
        )}
      </div>

      {/* 3. Add SWOT Factor Form */}
      <div className="bg-white border border-indigo-100 rounded-3xl p-5 shadow-sm" id="add-swot-factor">
        <h4 className="font-sans font-bold text-indigo-900 text-sm mb-4">Add Custom SWOT Factor</h4>
        <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-12 gap-3" id="add-swot-form">
          <div className="md:col-span-3">
            <label className="block text-[10px] font-mono text-indigo-400 mb-1">Target Quadrant</label>
            <select
              value={targetQuadrant}
              onChange={(e) => setTargetQuadrant(e.target.value as SwotQuadrant)}
              className="w-full text-xs bg-slate-50 border border-indigo-100 text-slate-800 px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
            >
              <option value="strengths">Strengths (Advantage)</option>
              <option value="weaknesses">Weaknesses (Risk)</option>
              <option value="opportunities">Opportunities (Growth)</option>
              <option value="threats">Threats (Vulnerability)</option>
            </select>
          </div>

          <div className="md:col-span-5">
            <label className="block text-[10px] font-mono text-indigo-400 mb-1">Core Point</label>
            <input
              type="text"
              placeholder="E.g., High starting cash reserves..."
              value={newPointText}
              onChange={(e) => setNewPointText(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-indigo-100 text-slate-800 px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[10px] font-mono text-indigo-400 mb-1">Potential Impact</label>
            <select
              value={newPointImpact}
              onChange={(e) => setNewPointImpact(e.target.value as "High" | "Medium" | "Low")}
              className="w-full text-xs bg-slate-50 border border-indigo-100 text-slate-800 px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="md:col-span-2 flex items-end">
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 rounded-lg transition-colors shadow-sm"
            >
              Add Factor
            </button>
          </div>

          <div className="md:col-span-12">
            <label className="block text-[10px] font-mono text-indigo-400 mb-1">Detailed Explanation (Optional)</label>
            <input
              type="text"
              placeholder="Provide a brief description of how this factor impacts your decision..."
              value={newPointExplain}
              onChange={(e) => setNewPointExplain(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-indigo-100 text-slate-800 px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
            />
          </div>
        </form>
      </div>
    </div>
  );
}
