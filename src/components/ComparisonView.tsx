/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Trash2, Award, Info, ChevronDown, ChevronUp, Star, Sliders, Sparkles } from "lucide-react";
import { ComparisonAnalysis, ComparisonCriterion, OptionEvaluation } from "../types";

interface ComparisonViewProps {
  analysis: ComparisonAnalysis;
  onUpdate: (updatedAnalysis: ComparisonAnalysis) => void;
}

export default function ComparisonView({ analysis, onUpdate }: ComparisonViewProps) {
  const { options, criteria, verdict, confidenceScore, tiebreakerTip } = analysis;
  const [expandedCriteria, setExpandedCriteria] = useState<Record<string, boolean>>({});
  
  // Custom criterion input state
  const [newCriterionName, setNewCriterionName] = useState("");
  const [newCriterionDesc, setNewCriterionDesc] = useState("");

  // Toggle details
  const toggleExpand = (id: string) => {
    setExpandedCriteria((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Adjust Criterion Weight
  const handleWeightChange = (id: string, newWeight: number) => {
    const updatedCriteria = criteria.map((crit) =>
      crit.id === id ? { ...crit, weight: newWeight } : crit
    );
    onUpdate({ ...analysis, criteria: updatedCriteria });
  };

  // Edit specific option score
  const handleRatingChange = (criterionId: string, optionName: string, newRating: number) => {
    const updatedCriteria = criteria.map((crit) => {
      if (crit.id === criterionId) {
        const updatedEvals = crit.evaluations.map((ev) =>
          ev.option === optionName ? { ...ev, rating: newRating } : ev
        );
        return { ...crit, evaluations: updatedEvals };
      }
      return crit;
    });
    onUpdate({ ...analysis, criteria: updatedCriteria });
  };

  // Delete Criterion
  const handleDeleteCriterion = (id: string) => {
    const updatedCriteria = criteria.filter((crit) => crit.id !== id);
    onUpdate({ ...analysis, criteria: updatedCriteria });
  };

  // Add Custom Criterion
  const handleAddCriterion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCriterionName.trim()) return;

    // Create starting evaluations for each option
    const evaluations: OptionEvaluation[] = options.map((opt) => ({
      option: opt,
      rating: 5, // Neutral starting rating
      details: "User-added custom evaluation rating.",
    }));

    const newCrit: ComparisonCriterion = {
      id: `custom-crit-${Date.now()}`,
      name: newCriterionName.trim(),
      description: newCriterionDesc.trim() || "User-defined comparison factor.",
      weight: 3,
      evaluations,
    };

    onUpdate({
      ...analysis,
      criteria: [...criteria, newCrit],
    });

    setNewCriterionName("");
    setNewCriterionDesc("");
  };

  // Dynamic Leaderboard scores calculation
  const leaderboard = useMemo(() => {
    const totalCritWeight = criteria.reduce((sum, crit) => sum + crit.weight, 0);

    if (totalCritWeight === 0) {
      return options.map((opt) => ({ option: opt, score: 0 }));
    }

    const scores = options.map((opt) => {
      let weightedSum = 0;
      criteria.forEach((crit) => {
        const evalItem = crit.evaluations.find((ev) => ev.option === opt);
        const rating = evalItem ? evalItem.rating : 5;
        weightedSum += rating * crit.weight;
      });
      const score = parseFloat((weightedSum / totalCritWeight).toFixed(2));
      return { option: opt, score };
    });

    // Sort descending by score
    return scores.sort((a, b) => b.score - a.score);
  }, [options, criteria]);

  const winner = leaderboard[0];

  return (
    <div className="space-y-8" id="comparison-visualizer">
      {/* 1. Scores Leaderboard */}
      <div className="bg-white border border-indigo-100 rounded-3xl p-6 shadow-sm" id="leaderboard-section">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <Award className="text-indigo-600 w-5.5 h-5.5" />
            <h3 className="font-sans font-bold text-lg text-indigo-900">Live Trade-Off Scoreboard</h3>
          </div>
          <span className="text-xs font-mono text-indigo-700 bg-indigo-50 border border-indigo-100/50 px-2.5 py-1 rounded-full">
            Scale 1 to 10
          </span>
        </div>

        {/* Leaderboard Progress Bars */}
        <div className="space-y-4">
          {leaderboard.map((item, idx) => {
            const isWinner = winner && item.score === winner.score && item.score > 0;
            const percentage = item.score * 10; // Convert 1-10 to 10-100%

            return (
              <div key={item.option} className="space-y-1.5" id={`leaderboard-item-${idx}`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className={`w-5.5 h-5.5 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                      idx === 0 
                        ? "bg-indigo-600 text-white shadow shadow-indigo-100" 
                        : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                    }`}>
                      {idx + 1}
                    </span>
                    <span className={`font-sans font-bold text-sm ${isWinner ? "text-indigo-900" : "text-slate-600"}`}>
                      {item.option}
                    </span>
                    {isWinner && (
                      <span className="text-[10px] bg-indigo-100/70 text-indigo-700 border border-indigo-200/50 px-1.5 py-0.5 rounded flex items-center gap-1 font-bold animate-pulse">
                        <Star className="w-2.5 h-2.5 fill-indigo-600 text-indigo-600" /> Winner
                      </span>
                    )}
                  </div>
                  <span className={`font-mono text-sm font-bold ${isWinner ? "text-indigo-600" : "text-slate-500"}`}>
                    {item.score} / 10
                  </span>
                </div>

                <div className="h-3 w-full bg-indigo-50 rounded-full overflow-hidden border border-indigo-100/50">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ type: "spring", stiffness: 60 }}
                    className={`h-full rounded-full ${
                      isWinner 
                        ? "bg-indigo-600" 
                        : "bg-slate-300"
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Side-By-Side Criteria Grid */}
      <div className="space-y-4" id="criteria-grid-section">
        <div className="flex items-center justify-between border-b border-indigo-50 pb-2">
          <h4 className="font-sans font-bold text-indigo-900 text-base flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-500" />
            Comparison Criteria ({criteria.length})
          </h4>
          <span className="text-xs text-indigo-400 font-mono">Adjust weights to recalculate scores</span>
        </div>

        {/* Add Custom Criterion Form */}
        <form onSubmit={handleAddCriterion} className="bg-white border border-indigo-100 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-end shadow-sm" id="add-criterion-form">
          <div className="flex-1 space-y-2 w-full">
            <label className="text-xs font-mono text-indigo-400">Add custom criterion</label>
            <input
              type="text"
              placeholder="Criterion Name (e.g., Flexibility, Scalability)..."
              value={newCriterionName}
              onChange={(e) => setNewCriterionName(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-indigo-100 text-slate-800 px-3 py-1.5 rounded-lg focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
            />
          </div>
          <div className="flex-[1.5] space-y-2 w-full">
            <input
              type="text"
              placeholder="Brief description (optional)..."
              value={newCriterionDesc}
              onChange={(e) => setNewCriterionDesc(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-indigo-100 text-slate-800 px-3 py-1.5 rounded-lg focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
            />
          </div>
          <button
            type="submit"
            className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </form>

        {/* Criteria List */}
        <div className="space-y-4">
          {criteria.length === 0 ? (
            <div className="bg-white border border-indigo-100 rounded-2xl py-12 text-center text-slate-400 text-sm">
              No criteria evaluated. Add a custom criterion above!
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {criteria.map((crit) => {
                const isExpanded = expandedCriteria[crit.id];
                return (
                  <motion.div
                    key={crit.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="bg-white border border-indigo-100 rounded-3xl p-5 space-y-4 hover:border-indigo-200 transition-all shadow-sm"
                  >
                    {/* Header Row */}
                    <div className="flex justify-between items-start gap-4 flex-wrap md:flex-nowrap">
                      <div className="flex-1 cursor-pointer" onClick={() => toggleExpand(crit.id)}>
                        <h5 className="font-sans font-bold text-indigo-900 text-sm flex items-center gap-1.5">
                          {crit.name}
                          <button type="button" className="text-indigo-400 hover:text-indigo-600">
                            <Info className="w-3.5 h-3.5" title={crit.description} />
                          </button>
                        </h5>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{crit.description}</p>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Criterion weight adjuster */}
                        <div className="flex items-center gap-2 bg-indigo-50/50 px-3 py-1.5 rounded-lg border border-indigo-100/50">
                          <span className="text-[10px] font-mono text-indigo-400">Weight:</span>
                          <span className="text-xs font-bold text-indigo-700">{crit.weight}</span>
                          <input
                            type="range"
                            min="1"
                            max="5"
                            value={crit.weight}
                            onChange={(e) => handleWeightChange(crit.id, parseInt(e.target.value))}
                            className="w-20 h-1 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                        </div>

                        {/* Expand/Delete Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleExpand(crit.id)}
                            className="text-indigo-400 hover:text-indigo-600 p-1.5 rounded-lg transition-colors bg-indigo-50"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDeleteCriterion(crit.id)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors bg-indigo-50"
                            title="Delete Criterion"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Evaluations Row (Side-by-side Options grid) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {crit.evaluations.map((ev) => {
                        const isWinningOption = winner && ev.option === winner.option;

                        return (
                          <div
                            key={ev.option}
                            className={`rounded-xl p-3.5 space-y-2 border transition-all ${
                              isWinningOption
                                ? "bg-indigo-50/40 border-indigo-200"
                                : "bg-slate-50/60 border-indigo-100/50"
                            }`}
                          >
                            {/* Option Header */}
                            <div className="flex justify-between items-center">
                              <span className={`text-xs font-bold ${isWinningOption ? "text-indigo-900" : "text-slate-500"}`}>
                                {ev.option}
                              </span>
                              <div className="flex items-center gap-1">
                                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                                  ev.rating >= 8 
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                                    : ev.rating >= 5 
                                    ? "bg-amber-100 text-amber-800 border border-amber-200" 
                                    : "bg-rose-100 text-rose-800 border border-rose-200"
                                }`}>
                                  Score: {ev.rating}
                                </span>
                              </div>
                            </div>

                            {/* Option comment */}
                            <p className="text-xs text-slate-600 font-sans leading-relaxed line-clamp-3">
                              {ev.details}
                            </p>

                            {/* Score Adjuster */}
                            <div className="pt-2 flex items-center gap-1 border-t border-indigo-100/60">
                              <span className="text-[10px] text-indigo-400 font-mono">Adjust:</span>
                              <input
                                type="range"
                                min="1"
                                max="10"
                                value={ev.rating}
                                onChange={(e) => handleRatingChange(crit.id, ev.option, parseInt(e.target.value))}
                                className="flex-1 h-1 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                              />
                              <span className="text-[10px] text-indigo-600 font-bold font-mono">{ev.rating}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
