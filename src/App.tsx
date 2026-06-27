/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Scale, 
  Sparkles, 
  Share2, 
  Bookmark, 
  Clock, 
  Plus, 
  X, 
  ChevronRight, 
  AlertCircle, 
  Check, 
  Copy, 
  Brain, 
  ArrowLeft, 
  RotateCcw,
  Zap,
  Printer
} from "lucide-react";

import { 
  AnalysisType, 
  ProsConsAnalysis, 
  ComparisonAnalysis, 
  SwotAnalysis, 
  DecisionHistoryItem 
} from "./types";

import ProsConsView from "./components/ProsConsView";
import ComparisonView from "./components/ComparisonView";
import SwotView from "./components/SwotView";
import DecisionHistory from "./components/DecisionHistory";
import DecisionConsultant from "./components/DecisionConsultant";

const PRESETS = [
  {
    title: "Career Growth",
    decision: "Accept new job offer vs. stay in my current role",
    type: "pros-cons" as const,
    context: "The new job offers 15% higher salary and a new technology stack but requires a longer commute (45 mins). My current job is stable with good team members but limited promotional opportunities."
  },
  {
    title: "Tech Comparison",
    decision: "Which cloud infrastructure platform should we build on?",
    type: "comparison" as const,
    options: ["AWS", "Google Cloud", "Vercel"],
    context: "We are a startup of 3 engineers. We need to deploy quickly, but also require high machine learning support and database scaling next year."
  },
  {
    title: "Business Pivot",
    decision: "Should we pivot our e-commerce business to a subscription-only model?",
    type: "swot" as const,
    context: "Current transaction sales are steady but client acquisition costs are rising. We have excellent customer retention on our flagship gourmet coffee products."
  },
  {
    title: "Lifestyle Choice",
    decision: "Buy an Electric Vehicle (EV) vs. continue renting traditional cars",
    type: "comparison" as const,
    options: ["Buy Electric Vehicle", "Renting / Zipcar", "Buy Plug-in Hybrid"],
    context: "I live in a city apartment without a dedicated parking/charging spot, but I commute 35 miles daily on average."
  }
];

const LOADING_THOUGHTS = [
  "Consulting the Tiebreaker algorithms...",
  "Weighing short-term friction against long-term benefits...",
  "Synthesizing prospective financial and emotional trade-offs...",
  "Sifting through rational factors and cognitive biases...",
  "Slicing opportunity cost vectors...",
  "Formulating a high-conviction decision blueprint...",
  "Finalizing strategic recommendations..."
];

export default function App() {
  // Input fields
  const [decision, setDecision] = useState("");
  const [type, setType] = useState<AnalysisType>("pros-cons");
  const [context, setContext] = useState("");
  const [options, setOptions] = useState<string[]>(["Option A", "Option B"]);
  const [newOptionInput, setNewOptionInput] = useState("");

  // UI States
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [activeAnalysis, setActiveAnalysis] = useState<DecisionHistoryItem | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  
  // LocalStorage History
  const [history, setHistory] = useState<DecisionHistoryItem[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("tiebreaker_history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history from localStorage", e);
      }
    }
  }, []);

  // Cycle loading thoughts
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < LOADING_THOUGHTS.length - 1 ? prev + 1 : prev));
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Handle Preset selection
  const selectPreset = (preset: typeof PRESETS[number]) => {
    setDecision(preset.decision);
    setType(preset.type);
    setContext(preset.context);
    if ("options" in preset) {
      setOptions(preset.options);
    } else {
      setOptions(["Option A", "Option B"]);
    }
    setError(null);
  };

  // Add Option helper
  const addOption = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOpt = newOptionInput.trim();
    if (cleanOpt && !options.includes(cleanOpt)) {
      if (options.length >= 4) {
        setError("To keep comparisons neat, a maximum of 4 options is recommended.");
        return;
      }
      setOptions([...options, cleanOpt]);
      setNewOptionInput("");
      setError(null);
    }
  };

  // Remove Option helper
  const removeOption = (idx: number) => {
    if (options.length <= 2) {
      setError("At least two options are required for comparison.");
      return;
    }
    setOptions(options.filter((_, i) => i !== idx));
    setError(null);
  };

  // Start AI analysis
  const handleAnalyze = async () => {
    if (!decision.trim()) {
      setError("Please describe the decision you need to make.");
      return;
    }

    setLoading(true);
    setError(null);
    setSavedSuccess(false);

    try {
      const response = await fetch("/api/analyze-decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: decision.trim(),
          type,
          context: context.trim() || undefined,
          options: type === "comparison" ? options : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to parse API decision parameters.");
      }

      // Construct history item structure
      const newAnalysisItem: DecisionHistoryItem = {
        id: `decision-${Date.now()}`,
        timestamp: new Date().toISOString(),
        decision: decision.trim(),
        type,
        context: context.trim() || undefined,
        prosCons: type === "pros-cons" ? (data as ProsConsAnalysis) : undefined,
        comparison: type === "comparison" ? (data as ComparisonAnalysis) : undefined,
        swot: type === "swot" ? (data as SwotAnalysis) : undefined,
      };

      setActiveAnalysis(newAnalysisItem);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected network error occurred while breaking the tie.");
    } finally {
      setLoading(false);
    }
  };

  // Update dynamic weights/ratings changes on active analysis
  const handleActiveAnalysisUpdate = (updatedContent: any) => {
    if (!activeAnalysis) return;

    let updatedItem: DecisionHistoryItem = { ...activeAnalysis };
    if (activeAnalysis.type === "pros-cons") {
      updatedItem.prosCons = updatedContent as ProsConsAnalysis;
    } else if (activeAnalysis.type === "comparison") {
      updatedItem.comparison = updatedContent as ComparisonAnalysis;
    } else if (activeAnalysis.type === "swot") {
      updatedItem.swot = updatedContent as SwotAnalysis;
    }

    setActiveAnalysis(updatedItem);
  };

  // Save current active analysis to history
  const handleSaveToHistory = () => {
    if (!activeAnalysis) return;

    // Check if already exists, update or append
    let newHistory = [...history];
    const index = newHistory.findIndex((item) => item.id === activeAnalysis.id);

    if (index > -1) {
      newHistory[index] = activeAnalysis;
    } else {
      newHistory = [activeAnalysis, ...newHistory];
    }

    setHistory(newHistory);
    localStorage.setItem("tiebreaker_history", JSON.stringify(newHistory));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Delete decision from history
  const handleDeleteHistoryItem = (id: string) => {
    const newHistory = history.filter((item) => item.id !== id);
    setHistory(newHistory);
    localStorage.setItem("tiebreaker_history", JSON.stringify(newHistory));
    if (activeAnalysis && activeAnalysis.id === id) {
      setActiveAnalysis(null);
    }
  };

  // Load a history item
  const handleLoadHistoryItem = (item: DecisionHistoryItem) => {
    setActiveAnalysis(item);
    setDecision(item.decision);
    setType(item.type);
    setContext(item.context || "");
    if (item.type === "comparison" && item.comparison) {
      setOptions(item.comparison.options);
    }
    // Scroll to visualization container
    setTimeout(() => {
      document.getElementById("analysis-display-anchor")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Clear all history
  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to permanently clear your Decision Vault? This cannot be undone.")) {
      setHistory([]);
      localStorage.removeItem("tiebreaker_history");
      setActiveAnalysis(null);
    }
  };

  // Copy Summary formatted as clean Markdown
  const handleCopySummary = () => {
    if (!activeAnalysis) return;

    let text = "";
    if (activeAnalysis.type === "pros-cons" && activeAnalysis.prosCons) {
      const { pros, cons, verdict, confidenceScore, tiebreakerTip } = activeAnalysis.prosCons;
      text = `# The Tiebreaker: Pros & Cons Analysis\n\n`;
      text += `**Decision**: ${activeAnalysis.decision}\n`;
      if (activeAnalysis.context) text += `**Context**: ${activeAnalysis.context}\n`;
      text += `\n### ⚖️ Verdict\n${verdict}\n\n`;
      text += `**Confidence Score**: ${confidenceScore}%\n`;
      text += `**Tiebreaker Strategy**: ${tiebreakerTip}\n\n`;
      text += `### 🟢 Key Pros:\n`;
      pros.forEach((p) => { text += `- **${p.text}** (Importance: ${p.weight}/5) - _${p.explanation}_\n`; });
      text += `\n### 🔴 Key Cons:\n`;
      cons.forEach((c) => { text += `- **${c.text}** (Risk Penalty: ${c.weight}/5) - _${c.explanation}_\n`; });
    } else if (activeAnalysis.type === "comparison" && activeAnalysis.comparison) {
      const { options, criteria, verdict, confidenceScore, tiebreakerTip } = activeAnalysis.comparison;
      text = `# The Tiebreaker: Side-By-Side Comparison Matrix\n\n`;
      text += `**Decision**: ${activeAnalysis.decision}\n\n`;
      text += `### 🏆 Verdict\n${verdict}\n\n`;
      text += `**Confidence Score**: ${confidenceScore}%\n`;
      text += `**Strategy**: ${tiebreakerTip}\n\n`;
      text += `### 📊 Criterion matrix:\n`;
      criteria.forEach((crit) => {
        text += `\n**${crit.name}** (Criterion Importance: ${crit.weight}/5) - _${crit.description}_\n`;
        crit.evaluations.forEach((ev) => {
          text += `  - **${ev.option}**: Rating ${ev.rating}/10 - _${ev.details}_\n`;
        });
      });
    } else if (activeAnalysis.type === "swot" && activeAnalysis.swot) {
      const { strengths, weaknesses, opportunities, threats, verdict, confidenceScore, tiebreakerTip } = activeAnalysis.swot;
      text = `# The Tiebreaker: SWOT Strategic Analysis\n\n`;
      text += `**Strategic Venture**: ${activeAnalysis.decision}\n\n`;
      text += `### 🔍 Strategic Verdict\n${verdict}\n\n`;
      text += `**Attractiveness Rating**: ${confidenceScore}/100\n`;
      text += `**Tactical Tip**: ${tiebreakerTip}\n\n`;
      text += `### 💪 Strengths (Internal):\n`;
      strengths.forEach((s) => { text += `- **${s.point}** (${s.potentialImpact} Impact) - _${s.explanation}_\n`; });
      text += `\n### ⚠️ Weaknesses (Internal):\n`;
      weaknesses.forEach((w) => { text += `- **${w.point}** (${w.potentialImpact} Impact) - _${w.explanation}_\n`; });
      text += `\n### 📈 Opportunities (External):\n`;
      opportunities.forEach((o) => { text += `- **${o.point}** (${o.potentialImpact} Impact) - _${o.explanation}_\n`; });
      text += `\n### 💀 Threats (External):\n`;
      threats.forEach((t) => { text += `- **${t.point}** (${t.potentialImpact} Impact) - _${t.explanation}_\n`; });
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate and download a high-fidelity standalone HTML report representing the current decision analysis
  const handleDownloadHTMLReport = () => {
    if (!activeAnalysis) return;

    const decisionName = activeAnalysis.decision;
    let title = "";
    let contentHtml = "";
    const dateFormatted = new Date(activeAnalysis.timestamp || Date.now()).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    if (activeAnalysis.type === "pros-cons" && activeAnalysis.prosCons) {
      const { pros, cons, verdict, confidenceScore, tiebreakerTip } = activeAnalysis.prosCons;
      title = "Pros & Cons Report: " + decisionName;

      let tipHtml = "";
      if (tiebreakerTip) {
        tipHtml = `
        <div class="tip-box">
          <span class="tip-title">💡 Strategic Tiebreaker Action Plan:</span>
          <p class="tip-text">${tiebreakerTip}</p>
        </div>`;
      }

      const prosListItems = pros.map(p => `
        <li class="item-card border-emerald">
          <div class="item-header">
            <span class="item-title text-emerald">${p.text}</span>
            <span class="badge badge-emerald">Importance: ${p.weight}/5</span>
          </div>
          <p class="item-desc">${p.explanation}</p>
        </li>
      `).join('');

      const consListItems = cons.map(c => `
        <li class="item-card border-rose">
          <div class="item-header">
            <span class="item-title text-rose">${c.text}</span>
            <span class="badge badge-rose">Severity/Risk: ${c.weight}/5</span>
          </div>
          <p class="item-desc">${c.explanation}</p>
        </li>
      `).join('');

      contentHtml = `
        <div class="section-title">⚖️ Framework Model: Pros & Cons Analysis</div>
        
        <div class="verdict-box">
          <div class="verdict-badge">🏆 THE TIEBREAKER VERDICT</div>
          <p class="verdict-text">${verdict}</p>
          <div class="confidence-indicator">
            <span class="confidence-label">Confidence Score:</span>
            <span class="confidence-value">${confidenceScore}%</span>
          </div>
          ${tipHtml}
        </div>

        <div class="grid-2">
          <div>
            <h3 class="column-header text-emerald">🟢 Core Advantages (Pros)</h3>
            <ul class="item-list">
              ${prosListItems}
            </ul>
          </div>
          <div>
            <h3 class="column-header text-rose">🔴 Core Disadvantages (Cons)</h3>
            <ul class="item-list">
              ${consListItems}
            </ul>
          </div>
        </div>
      `;
    } else if (activeAnalysis.type === "comparison" && activeAnalysis.comparison) {
      const { options: compareOptions, criteria, verdict, confidenceScore, tiebreakerTip } = activeAnalysis.comparison;
      title = "Side-By-Side Comparison Matrix: " + decisionName;

      let tipHtml = "";
      if (tiebreakerTip) {
        tipHtml = `
        <div class="tip-box">
          <span class="tip-title">💡 Strategic Tiebreaker Action Plan:</span>
          <p class="tip-text">${tiebreakerTip}</p>
        </div>`;
      }

      const headersHtml = compareOptions.map(opt => `<th>${opt}</th>`).join('');
      const rowsHtml = criteria.map(crit => {
        const evaluationsHtml = compareOptions.map(opt => {
          const ev = crit.evaluations.find(e => e.option === opt) || { rating: 0, details: 'N/A' };
          return `
            <td>
              <div class="rating-badge">${ev.rating}/10</div>
              <div class="rating-details">${ev.details}</div>
            </td>
          `;
        }).join('');

        return `
          <tr>
            <td>
              <div class="criterion-name">${crit.name}</div>
              <div class="criterion-desc">${crit.description}</div>
            </td>
            <td class="text-center font-bold">${crit.weight}/5</td>
            ${evaluationsHtml}
          </tr>
        `;
      }).join('');

      contentHtml = `
        <div class="section-title">📊 Framework Model: Side-By-Side Comparison Matrix</div>
        
        <div class="verdict-box">
          <div class="verdict-badge">🏆 THE TIEBREAKER VERDICT</div>
          <p class="verdict-text">${verdict}</p>
          <div class="confidence-indicator">
            <span class="confidence-label">Advantage Index Score:</span>
            <span class="confidence-value">${confidenceScore}%</span>
          </div>
          ${tipHtml}
        </div>

        <h3 class="column-header">📋 Detailed Comparison Matrix</h3>
        <table class="matrix-table">
          <thead>
            <tr>
              <th>Evaluation Criteria</th>
              <th>Weight</th>
              ${headersHtml}
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      `;
    } else if (activeAnalysis.type === "swot" && activeAnalysis.swot) {
      const { strengths, weaknesses, opportunities, threats, verdict, confidenceScore, tiebreakerTip } = activeAnalysis.swot;
      title = "SWOT Strategic Report: " + decisionName;

      let tipHtml = "";
      if (tiebreakerTip) {
        tipHtml = `
        <div class="tip-box">
          <span class="tip-title">💡 Strategic Tiebreaker Action Plan:</span>
          <p class="tip-text">${tiebreakerTip}</p>
        </div>`;
      }

      const strengthsHtml = strengths.map(s => `
        <li class="swot-item">
          <div class="swot-item-header">
            <span class="swot-item-title font-bold text-emerald">${s.point}</span>
            <span class="badge badge-emerald">${s.potentialImpact} Impact</span>
          </div>
          <p class="swot-item-desc">${s.explanation}</p>
        </li>
      `).join('');

      const weaknessesHtml = weaknesses.map(w => `
        <li class="swot-item">
          <div class="swot-item-header">
            <span class="swot-item-title font-bold text-amber">${w.point}</span>
            <span class="badge badge-amber">${w.potentialImpact} Impact</span>
          </div>
          <p class="swot-item-desc">${w.explanation}</p>
        </li>
      `).join('');

      const opportunitiesHtml = opportunities.map(o => `
        <li class="swot-item">
          <div class="swot-item-header">
            <span class="swot-item-title font-bold text-indigo">${o.point}</span>
            <span class="badge badge-indigo">${o.potentialImpact} Impact</span>
          </div>
          <p class="swot-item-desc">${o.explanation}</p>
        </li>
      `).join('');

      const threatsHtml = threats.map(t => `
        <li class="swot-item">
          <div class="swot-item-header">
            <span class="swot-item-title font-bold text-rose">${t.point}</span>
            <span class="badge badge-rose">${t.potentialImpact} Impact</span>
          </div>
          <p class="swot-item-desc">${t.explanation}</p>
        </li>
      `).join('');

      contentHtml = `
        <div class="section-title">🔍 Framework Model: SWOT Strategic Matrix Analysis</div>
        
        <div class="verdict-box">
          <div class="verdict-badge">🏆 THE TIEBREAKER VERDICT</div>
          <p class="verdict-text">${verdict}</p>
          <div class="confidence-indicator">
            <span class="confidence-label">Strategic Viability Score:</span>
            <span class="confidence-value">${confidenceScore}/100</span>
          </div>
          ${tipHtml}
        </div>

        <div class="swot-grid">
          <div class="swot-quadrant card-s">
            <div class="quadrant-title text-emerald">💪 Strengths (Internal Assets)</div>
            <ul class="swot-list">
              ${strengthsHtml}
            </ul>
          </div>

          <div class="swot-quadrant card-w">
            <div class="quadrant-title text-amber">⚠️ Weaknesses (Internal Gaps)</div>
            <ul class="swot-list">
              ${weaknessesHtml}
            </ul>
          </div>

          <div class="swot-quadrant card-o">
            <div class="quadrant-title text-indigo">📈 Opportunities (External Catalysts)</div>
            <ul class="swot-list">
              ${opportunitiesHtml}
            </ul>
          </div>

          <div class="swot-quadrant card-t">
            <div class="quadrant-title text-rose">💀 Threats (External Risks)</div>
            <ul class="swot-list">
              ${threatsHtml}
            </ul>
          </div>
        </div>
      `;
    }

    const viabilityScore = activeAnalysis.type === "swot"
      ? (activeAnalysis.swot?.confidenceScore || 0)
      : activeAnalysis.type === "comparison"
        ? (activeAnalysis.comparison?.confidenceScore || 0)
        : (activeAnalysis.prosCons?.confidenceScore || 0);

    const contextHtmlSection = activeAnalysis.context ? `
    <div class="section-title">Context & Situation</div>
    <div class="context-box">${activeAnalysis.context}</div>
    ` : '';

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #4f46e5;
      --primary-dark: #3730a3;
      --indigo: #4338ca;
      --emerald: #059669;
      --rose: #dc2626;
      --amber: #d97706;
      --slate-800: #1e293b;
      --slate-600: #475569;
      --slate-200: #e2e8f0;
      --slate-50: #f8fafc;
    }
    
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      color: var(--slate-800);
      background-color: #fafbfd;
      margin: 0;
      padding: 40px 20px;
      line-height: 1.5;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
      padding: 40px;
      border-radius: 24px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
      border: 1px solid var(--slate-200);
    }

    .print-controls {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-bottom: 30px;
    }

    .btn {
      font-family: inherit;
      font-size: 13px;
      font-weight: 600;
      padding: 10px 18px;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .btn-primary {
      background-color: var(--primary);
      color: white;
    }

    .btn-primary:hover {
      background-color: var(--primary-dark);
    }

    .btn-outline {
      background-color: white;
      color: var(--slate-600);
      border: 1px solid var(--slate-200);
    }

    .btn-outline:hover {
      background-color: var(--slate-50);
      border-color: var(--slate-600);
    }

    header {
      border-bottom: 2px solid var(--slate-200);
      padding-bottom: 24px;
      margin-bottom: 30px;
      position: relative;
    }

    .header-logo {
      font-weight: 900;
      color: var(--indigo);
      font-size: 11px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-bottom: 8px;
    }

    h1 {
      font-size: 28px;
      font-weight: 900;
      color: #0f172a;
      margin: 0 0 10px 0;
      letter-spacing: -0.025em;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      background-color: var(--slate-50);
      padding: 16px 20px;
      border-radius: 16px;
      border: 1px solid var(--slate-200);
      margin-top: 15px;
    }

    .meta-item {
      font-size: 12px;
    }

    .meta-label {
      color: var(--slate-600);
      font-weight: 600;
      margin-right: 4px;
    }

    .meta-value {
      font-weight: 700;
      color: #0f172a;
    }

    .section-title {
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--slate-600);
      margin-top: 40px;
      margin-bottom: 15px;
      border-bottom: 1px solid var(--slate-200);
      padding-bottom: 8px;
    }

    .context-box {
      font-size: 14px;
      color: var(--slate-600);
      background: #f1f5f9;
      padding: 16px;
      border-radius: 12px;
      margin-bottom: 30px;
      border-left: 4px solid var(--slate-600);
    }

    .verdict-box {
      background: linear-gradient(135deg, #312e81, #1e1b4b);
      color: white;
      border-radius: 20px;
      padding: 24px;
      margin-bottom: 35px;
      box-shadow: 0 10px 30px rgba(79, 70, 229, 0.15);
    }

    .verdict-badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.08em;
      background: rgba(255, 255, 255, 0.15);
      padding: 4px 10px;
      border-radius: 6px;
      margin-bottom: 12px;
    }

    .verdict-text {
      font-size: 15px;
      font-weight: 600;
      line-height: 1.6;
      margin: 0 0 15px 0;
      font-style: italic;
    }

    .confidence-indicator {
      display: flex;
      align-items: center;
      gap: 10px;
      border-top: 1px solid rgba(255, 255, 255, 0.15);
      padding-top: 15px;
      margin-bottom: 15px;
    }

    .confidence-label {
      font-size: 12px;
      color: #c7d2fe;
      font-weight: 500;
    }

    .confidence-value {
      font-size: 18px;
      font-weight: 900;
      color: #38bdf8;
    }

    .tip-box {
      background: rgba(255, 255, 255, 0.07);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 12px;
      padding: 16px;
      margin-top: 15px;
    }

    .tip-title {
      display: block;
      font-size: 11px;
      font-weight: 800;
      color: #fde047;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .tip-text {
      font-size: 12px;
      color: #e0e7ff;
      margin: 0;
      line-height: 1.5;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
      margin-top: 25px;
    }

    .column-header {
      font-size: 14px;
      font-weight: 800;
      margin-top: 0;
      margin-bottom: 15px;
      padding-bottom: 6px;
      border-bottom: 2px solid var(--slate-200);
    }

    .text-emerald { color: var(--emerald); }
    .text-rose { color: var(--rose); }
    .text-amber { color: var(--amber); }
    .text-indigo { color: var(--indigo); }

    .border-emerald { border-left: 4px solid var(--emerald) !important; }
    .border-rose { border-left: 4px solid var(--rose) !important; }

    .item-list {
      list-style-type: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .item-card {
      background: white;
      border: 1px solid var(--slate-200);
      padding: 16px;
      border-radius: 12px;
    }

    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      gap: 8px;
    }

    .item-title {
      font-size: 13px;
      font-weight: 700;
    }

    .badge {
      font-size: 9px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 9999px;
      white-space: nowrap;
    }

    .badge-emerald { background-color: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
    .badge-rose { background-color: #fff1f2; color: #b91c1c; border: 1px solid #fecdd3; }
    .badge-amber { background-color: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
    .badge-indigo { background-color: #e0e7ff; color: #4338ca; border: 1px solid #c7d2fe; }

    .item-desc {
      font-size: 12px;
      color: var(--slate-600);
      margin: 0;
    }

    /* Comparison matrix tables styling */
    .matrix-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
      font-size: 12px;
    }

    .matrix-table th {
      background-color: var(--slate-50);
      color: var(--slate-800);
      font-weight: 700;
      text-align: left;
      padding: 14px;
      border-bottom: 2px solid var(--slate-200);
    }

    .matrix-table td {
      padding: 14px;
      border-bottom: 1px solid var(--slate-200);
      vertical-align: top;
    }

    .criterion-name {
      font-weight: 700;
      color: #0f172a;
      font-size: 13px;
      margin-bottom: 4px;
    }

    .criterion-desc {
      font-size: 11px;
      color: var(--slate-600);
    }

    .rating-badge {
      display: inline-block;
      font-weight: 800;
      color: var(--primary);
      background-color: #e0e7ff;
      border: 1px solid #c7d2fe;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      margin-bottom: 6px;
    }

    .rating-details {
      color: var(--slate-600);
      font-size: 11px;
      line-height: 1.4;
    }

    /* SWOT Matrix grid layout */
    .swot-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-top: 25px;
    }

    .swot-quadrant {
      padding: 20px;
      border-radius: 16px;
      border: 1px solid var(--slate-200);
    }

    .card-s { background-color: #f0fdf4; border: 1px solid #bbf7d0; }
    .card-w { background-color: #fffbeb; border: 1px solid #fef3c7; }
    .card-o { background-color: #e0e7ff; border: 1px solid #c7d2fe; }
    .card-t { background-color: #fef2f2; border: 1px solid #fee2e2; }

    .quadrant-title {
      font-size: 14px;
      font-weight: 800;
      margin-bottom: 15px;
      border-bottom: 1px solid rgba(0,0,0,0.06);
      padding-bottom: 8px;
    }

    .swot-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .swot-item {
      background: white;
      border: 1px solid rgba(0,0,0,0.05);
      border-radius: 10px;
      padding: 12px;
    }

    .swot-item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }

    .swot-item-title {
      font-size: 12px;
    }

    .swot-item-desc {
      font-size: 11px;
      color: var(--slate-600);
      margin: 0;
    }

    .text-center { text-align: center; }

    footer {
      margin-top: 50px;
      border-top: 1px solid var(--slate-200);
      padding-top: 20px;
      text-align: center;
      font-size: 11px;
      color: var(--slate-600);
    }

    @media print {
      body {
        background-color: white;
        padding: 0;
        margin: 0;
      }
      .container {
        border: none;
        box-shadow: none;
        padding: 0;
        max-width: 100%;
      }
      .print-controls {
        display: none !important;
      }
      .swot-grid {
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 15px !important;
      }
      .grid-2 {
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 15px !important;
      }
      .verdict-box {
        background: #f8fafc !important;
        color: #0f172a !important;
        border: 2px solid #cbd5e1 !important;
        box-shadow: none !important;
      }
      .verdict-text {
        color: #0f172a !important;
      }
      .verdict-badge {
        background: #e2e8f0 !important;
        color: #0f172a !important;
      }
      .confidence-label {
        color: #475569 !important;
      }
      .confidence-value {
        color: var(--indigo) !important;
      }
      .tip-box {
        background: #f1f5f9 !important;
        border-color: #cbd5e1 !important;
      }
      .tip-title {
        color: var(--amber) !important;
      }
      .tip-text {
        color: #1e293b !important;
      }
      .swot-quadrant, .item-card, .matrix-table th, .matrix-table td {
        page-break-inside: avoid !important;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="print-controls">
      <button class="btn btn-outline" onclick="window.close()">Close Preview</button>
      <button class="btn btn-primary" onclick="window.print()">Print This Page / Save PDF</button>
    </div>

    <header>
      <div class="header-logo">The Tiebreaker • Strategic Decision Document</div>
      <h1>${decisionName}</h1>
      <div class="meta-grid">
        <div class="meta-item"><span class="meta-label">Date Generated:</span><span class="meta-value">${dateFormatted}</span></div>
        <div class="meta-item"><span class="meta-label">Attractiveness Index:</span><span class="meta-value">${viabilityScore}%</span></div>
      </div>
    </header>

    ${contextHtmlSection}

    ${contentHtml}

    <footer>
      Generated dynamically by The Tiebreaker - Objective AI-Powered Decision Analyst.<br>
      Confidential Strategic Advisory Framework.
    </footer>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 400);
    }
  </script>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `The-Tiebreaker-Decision-${decisionName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-Report.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Reset the active view to enter a new decision
  const handleReset = () => {
    setActiveAnalysis(null);
    setDecision("");
    setContext("");
    setOptions(["Option A", "Option B"]);
    setError(null);
  };

  // Get Verdict display details
  const activeVerdict = activeAnalysis?.prosCons || activeAnalysis?.comparison || activeAnalysis?.swot;

  return (
    <div className="min-h-screen bg-[#f0f2fe] text-slate-800 flex flex-col antialiased">
      {/* HEADER BAR */}
      <header className="border-b border-indigo-100 bg-white/90 backdrop-blur-md sticky top-0 z-50 py-4 px-6 shadow-xs" id="app-header">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-md shadow-indigo-100/50 flex items-center justify-center">
              <Scale className="w-5.5 h-5.5 text-white" />
            </div>
            <div>
              <h1 className="font-sans font-black text-lg tracking-tight text-indigo-950">
                The Tiebreaker
              </h1>
              <p className="text-[11px] font-mono text-indigo-600 font-bold tracking-wider">
                Objective AI-Powered Decision Analyst
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1.5 font-bold">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Gemini Active
            </span>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6" id="main-content">
        {/* LEFT COLUMN: Input Form & Presets (Takes 7 columns on LG) */}
        <div className="lg:col-span-8 space-y-6" id="input-column">
          <AnimatePresence mode="wait">
            {!activeAnalysis ? (
              <motion.div
                key="input-form"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white border border-indigo-100 rounded-3xl p-6 space-y-6 shadow-sm"
              >
                {/* Intro Title */}
                <div>
                  <h2 className="font-sans font-black text-xl text-indigo-950 flex items-center gap-2">
                    <Brain className="w-5.5 h-5.5 text-indigo-600" />
                    State Your Dilemma
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Describe what you need to decide. Let the AI build an interactive evaluation canvas.
                  </p>
                </div>

                {/* Input Decision */}
                <div className="space-y-2">
                  <label className="block text-xs font-mono text-indigo-400 font-black uppercase tracking-widest">
                    1. The Decision Topic
                  </label>
                  <textarea
                    rows={2}
                    placeholder="E.g., Should I relocate from San Francisco to Chicago? Or comparing MacBook Pro vs Lenovo ThinkPad..."
                    value={decision}
                    onChange={(e) => setDecision(e.target.value)}
                    className="w-full text-sm bg-slate-50 border border-indigo-100 text-slate-850 placeholder-slate-400 rounded-xl p-3.5 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100/50 transition-all resize-none font-medium"
                  />
                </div>

                {/* Analysis Mode Selector */}
                <div className="space-y-2.5">
                  <label className="block text-xs font-mono text-indigo-400 font-black uppercase tracking-widest">
                    2. Choose Framework Model
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Pros/Cons */}
                    <button
                      type="button"
                      onClick={() => { setType("pros-cons"); setError(null); }}
                      className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between gap-3 ${
                        type === "pros-cons"
                          ? "bg-indigo-50/50 border-indigo-500 text-indigo-950 shadow-sm shadow-indigo-100"
                          : "bg-slate-50/60 border-indigo-100/70 text-slate-750 hover:border-indigo-300"
                      }`}
                    >
                      <div className="flex justify-between items-start w-full">
                        <Scale className={`w-5 h-5 ${type === "pros-cons" ? "text-indigo-600" : "text-indigo-450"}`} />
                        {type === "pros-cons" && <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />}
                      </div>
                      <div>
                        <span className="font-sans font-bold text-xs text-indigo-950 block">Pros & Cons List</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">Weigh pros vs cons with interactive sliders</span>
                      </div>
                    </button>

                    {/* Comparison Table */}
                    <button
                      type="button"
                      onClick={() => { setType("comparison"); setError(null); }}
                      className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between gap-3 ${
                        type === "comparison"
                          ? "bg-indigo-50/50 border-indigo-500 text-indigo-950 shadow-sm shadow-indigo-100"
                          : "bg-slate-50/60 border-indigo-100/70 text-slate-750 hover:border-indigo-300"
                      }`}
                    >
                      <div className="flex justify-between items-start w-full">
                        <Zap className={`w-5 h-5 ${type === "comparison" ? "text-indigo-600" : "text-indigo-450"}`} />
                        {type === "comparison" && <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />}
                      </div>
                      <div>
                        <span className="font-sans font-bold text-xs text-indigo-950 block">Comparison Matrix</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">Rank multiple options side-by-side</span>
                      </div>
                    </button>

                    {/* SWOT Analysis */}
                    <button
                      type="button"
                      onClick={() => { setType("swot"); setError(null); }}
                      className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between gap-3 ${
                        type === "swot"
                          ? "bg-indigo-50/50 border-indigo-500 text-indigo-950 shadow-sm shadow-indigo-100"
                          : "bg-slate-50/60 border-indigo-100/70 text-slate-750 hover:border-indigo-300"
                      }`}
                    >
                      <div className="flex justify-between items-start w-full">
                        <Brain className={`w-5 h-5 ${type === "swot" ? "text-indigo-600" : "text-indigo-450"}`} />
                        {type === "swot" && <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />}
                      </div>
                      <div>
                        <span className="font-sans font-bold text-xs text-indigo-950 block">SWOT Analysis</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">Evaluate Strengths, Weaknesses, Opportunities & Threats</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Options Input (Only shown for Comparison Mode) */}
                {type === "comparison" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-3"
                  >
                    <label className="block text-xs font-mono text-indigo-400 font-black uppercase tracking-widest">
                      Specify Options (2 to 4 options)
                    </label>
                    
                    {/* List of current options */}
                    <div className="flex flex-wrap gap-2">
                      {options.map((opt, idx) => (
                        <div key={opt} className="bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 text-xs font-bold text-indigo-700">
                          <span>{opt}</span>
                          <button
                            type="button"
                            onClick={() => removeOption(idx)}
                            className="text-indigo-400 hover:text-rose-600 rounded-full transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add option field */}
                    <form onSubmit={addOption} className="flex gap-2" id="add-option-element">
                      <input
                        type="text"
                        placeholder="Add option (e.g. Renting)..."
                        value={newOptionInput}
                        onChange={(e) => setNewOptionInput(e.target.value)}
                        className="flex-1 text-xs bg-slate-50 border border-indigo-100 text-slate-800 px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-400 focus:bg-white"
                      />
                      <button
                        type="submit"
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-2 rounded-lg border border-indigo-100 font-bold text-xs transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Option
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* Context (Optional Text Box) */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-mono text-indigo-400 font-black uppercase tracking-widest">
                      3. Personalized Context (Optional)
                    </label>
                    <span className="text-[10px] text-indigo-400 font-mono font-bold">Enables personalized advice</span>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="E.g., I have a budget constraint of $1,500, or I value working from home, or I hate rainy weather..."
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    className="w-full text-sm bg-slate-50 border border-indigo-100 text-slate-850 placeholder-slate-400 rounded-xl p-3 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100/50 transition-all resize-none font-medium"
                  />
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-700 rounded-xl p-4 flex gap-3 items-start text-xs" id="error-banner">
                    <AlertCircle className="w-5.5 h-5.5 shrink-0" />
                    <div>
                      <p className="font-bold">Oops! Something went wrong</p>
                      <p className="mt-1 opacity-90 leading-relaxed font-medium">{error}</p>
                    </div>
                  </div>
                )}

                {/* Action button */}
                <div className="pt-2">
                  <button
                    onClick={handleAnalyze}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-100/80"
                  >
                    <Sparkles className="w-4 h-4 fill-white animate-pulse" /> Break the Tie
                  </button>
                </div>

                {/* Presets and ideas */}
                <div className="space-y-3 pt-4 border-t border-indigo-50" id="presets-container">
                  <span className="block text-[11px] font-mono text-indigo-400 font-black uppercase tracking-widest">
                    Need Inspiration? Pick a Dilemma
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {PRESETS.map((preset) => (
                      <button
                        key={preset.title}
                        type="button"
                        onClick={() => selectPreset(preset)}
                        className="p-3 bg-slate-50/70 border border-indigo-100/60 rounded-xl text-left hover:border-indigo-300 hover:bg-white transition-all group flex flex-col justify-between gap-2 shadow-xs"
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="text-[10px] font-bold font-mono text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-md border border-indigo-200/50">
                            {preset.title}
                          </span>
                          <span className="text-[10px] text-indigo-400 uppercase font-bold tracking-wider font-mono">
                            {preset.type.replace("-", " ")}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 font-sans font-semibold line-clamp-1 group-hover:text-indigo-900 transition-colors mt-1">
                          {preset.decision}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              /* ACTIVE DECISION CANVAS DISPLAY */
              <motion.div
                key="active-canvas"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-6"
                id="analysis-display-anchor"
              >
                {/* Back button header */}
                <div className="flex items-center justify-between bg-white border border-indigo-100 rounded-3xl p-3 shadow-sm">
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 transition-colors font-bold"
                  >
                    <ArrowLeft className="w-4 h-4" /> Start New Dilemma
                  </button>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAnalyze}
                      className="text-xs text-indigo-700 hover:text-indigo-800 font-bold flex items-center gap-1 transition-colors bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100/60"
                      title="Re-run calculation with fresh AI parameters"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Re-Analyze
                    </button>
                  </div>
                </div>

                {/* Heading Card */}
                <div className="bg-white border border-indigo-100 rounded-3xl p-5 shadow-sm">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="text-[10px] font-bold font-mono text-indigo-700 bg-indigo-100 border border-indigo-200/50 px-2.5 py-0.5 rounded-full capitalize">
                        {activeAnalysis.type.replace("-", " ")} framework
                      </span>
                      <h2 className="font-sans font-black text-lg text-indigo-950 mt-2">
                        {activeAnalysis.decision}
                      </h2>
                      {activeAnalysis.context && (
                        <p className="text-xs text-slate-650 italic mt-2 leading-relaxed bg-indigo-50/40 p-2.5 border-l-2 border-indigo-500 rounded-r-xl">
                          Context: &ldquo;{activeAnalysis.context}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* THE VISUALIZER CANVAS (No nested card border to keep layout super neat) */}
                <div className="space-y-6">
                  {activeAnalysis.type === "pros-cons" && activeAnalysis.prosCons && (
                    <ProsConsView
                      analysis={activeAnalysis.prosCons}
                      onUpdate={handleActiveAnalysisUpdate}
                    />
                  )}
                  {activeAnalysis.type === "comparison" && activeAnalysis.comparison && (
                    <ComparisonView
                      analysis={activeAnalysis.comparison}
                      onUpdate={handleActiveAnalysisUpdate}
                    />
                  )}
                  {activeAnalysis.type === "swot" && activeAnalysis.swot && (
                    <SwotView
                      analysis={activeAnalysis.swot}
                      onUpdate={handleActiveAnalysisUpdate}
                    />
                  )}
                </div>

                {/* VERDICT & THE TIEBREAKER OPINION PANEL */}
                {activeVerdict && (
                  <div className="bg-indigo-600 border border-indigo-500 text-white rounded-3xl p-6 shadow-lg shadow-indigo-200 relative overflow-hidden" id="verdict-opinion-panel">
                    {/* Glowing highlight sphere */}
                    <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 blur-[80px] pointer-events-none rounded-full" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                      
                      {/* Left: Score circle gauge (Takes 3 columns) */}
                      <div className="md:col-span-3 flex flex-col items-center justify-center text-center space-y-2">
                        <span className="text-[10px] font-mono text-indigo-200 uppercase tracking-wider font-bold">Confidence Level</span>
                        
                        <div className="relative w-28 h-28 flex items-center justify-center">
                          {/* Radial indicator SVG */}
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              className="stroke-indigo-700/60 fill-none"
                              strokeWidth="8"
                            />
                            <motion.circle
                              cx="50"
                              cy="50"
                              r="40"
                              className="stroke-white fill-none"
                              strokeWidth="8"
                              strokeDasharray="251.2"
                              initial={{ strokeDashoffset: 251.2 }}
                              animate={{ strokeDashoffset: 251.2 - (251.2 * activeVerdict.confidenceScore) / 100 }}
                              transition={{ duration: 1.2, ease: "easeOut" }}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute flex flex-col items-center justify-center">
                            <span className="text-xl font-sans font-black text-white">
                              {activeVerdict.confidenceScore}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Recommendation summary (Takes 9 columns) */}
                      <div className="md:col-span-9 space-y-4">
                        <div className="flex items-center gap-1.5 text-xs text-indigo-100 font-bold font-mono uppercase tracking-widest">
                          <Sparkles className="w-3.5 h-3.5 fill-white text-white" />
                          The Tiebreaker's Strategic Verdict
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-sm text-white leading-relaxed font-bold italic">
                            {activeVerdict.verdict}
                          </p>
                        </div>

                        {activeVerdict.tiebreakerTip && (
                          <div className="bg-indigo-700/50 border border-indigo-500/50 rounded-2xl p-4 flex gap-3 items-start text-xs">
                            <div className="bg-amber-400 text-indigo-950 p-1.5 rounded-lg shrink-0">
                              <Brain className="w-4 h-4" />
                            </div>
                            <div className="space-y-1">
                              <span className="font-bold text-amber-300 block font-sans">Tiebreaker Strategic Hack:</span>
                              <p className="text-indigo-100 leading-relaxed font-sans font-medium">{activeVerdict.tiebreakerTip}</p>
                            </div>
                          </div>
                        )}

                        {/* Action buttons bar */}
                        <div className="pt-2 flex flex-wrap gap-2.5 items-center">
                          <button
                            onClick={handleCopySummary}
                            className="bg-indigo-700/60 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-indigo-500/50 flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            {copied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-300" /> Copied Markdown
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" /> Copy Analysis Markdown
                              </>
                            )}
                          </button>

                          <button
                            onClick={handleSaveToHistory}
                            className="bg-white hover:bg-indigo-50 text-indigo-900 text-xs font-bold px-4 py-2.5 rounded-xl shadow flex items-center gap-1.5 transition-colors cursor-pointer border border-white"
                          >
                            {savedSuccess ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600 animate-pulse" /> Saved in Vault!
                              </>
                            ) : (
                              <>
                                <Bookmark className="w-3.5 h-3.5 fill-indigo-900" /> Save in Vault
                              </>
                            )}
                          </button>

                          <button
                            onClick={handleDownloadHTMLReport}
                            className="bg-indigo-700/60 hover:bg-indigo-700 text-indigo-100 text-xs font-semibold px-4 py-2.5 rounded-xl border border-indigo-500/50 flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Download high-fidelity printable executive document which triggers system PDF/Print dialogue immediately"
                          >
                            <Printer className="w-3.5 h-3.5" /> Export PDF / Print
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* THE INTERACTIVE TIEBREAKER SPECIALIST CONSULTANT */}
                <DecisionConsultant
                  decision={activeAnalysis.decision}
                  type={activeAnalysis.type}
                  activeAnalysis={activeAnalysis}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT COLUMN: Saved Decision History (Takes 4 columns on LG) */}
        <div className="lg:col-span-4 space-y-6" id="history-column">
          <DecisionHistory
            history={history}
            onLoadItem={handleLoadHistoryItem}
            onDeleteItem={handleDeleteHistoryItem}
            onClearHistory={handleClearHistory}
          />
          
          <div className="bg-indigo-50/55 border border-indigo-100 rounded-3xl p-5 space-y-3.5 shadow-xs" id="pro-tips-card">
            <h4 className="font-sans font-bold text-indigo-900 text-xs flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-indigo-600" /> Professional Decision Tip
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              <strong>Interactive Weighing:</strong> Once the AI completes your initial list, you can slide the weights of pros or cons up or down. If a factor is minor for you, drag it to 1. If it's a critical blocker, set it to 5. The total balance updates dynamically.
            </p>
          </div>
        </div>
      </main>

      {/* FULL-SCREEN LOADER POPUP */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#f0f2fe]/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center"
            id="full-screen-loader"
          >
            <div className="max-w-md w-full space-y-6">
              {/* Spinner animation */}
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
                <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 border-r-indigo-400 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Scale className="w-6 h-6 text-indigo-600 animate-pulse" />
                </div>
              </div>

              {/* Thoughts text */}
              <div className="space-y-2">
                <h3 className="font-sans font-black text-lg text-indigo-950">Analyzing Trade-offs</h3>
                <div className="h-6">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={loadingStep}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-xs font-mono text-indigo-600 font-bold"
                    >
                      {LOADING_THOUGHTS[loadingStep]}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>

              <p className="text-[11px] text-indigo-400 font-mono font-bold uppercase tracking-wider">
                Our AI model uses advanced weighting algorithms to prevent analysis paralysis.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
