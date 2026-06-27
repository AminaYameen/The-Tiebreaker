/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Trash2, Scale, ChevronDown, ChevronUp, AlertCircle, Info, Sparkles } from "lucide-react";
import { ProsConsAnalysis, ProConItem } from "../types";

interface ProsConsViewProps {
  analysis: ProsConsAnalysis;
  onUpdate: (updatedAnalysis: ProsConsAnalysis) => void;
}

export default function ProsConsView({ analysis, onUpdate }: ProsConsViewProps) {
  const { pros, cons, verdict, confidenceScore, tiebreakerTip } = analysis;
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  
  // Custom pro/con input state
  const [newProText, setNewProText] = useState("");
  const [newConText, setNewConText] = useState("");
  const [newProCategory, setNewProCategory] = useState("Personal");
  const [newConCategory, setNewConCategory] = useState("Personal");

  // Toggle item expansion
  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Adjust item weight
  const handleWeightChange = (id: string, isPro: boolean, newWeight: number) => {
    const list = isPro ? pros : cons;
    const updatedList = list.map((item) =>
      item.id === id ? { ...item, weight: newWeight } : item
    );
    onUpdate({
      ...analysis,
      pros: isPro ? updatedList : pros,
      cons: isPro ? pros : updatedList,
    });
  };

  // Delete an item
  const handleDeleteItem = (id: string, isPro: boolean) => {
    const updatedPros = isPro ? pros.filter((p) => p.id !== id) : pros;
    const updatedCons = isPro ? cons : cons.filter((c) => c.id !== id);
    onUpdate({
      ...analysis,
      pros: updatedPros,
      cons: updatedCons,
    });
  };

  // Add custom Pro
  const handleAddPro = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProText.trim()) return;
    const newItem: ProConItem = {
      id: `custom-pro-${Date.now()}`,
      text: newProText.trim(),
      explanation: "User-added factor with custom weight.",
      weight: 3,
      category: newProCategory,
    };
    onUpdate({
      ...analysis,
      pros: [...pros, newItem],
    });
    setNewProText("");
  };

  // Add custom Con
  const handleAddCon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConText.trim()) return;
    const newItem: ProConItem = {
      id: `custom-con-${Date.now()}`,
      text: newConText.trim(),
      explanation: "User-added factor with custom weight.",
      weight: 3,
      category: newConCategory,
    };
    onUpdate({
      ...analysis,
      cons: [...cons, newItem],
    });
    setNewConText("");
  };

  // Dynamic balance calculations
  const stats = useMemo(() => {
    const totalProWeight = pros.reduce((sum, p) => sum + p.weight, 0);
    const totalConWeight = cons.reduce((sum, c) => sum + c.weight, 0);
    const totalWeight = totalProWeight + totalConWeight;

    if (totalWeight === 0) {
      return { proPercent: 50, conPercent: 50, proWeight: 0, conWeight: 0 };
    }

    const proPercent = Math.round((totalProWeight / totalWeight) * 100);
    const conPercent = 100 - proPercent;

    return {
      proPercent,
      conPercent,
      proWeight: totalProWeight,
      conWeight: totalConWeight,
    };
  }, [pros, cons]);

  const categories = ["Financial", "Career", "Lifestyle", "Time", "Stress", "Personal", "Other"];

  return (
    <div className="space-y-8" id="pros-cons-visualizer">
      {/* 1. Tug of War Meter */}
      <div className="bg-white border border-indigo-100 rounded-3xl p-6 shadow-sm" id="tug-of-war-meter">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Scale className="text-indigo-600 w-5 h-5" />
            <h3 className="font-sans font-bold text-lg text-indigo-900">Weighted Decision Balance</h3>
          </div>
          <span className="text-xs font-mono text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
            Calculated in Real-Time
          </span>
        </div>

        {/* The Balance Slider */}
        <div className="relative pt-2">
          {/* Label percentages */}
          <div className="flex justify-between font-mono text-sm mb-2">
            <span className="text-emerald-600 font-bold flex items-center gap-1.5">
              Pros: {stats.proPercent}% <span className="text-xs text-slate-500 font-normal">({stats.proWeight} pts)</span>
            </span>
            <span className="text-rose-600 font-bold flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-normal">({stats.conWeight} pts)</span> Cons: {stats.conPercent}%
            </span>
          </div>

          {/* Bar track */}
          <div className="h-5 w-full bg-indigo-50 rounded-full overflow-hidden flex relative border border-indigo-100/50">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 ease-out"
              style={{ width: `${stats.proPercent}%` }}
            />
            <div
              className="h-full bg-gradient-to-r from-rose-400 to-rose-500 transition-all duration-500 ease-out"
              style={{ width: `${stats.conPercent}%` }}
            />
            {/* Center marker */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-indigo-950/20 border-x border-white/40" />
          </div>

          {/* Scale statement */}
          <div className="mt-4 text-center">
            <p className="text-sm text-slate-600 font-medium">
              {stats.proWeight > stats.conWeight ? (
                <span className="text-emerald-600 font-bold">
                  ⚖️ Pros are currently leading by {stats.proWeight - stats.conWeight} points.
                </span>
              ) : stats.conWeight > stats.proWeight ? (
                <span className="text-rose-600 font-bold">
                  ⚖️ Cons are currently leading by {stats.conWeight - stats.proWeight} points.
                </span>
              ) : (
                <span className="text-amber-600 font-bold">
                  ⚖️ Perfect Tie! Both sides are balanced at exactly {stats.proWeight} points.
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Interactive Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="columns-container">
        {/* PROS COLUMN */}
        <div className="bg-white border border-indigo-100 rounded-3xl p-5 space-y-4 shadow-sm" id="pros-column">
          <div className="flex items-center justify-between pb-3 border-b border-indigo-50">
            <h4 className="font-sans font-bold text-emerald-600 flex items-center gap-2 text-base">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              PROS ({pros.length})
            </h4>
            <span className="text-xs text-indigo-400 font-mono">Weighted Benefit</span>
          </div>

          {/* Custom Pro Add Form */}
          <form onSubmit={handleAddPro} className="flex gap-2 mb-4" id="add-pro-form">
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                placeholder="Add custom pro..."
                value={newProText}
                onChange={(e) => setNewProText(e.target.value)}
                className="flex-1 text-sm bg-slate-50 border border-indigo-100 text-slate-800 placeholder-slate-400 px-3 py-1.5 rounded-lg focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
              />
              <select
                value={newProCategory}
                onChange={(e) => setNewProCategory(e.target.value)}
                className="text-xs bg-slate-50 border border-indigo-100 text-slate-700 px-2 py-1.5 rounded-lg focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 p-1.5 rounded-lg transition-colors border border-emerald-200"
              title="Add Pro"
            >
              <Plus className="w-5 h-5" />
            </button>
          </form>

          {/* Pros List */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {pros.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                No pros added yet. Write one above!
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {pros.map((pro) => {
                  const isExpanded = expandedItems[pro.id];
                  return (
                    <motion.div
                      key={pro.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="bg-emerald-50/40 border border-emerald-100/80 rounded-xl p-3.5 space-y-2 hover:border-emerald-200 transition-all shadow-sm"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 cursor-pointer" onClick={() => toggleExpand(pro.id)}>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs bg-emerald-100 text-emerald-700 border border-emerald-200/50 px-2 py-0.5 rounded-md font-bold">
                              {pro.category}
                            </span>
                            <span className="font-sans font-bold text-indigo-950 text-sm">{pro.text}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleExpand(pro.id)}
                            className="text-indigo-400 hover:text-indigo-600 p-1 rounded transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDeleteItem(pro.id, true)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                            title="Delete Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Explanation - Collapsible */}
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-xs text-slate-650 bg-white/80 p-2.5 rounded-lg border border-indigo-100/50 mt-1"
                        >
                          <p className="leading-relaxed">{pro.explanation}</p>
                        </motion.div>
                      )}

                      {/* Slider Control for Weight */}
                      <div className="pt-2 flex items-center justify-between gap-4 border-t border-emerald-100/55">
                        <label className="text-[11px] font-mono text-indigo-500 flex items-center gap-1">
                          Importance Weight: <span className="text-emerald-600 font-bold">{pro.weight}</span>
                        </label>
                        <div className="flex-1 max-w-[140px] flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400 font-mono">1</span>
                          <input
                            type="range"
                            min="1"
                            max="5"
                            value={pro.weight}
                            onChange={(e) => handleWeightChange(pro.id, true, parseInt(e.target.value))}
                            className="w-full h-1 bg-indigo-100/80 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                          />
                          <span className="text-[10px] text-slate-400 font-mono">5</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* CONS COLUMN */}
        <div className="bg-white border border-indigo-100 rounded-3xl p-5 space-y-4 shadow-sm" id="cons-column">
          <div className="flex items-center justify-between pb-3 border-b border-indigo-50">
            <h4 className="font-sans font-bold text-rose-600 flex items-center gap-2 text-base">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              CONS ({cons.length})
            </h4>
            <span className="text-xs text-indigo-400 font-mono">Weighted Risk</span>
          </div>

          {/* Custom Con Add Form */}
          <form onSubmit={handleAddCon} className="flex gap-2 mb-4" id="add-con-form">
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                placeholder="Add custom con..."
                value={newConText}
                onChange={(e) => setNewConText(e.target.value)}
                className="flex-1 text-sm bg-slate-50 border border-indigo-100 text-slate-800 placeholder-slate-400 px-3 py-1.5 rounded-lg focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
              />
              <select
                value={newConCategory}
                onChange={(e) => setNewConCategory(e.target.value)}
                className="text-xs bg-slate-50 border border-indigo-100 text-slate-700 px-2 py-1.5 rounded-lg focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="bg-rose-50 hover:bg-rose-100 text-rose-600 p-1.5 rounded-lg transition-colors border border-rose-200"
              title="Add Con"
            >
              <Plus className="w-5 h-5" />
            </button>
          </form>

          {/* Cons List */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {cons.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                No cons added yet. Write one above!
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {cons.map((con) => {
                  const isExpanded = expandedItems[con.id];
                  return (
                    <motion.div
                      key={con.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="bg-rose-50/40 border border-rose-100/80 rounded-xl p-3.5 space-y-2 hover:border-rose-200 transition-all shadow-sm"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 cursor-pointer" onClick={() => toggleExpand(con.id)}>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs bg-rose-100 text-rose-700 border border-rose-200/50 px-2 py-0.5 rounded-md font-bold">
                              {con.category}
                            </span>
                            <span className="font-sans font-bold text-indigo-950 text-sm">{con.text}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleExpand(con.id)}
                            className="text-indigo-400 hover:text-indigo-600 p-1 rounded transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDeleteItem(con.id, false)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                            title="Delete Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Explanation - Collapsible */}
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-xs text-slate-650 bg-white/80 p-2.5 rounded-lg border border-indigo-100/50 mt-1"
                        >
                          <p className="leading-relaxed">{con.explanation}</p>
                        </motion.div>
                      )}

                      {/* Slider Control for Weight */}
                      <div className="pt-2 flex items-center justify-between gap-4 border-t border-rose-100/55">
                        <label className="text-[11px] font-mono text-indigo-500 flex items-center gap-1">
                          Risk Penalty: <span className="text-rose-600 font-bold">{con.weight}</span>
                        </label>
                        <div className="flex-1 max-w-[140px] flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400 font-mono">1</span>
                          <input
                            type="range"
                            min="1"
                            max="5"
                            value={con.weight}
                            onChange={(e) => handleWeightChange(con.id, false, parseInt(e.target.value))}
                            className="w-full h-1 bg-indigo-100/80 rounded-lg appearance-none cursor-pointer accent-rose-500"
                          />
                          <span className="text-[10px] text-slate-400 font-mono">5</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
