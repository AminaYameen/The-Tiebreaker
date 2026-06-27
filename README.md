<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

🌟 Project Overview: The Tiebreaker
The Tiebreaker is a professional, full-stack, AI-powered decision-intelligence application. It is designed to help executives, developers, and strategists analyze high-stakes choices objectively. Instead of simple lists, it uses advanced decision-science frameworks backed by Gemini 3.5 to calculate attractiveness indexes, formulate clear strategic verdicts, and draft actionable mitigation plans.
🗺️ Step-by-Step Project Walkthrough
Step 1: Context Capture & Selection
The Interface: A sleek, dark slate dashboard with spacious negative space and paired modern typography.
Action: The user enters their dilemma (e.g., "Should I migrate my database to PostgreSQL?") and selects one of three elite strategic frameworks:
Pros & Cons Analysis (with weighted dynamic scores).
Side-by-Side Comparison Matrix (for comparing multiple options against weighted criteria).
SWOT Strategic Matrix (Strength, Weakness, Opportunity, Threat).
Step 2: Intelligent AI Generation & Calculations
Action: Clicking "Generate Objective Analysis" calls the secure server-side Gemini API.
The Logic: The AI doesn't just write text—it generates a structured JSON model:
Creates realistic points with description-rich cards.
Assigns proportional Weights (1-5) and Ratings (1-10) to each factor.
Formulates a distinct Attractiveness / Strategic Viability Score (calculated mathematically).
Delivers a decisive, personalized Tiebreaker Verdict and a Strategic Action Plan.
Step 3: Interactive Workspace & Tweaking
Action: The user is presented with beautifully colored, responsive lists and matrices.
Interactive Features:
Users can dynamically add their own customized criteria or delete AI-suggested factors.
Sliders allow real-time recalculations of confidence scores when changing weights.
A history panel keeps track of past analytical runs securely.
Step 4: The Interactive Tiebreaker Consultant (AI Sounding Board)
Action: A dedicated advisory panel appears below the analysis.
The Logic: Powered by a customized conversational state engine, this allows users to ask direct follow-up questions (e.g., "How do I mitigate threat #2?" or "What is a low-risk test run for Option B?"). The consultant responds with contextual, step-by-step strategic solutions based on the active table's exact data.
Step 5: High-Fidelity Executive PDF / Print Exporter
Action: The user clicks "Export PDF / Print".
The Logic: The app compiles the active analysis into a beautifully structured, standalone HTML executive report. It packages all cards, weights, and matrices into a clean grid, then triggers the browser's system PDF/Print dialogue instantly. The custom @media print CSS strips out buttons and sidebars to present a pristine, paper-ready corporate briefing document.


# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/90ab4225-6b8f-447b-b973-8307afbdc48b

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
