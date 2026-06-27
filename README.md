# ⚖️ The Tiebreaker: Objective AI-Powered Decision Analyst

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Gemini API](https://img.shields.io/badge/Gemini_API-8E75C2?style=for-the-badge&logo=google-gemini&logoColor=white)](https://ai.google.dev/)

**The Tiebreaker** is a professional, full-stack, AI-powered decision-intelligence application designed to help executives, developers, and strategists analyze high-stakes choices objectively. Moving far beyond simple pros-and-cons lists, it utilizes advanced decision-science frameworks backed by Google Gemini 3.5 to calculate strategic viability index scores, formulate clear visual and qualitative verdicts, and draft actionable mitigation plans.

🔗 **Live Production App Link:** [The Tiebreaker Live Web App](https://ais-pre-fxfetlfpblmhp45345rvlw-539893672085.asia-east1.run.app)  
*(Add this link to your CV and GitHub repository to showcase your fully deployed, functional full-stack application!)*

---

## 🌟 Project Overview

When facing complex dilemmas (e.g., *“Should we migrate our core database to PostgreSQL?”*, *“Should we build in-house or buy a SaaS solution?”*), human decision-making is prone to cognitive biases, fatigue, and circular arguments. 

**The Tiebreaker** serves as an objective, third-party strategic consultant. By choosing from elite framework models, the application structures arguments, weights their relative significance, and calculates a quantitative **Strategic Viability Score**. It then offers an interactive sounding board with an AI advisor to stress-test your assumptions in real-time.

---

## 🗺️ Step-by-Step Architecture & Walkthrough

### 1️⃣ Step 1: Context Capture & Selection
* **The Interface:** A sleek, eye-safe midnight slate workspace designed with generous negative space, crisp responsive alignments, and modern font pairings.
* **Action:** The user defines their central dilemma and registers contextual background. They then select one of three high-caliber strategy frameworks:
  1. **Pros & Cons Analysis:** Traditional balancing augmented with weighted significance coefficients.
  2. **Side-by-Side Comparison Matrix:** A multi-option evaluation matrix comparing alternative options across customizable weighted criteria.
  3. **SWOT Strategic Matrix:** Deep mapping of internal Strengths and Weaknesses against external Opportunities and Threats.

### 2️⃣ Step 2: Intelligent AI Generation & Structured Modeling
* **Backend Ingestion:** Clicking **"Generate Objective Analysis"** triggers a secure backend route proxying the request to the **Google Gemini 3.5 API**.
* **Deterministic Output Engine:** To guarantee analytical fidelity, the Gemini model is instructed to output strict, programmatic JSON data. The engine:
  * Creates detailed, custom-tailored point lists with comprehensive qualitative descriptions.
  * Assigns proportional impact weights (1–5) and scores (1–10) to individual factors.
  * Formulates a mathematical **Attractiveness / Viability Score** (calculated server-side).
  * Writes a highly decisive, customized **Tiebreaker Verdict** accompanied by a strategic mitigation action plan.

### 3️⃣ Step 3: Interactive Dynamic Workspace & Custom Tweaking
* **Real-time Recalculations:** Users are not locked into the AI’s initial assessment.
* **Interactive Control Panels:**
  * Add custom criteria or delete AI-suggested factors with a single click.
  * Adjust weights in real-time using interactive sliders. The parent React state instantly re-runs the mathematical scoring algorithm to recalculate the composite **Attractiveness Index**.
  * View local session history to quickly switch between active decision workspaces.

### 4️⃣ Step 4: The Interactive Sounding Board (AI Consultant Chat)
* **Context-Aware Advisory Panel:** Positioned directly beneath the active matrix, a conversational sidebar serves as a private executive advisor.
* **Smart Contextual Memory:** Powered by a local chat state engine, users can ask direct questions (e.g., *"How do I mitigate Weakness #2?"* or *"What is the low-risk trial version of Option A?"*). The consultant analyzes the current table’s live state directly to provide custom step-by-step corporate solutions.

### 5️⃣ Step 5: High-Fidelity Executive HTML/PDF Exporter
* **Standalone Document Generation:** Users can export their analysis to a clean, highly formatted, single-file HTML executive report.
* **Instant Print / Save PDF:** The exporter constructs a self-contained, beautifully styled document and triggers the browser's native print interface instantly. Custom CSS `@media print` rules strip out workspace controls, buttons, and backgrounds to format a clean, paper-ready corporate briefing memo.

---

## 💻 Tech Stack & Developer Tools

* **Frontend Framework:** React 18 with Vite (TypeScript)
* **Styling Engine:** Tailwind CSS
* **Icons & Visuals:** Lucide React
* **Backend Server:** Express.js (Node.js) with TSX runtime execution
* **AI Orchestration:** Google Gen AI SDK (`@google/genai` utilizing Gemini 3.5)
* **Code Bundler:** Esbuild for fast production server bundling

---

## ⚙️ Local Installation & Setup

To run this project locally, follow these simple steps:

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/your-username/the-tiebreaker.git
   cd the-tiebreaker
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Set Up Your Environment Variables:**
   Create a `.env` file in the root directory and add your Google Gemini API Key:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open your browser to `http://localhost:3000` to interact with the workspace!

5. **Build for Production:**
   ```bash
   npm run build
   npm run start
   ```

---

## 🚀 How to Upload This Code to Your GitHub Repository

If you encountered the message `"nothing added to commit but untracked files present"`, it means Git has noticed your files but hasn't been told to track/include them in your commit yet. 

Follow these steps exactly to initialize your Git repository and push your code to GitHub:

### Step 1: Initialize Git (If you haven't already)
```bash
git init
```

### Step 2: Add all files to the staging area (Tracks all your code)
This is the step that fixes the "untracked files present" error. The dot (`.`) tells Git to add all files in the current folder:
```bash
git add .
```

### Step 3: Commit the files with a message
Now that your files are tracked, save them locally:
```bash
git commit -m "feat: initial commit - complete full-stack Tiebreaker application"
```

### Step 4: Link your local repository to your GitHub repository
Go to GitHub, create a new repository called `the-tiebreaker` (leave it empty without a README, gitignore, or license), and run this command (replace `your-username` with your real GitHub username):
```bash
git branch -M main
git remote add origin https://github.com/your-username/the-tiebreaker.git
```

### Step 5: Push your code to GitHub!
```bash
git push -u origin main
```

Refresh your GitHub repository page, and your beautifully polished full-stack application code and this README will be fully visible!

---

*Developed with ❤️ as a high-stakes decision-science intelligence platform.*
