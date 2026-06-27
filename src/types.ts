/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AnalysisType = "pros-cons" | "comparison" | "swot";

export interface ProConItem {
  id: string;
  text: string;
  explanation: string;
  weight: number; // User adjustable weight (1-5)
  category: string;
}

export interface ProsConsAnalysis {
  decision: string;
  context?: string;
  pros: ProConItem[];
  cons: ProConItem[];
  verdict: string;
  confidenceScore: number; // 0 to 100
  tiebreakerTip: string;
}

export interface OptionEvaluation {
  option: string;
  rating: number; // 1-10
  details: string;
}

export interface ComparisonCriterion {
  id: string;
  name: string;
  description: string;
  weight: number; // User adjustable weight (1-5)
  evaluations: OptionEvaluation[];
}

export interface ComparisonAnalysis {
  decision: string;
  context?: string;
  options: string[]; // List of options (e.g., ["Buy House", "Rent"])
  criteria: ComparisonCriterion[];
  verdict: string;
  confidenceScore: number;
  tiebreakerTip: string;
}

export interface SwotItem {
  id: string;
  point: string;
  explanation: string;
  potentialImpact: "High" | "Medium" | "Low";
}

export interface SwotAnalysis {
  decision: string;
  context?: string;
  strengths: SwotItem[];
  weaknesses: SwotItem[];
  opportunities: SwotItem[];
  threats: SwotItem[];
  verdict: string;
  confidenceScore: number;
  tiebreakerTip: string;
}

export interface DecisionHistoryItem {
  id: string;
  timestamp: string;
  decision: string;
  type: AnalysisType;
  context?: string;
  prosCons?: ProsConsAnalysis;
  comparison?: ComparisonAnalysis;
  swot?: SwotAnalysis;
}
