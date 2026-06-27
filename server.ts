/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialize Gemini SDK client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Generate unique ID helper
function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11)}`;
}

// Define Schemas for each of the three Analysis modes
const ProsConsResponseSchema = {
  type: Type.OBJECT,
  properties: {
    decision: { type: Type.STRING, description: "The core decision being evaluated." },
    pros: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING, description: "A concise label for the pro (e.g. Higher Salary, Creative Freedom)." },
          explanation: { type: Type.STRING, description: "Clear, logical reasoning of why this is a benefit." },
          weight: { type: Type.INTEGER, description: "Strength or importance score from 1 to 5 (5 is extremely important/highest benefit, 1 is a minor nice-to-have)." },
          category: { type: Type.STRING, description: "Category grouping (e.g. Financial, Career, Lifestyle, Social, Well-being)." }
        },
        required: ["text", "explanation", "weight", "category"]
      },
      description: "A comprehensive list of factors in favor of the decision."
    },
    cons: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING, description: "A concise label for the con (e.g. Longer Commute, Setup Costs)." },
          explanation: { type: Type.STRING, description: "Clear, logical reasoning of why this is a downside or risk." },
          weight: { type: Type.INTEGER, description: "Initial negative impact/risk score from 1 to 5 (5 is a major blocker/high risk, 1 is a minor inconvenience)." },
          category: { type: Type.STRING, description: "Category grouping (e.g. Stress, Expense, Time, Relationship, Career)." }
        },
        required: ["text", "explanation", "weight", "category"]
      },
      description: "A comprehensive list of factors against the decision."
    },
    verdict: {
      type: Type.STRING,
      description: "A professional, highly objective Tiebreaker summary and advice based on the balance of factors. Explain who wins and why, with clear reasoning."
    },
    confidenceScore: {
      type: Type.INTEGER,
      description: "An integer from 0 to 100 reflecting how clear-cut or easy the decision is based on current parameters."
    },
    tiebreakerTip: {
      type: Type.STRING,
      description: "A highly actionable, specific piece of creative advice, alternative strategy, or compromise to help resolve any remaining doubt."
    }
  },
  required: ["decision", "pros", "cons", "verdict", "confidenceScore", "tiebreakerTip"]
};

const ComparisonResponseSchema = {
  type: Type.OBJECT,
  properties: {
    decision: { type: Type.STRING, description: "The general core decision or trade-off being made." },
    options: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "The list of discrete options evaluated. Usually 2 to 4 options (e.g., ['Option A', 'Option B'])."
    },
    criteria: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "A short, descriptive name of the criterion (e.g. Cost, Learning Curve, Fun, Stability)." },
          description: { type: Type.STRING, description: "A brief description of why this criterion is important for this decision." },
          weight: { type: Type.INTEGER, description: "Importance weight of this criterion from 1 to 5 (5 is critical, 1 is secondary)." },
          evaluations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                option: { type: Type.STRING, description: "The exact name of the option this rating applies to (must match an element in the options array)." },
                rating: { type: Type.INTEGER, description: "Score rating for this option from 1 to 10 (10 is ideal/perfect, 1 is extremely poor)." },
                details: { type: Type.STRING, description: "Concise reasoning or evidence justifying this specific rating." }
              },
              required: ["option", "rating", "details"]
            }
          }
        },
        required: ["name", "description", "weight", "evaluations"]
      },
      description: "A list of structured trade-off criteria with side-by-side evaluations."
    },
    verdict: {
      type: Type.STRING,
      description: "A definitive expert conclusion. Recommend the mathematically and logically superior option, explaining why it stands out."
    },
    confidenceScore: {
      type: Type.INTEGER,
      description: "An integer from 0 to 100 on the decisiveness of the winning option."
    },
    tiebreakerTip: {
      type: Type.STRING,
      description: "A specialized next-step recommendation (e.g. how to mitigate the weakness of the chosen option)."
    }
  },
  required: ["decision", "options", "criteria", "verdict", "confidenceScore", "tiebreakerTip"]
};

const SwotResponseSchema = {
  type: Type.OBJECT,
  properties: {
    decision: { type: Type.STRING, description: "The strategic decision being analyzed (e.g., Launching a new app, changing careers)." },
    strengths: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          point: { type: Type.STRING, description: "Core strength factor (e.g. Direct Industry Experience)." },
          explanation: { type: Type.STRING, description: "How this strength provides an internal advantage." },
          potentialImpact: { type: Type.STRING, description: "Impact of this strength (High, Medium, or Low)." }
        },
        required: ["point", "explanation", "potentialImpact"]
      }
    },
    weaknesses: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          point: { type: Type.STRING, description: "Core weakness factor (e.g. Limited Startup Capital)." },
          explanation: { type: Type.STRING, description: "How this weakness creates an internal vulnerability." },
          potentialImpact: { type: Type.STRING, description: "Impact of this weakness (High, Medium, or Low)." }
        },
        required: ["point", "explanation", "potentialImpact"]
      }
    },
    opportunities: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          point: { type: Type.STRING, description: "External opportunity (e.g. Rising Market Demand)." },
          explanation: { type: Type.STRING, description: "How this external trend can be leveraged." },
          potentialImpact: { type: Type.STRING, description: "Impact of this opportunity (High, Medium, or Low)." }
        },
        required: ["point", "explanation", "potentialImpact"]
      }
    },
    threats: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          point: { type: Type.STRING, description: "External threat (e.g. Aggressive Competitors, Regulation Change)." },
          explanation: { type: Type.STRING, description: "How this external threat poses a risk." },
          potentialImpact: { type: Type.STRING, description: "Impact of this threat (High, Medium, or Low)." }
        },
        required: ["point", "explanation", "potentialImpact"]
      }
    },
    verdict: {
      type: Type.STRING,
      description: "A balanced, strategic conclusion outlining whether to proceed and what the primary trade-off focus should be."
    },
    confidenceScore: {
      type: Type.INTEGER,
      description: "An integer from 0 to 100 of the decision feasibility/attractiveness."
    },
    tiebreakerTip: {
      type: Type.STRING,
      description: "A critical piece of strategic advice, such as how to use strengths to counter threats or minimize weaknesses to capture opportunities."
    }
  },
  required: ["decision", "strengths", "weaknesses", "opportunities", "threats", "verdict", "confidenceScore", "tiebreakerTip"]
};

// API Endpoint for decision analysis
app.post("/api/analyze-decision", async (req, res) => {
  const { decision, type, context, options } = req.body;

  if (!decision || typeof decision !== "string" || decision.trim() === "") {
    return res.status(400).json({ error: "Decision prompt is required and must be a string." });
  }

  const allowedTypes = ["pros-cons", "comparison", "swot"];
  if (!type || !allowedTypes.includes(type)) {
    return res.status(400).json({ error: "Invalid or missing analysis type. Must be 'pros-cons', 'comparison', or 'swot'." });
  }

  try {
    const ai = getGeminiClient();
    
    let promptText = "";
    let schemaToUse: any = null;

    if (type === "pros-cons") {
      schemaToUse = ProsConsResponseSchema;
      promptText = `Evaluate the following decision: "${decision}". 
${context ? `Use this additional context for personalization: "${context}".` : ""}
Provide a comprehensive list of realistic, highly tailored pros and cons (at least 4-5 of each). Group them into categories, and weight them from 1 to 5.
Then write a clear, wise summary verdict explaining who wins and why, with a confidence score and a creative tiebreaker tip.`;
    } else if (type === "comparison") {
      schemaToUse = ComparisonResponseSchema;
      const optsText = options && Array.isArray(options) && options.length > 0 
        ? options.map((o: string) => o.trim()).filter(Boolean) 
        : ["Option A", "Option B"];
      
      promptText = `Evaluate the decision: "${decision}". 
We are choosing side-by-side between the following options: [${optsText.map(o => `"${o}"`).join(", ")}].
${context ? `Additional context: "${context}".` : ""}
Generate at least 4-5 key criteria for evaluation (e.g., Cost, Time, Future-proofing, Comfort, Career Impact).
For each criterion:
- Give it a name and brief description
- Assign it an overall weight (1 to 5)
- Provide a side-by-side evaluation for each of the options: [${optsText.join(", ")}].
- Rate each option on a scale of 1 to 10 (10 is outstanding, 1 is poor) for that criterion, and write a detailed evaluation commentary.
Make sure the evaluations array contains exactly one item for EACH of the provided options: [${optsText.join(", ")}].
Finally, write an expert, objective summary verdict and dynamic Tiebreaker advice recommending the best option.`;
    } else if (type === "swot") {
      schemaToUse = SwotResponseSchema;
      promptText = `Conduct a comprehensive strategic SWOT Analysis (Strengths, Weaknesses, Opportunities, Threats) for the decision/strategy: "${decision}".
${context ? `Additional Context: "${context}".` : ""}
For Strengths & Weaknesses (internal factors) and Opportunities & Threats (external factors), generate at least 3-4 entries for each section.
Assign each SWOT point a potential impact (High, Medium, or Low) and write a clear, expert explanation.
Provide a powerful strategic summary verdict and a creative Tiebreaker tip on how to maximize strengths and mitigate threats.`;
    }

    // Robust Model Fallback and Retry mechanism to handle 503 (model demand spike), 429 (rate limits) or transient network errors.
    const modelsToTry = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
    let response: any = null;
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      let attempts = 2;
      let delay = 500; // ms

      for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
          console.log(`[Gemini API] Requesting ${modelName} - attempt ${attempt}/${attempts}`);
          response = await ai.models.generateContent({
            model: modelName,
            contents: promptText,
            config: {
              responseMimeType: "application/json",
              responseSchema: schemaToUse,
              systemInstruction: `You are "The Tiebreaker", an elite AI decision-making strategist and objective advisor.
Your mission is to help people break analysis paralysis by providing crisp, analytical, and highly personalized decision frameworks.
Avoid generic boilerplate or generic summaries. Be realistic, mathematically sound, deeply logical, and highly practical.
Ensure all option names in the evaluations are exact string matches of the options specified.
Do not use markdown formatting inside the JSON strings. Return valid, well-formed JSON matching the specified schema.`,
            },
          });
          break; // Succeeded! Break out of attempts loop
        } catch (error: any) {
          lastError = error;
          const status = error.status || (error.error && error.error.code) || 500;
          console.warn(`[Gemini API] Error with ${modelName} on attempt ${attempt}: (Status ${status})`, error.message || error);
          
          if (status === 400 || status === 403 || status === 401) {
            console.log(`[Gemini API] Non-retryable status ${status}. Skipping model ${modelName}.`);
            break; // Skip further attempts for this model and try next model
          }

          if (attempt < attempts) {
            console.log(`[Gemini API] Retrying in ${delay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay *= 2; // Exponential backoff
          }
        }
      }

      if (response) {
        console.log(`[Gemini API] Successfully generated analysis using model: ${modelName}`);
        break; // Successfully got response, stop trying other models
      }
    }

    if (!response) {
      throw lastError || new Error("All fallback models and retry attempts failed to generate decision analysis.");
    }

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error("Empty response returned from the Gemini AI model.");
    }

    let parsedResult = JSON.parse(textOutput.trim());

    // Inject unique IDs on the server side for React keys
    if (type === "pros-cons") {
      parsedResult.pros = (parsedResult.pros || []).map((p: any) => ({ ...p, id: generateId("pro") }));
      parsedResult.cons = (parsedResult.cons || []).map((c: any) => ({ ...c, id: generateId("con") }));
    } else if (type === "comparison") {
      parsedResult.criteria = (parsedResult.criteria || []).map((crit: any) => ({ ...crit, id: generateId("crit") }));
    } else if (type === "swot") {
      parsedResult.strengths = (parsedResult.strengths || []).map((s: any) => ({ ...s, id: generateId("str") }));
      parsedResult.weaknesses = (parsedResult.weaknesses || []).map((w: any) => ({ ...w, id: generateId("weak") }));
      parsedResult.opportunities = (parsedResult.opportunities || []).map((o: any) => ({ ...o, id: generateId("opp") }));
      parsedResult.threats = (parsedResult.threats || []).map((t: any) => ({ ...t, id: generateId("threat") }));
    }

    // Add optional context if provided
    if (context) {
      parsedResult.context = context;
    }

    return res.json(parsedResult);
  } catch (error: any) {
    console.error("Gemini decision-making analysis error:", error);
    return res.status(500).json({
      error: "Failed to generate decision analysis due to an internal server error.",
      details: error.message || error,
    });
  }
});

// API Endpoint for decision follow-up consultation chat
app.post("/api/consult-decision", async (req, res) => {
  const { decision, type, activeAnalysis, history, userMessage } = req.body;

  if (!userMessage || typeof userMessage !== "string" || userMessage.trim() === "") {
    return res.status(400).json({ error: "User message is required." });
  }

  try {
    const ai = getGeminiClient();

    const systemInstruction = `You are "The Tiebreaker Consultant", an elite advisory companion.
The user is evaluating the decision: "${decision || "the current dilemma"}" using a "${type || "decision-making"}" framework.

Here is the current state of their decision analysis, with all custom points, ratings, weights, and the strategic verdict:
${JSON.stringify(activeAnalysis || {})}

Your goal is to answer the user's follow-up questions, act as an objective, hyper-logical sounding board, help them mitigate specific weaknesses or threats, flesh out pros or cons, and guide them to a clear, actionable path.
Be extremely practical, warm, strategic, and concise. Avoid generic platitudes. You can use simple bullet points or light markdown formatting.`;

    const contents = [
      ...(history || []).map((msg: any) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.text }]
      })),
      {
        role: "user",
        parts: [{ text: userMessage }]
      }
    ];

    const modelsToTry = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
    let response: any = null;
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      let attempts = 2;
      let delay = 500;

      for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
          console.log(`[Gemini API Consultant] Requesting ${modelName} - attempt ${attempt}/${attempts}`);
          response = await ai.models.generateContent({
            model: modelName,
            contents: contents,
            config: {
              systemInstruction: systemInstruction,
            },
          });
          break;
        } catch (error: any) {
          lastError = error;
          const status = error.status || (error.error && error.error.code) || 500;
          console.warn(`[Gemini API Consultant] Error with ${modelName} on attempt ${attempt}:`, error.message || error);
          
          if (status === 400 || status === 403 || status === 401) {
            break;
          }

          if (attempt < attempts) {
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay *= 2;
          }
        }
      }

      if (response) {
        break;
      }
    }

    if (!response) {
      throw lastError || new Error("Consultant failed to generate a response.");
    }

    const replyText = response.text || "I was unable to formulate a strategy for this question. Let's try rephrasing.";
    return res.json({ reply: replyText });
  } catch (error: any) {
    console.error("Gemini consultant chat error:", error);
    return res.status(500).json({
      error: "Failed to consult the decision analyst due to an internal server error.",
      details: error.message || error,
    });
  }
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode with Vite Dev Server
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev middleware loaded in Express.");
  } else {
    // Production mode - static distribution
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving compiled static assets from dist/.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`The Tiebreaker server running on http://localhost:${PORT}`);
  });
}

startServer();
