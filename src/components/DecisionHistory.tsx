/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { History, Trash2, Calendar, Scale, Award, ShieldAlert, ArrowRight } from "lucide-react";
import { DecisionHistoryItem } from "../types";

interface DecisionHistoryProps {
  history: DecisionHistoryItem[];
  onLoadItem: (item: DecisionHistoryItem) => void;
  onDeleteItem: (id: string) => void;
  onClearHistory: () => void;
}

export default function DecisionHistory({
  history,
  onLoadItem,
  onDeleteItem,
  onClearHistory,
}: DecisionHistoryProps) {
  
  // Format timestamp helper
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const getBadgeClass = (type: string) => {
    switch (type) {
      case "pros-cons":
        return "bg-emerald-100 text-emerald-800 border border-emerald-200";
      case "comparison":
        return "bg-indigo-100 text-indigo-800 border border-indigo-200";
      case "swot":
        return "bg-amber-100 text-amber-800 border border-amber-200";
      default:
        return "bg-slate-100 text-slate-700 border border-slate-200";
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "pros-cons":
        return <Scale className="w-3.5 h-3.5 text-emerald-600" />;
      case "comparison":
        return <Award className="w-3.5 h-3.5 text-indigo-600" />;
      case "swot":
        return <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <History className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="bg-white border border-indigo-100 rounded-3xl p-5 space-y-4 shadow-sm" id="decision-history-panel">
      <div className="flex justify-between items-center pb-2 border-b border-indigo-50">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-600" />
          <h3 className="font-sans font-bold text-base text-indigo-900">Decision Vault</h3>
        </div>
        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="text-[11px] font-mono text-indigo-500 hover:text-rose-600 hover:bg-rose-50 transition-colors bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100/40 font-bold"
          >
            Clear Vault
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-xs font-medium">
          Your decision history vault is currently empty. Analyze a decision to save it here!
        </div>
      ) : (
        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
          {history.map((item) => (
            <div
              key={item.id}
              className="bg-slate-50 border border-indigo-50 hover:border-indigo-150 rounded-xl p-3.5 hover:bg-white transition-all group flex flex-col justify-between gap-2 shadow-xs"
            >
              <div className="space-y-1.5">
                <div className="flex justify-between items-center gap-2">
                  <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 capitalize ${getBadgeClass(item.type)}`}>
                    {getIcon(item.type)}
                    {item.type.replace("-", " ")}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(item.timestamp)}
                  </span>
                </div>
                
                <h4 className="font-sans font-bold text-indigo-950 text-xs leading-relaxed line-clamp-2">
                  {item.decision}
                </h4>
              </div>

              <div className="flex items-center justify-between border-t border-indigo-100/30 pt-2">
                <button
                  onClick={() => onLoadItem(item)}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors group-hover:translate-x-0.5"
                >
                  Retrieve Analysis <ArrowRight className="w-3 h-3 text-indigo-500" />
                </button>
                <button
                  onClick={() => onDeleteItem(item.id)}
                  className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                  title="Delete Item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
