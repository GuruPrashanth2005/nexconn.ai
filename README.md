# HydroLab 3D: Collaborative Environmental Chemistry Simulator
> **Designed, Engineered, and Architected by Team Binary Brains**

---

## 🌌 1. Executive Summary & Vision

**HydroLab 3D** is an interactive, real-time 3D virtual chemistry laboratory and collaborative digital twin built for undergraduate STEM students, educators, and environmental researchers. It transforms traditional water quality analysis—including EDTA Total Hardness, Alkalinity, Chemical Oxygen Demand (COD), and digital pH determination—into an immersive, risk-free web simulator.

Powered by WebGL/Three.js and seamless multi-user synchronization via Nexconn, student pairs can enter shared virtual lab benches using unique room codes to co-operate glassware (burettes, pipettes, and reflux apparatus), track real-time meniscus fluid dynamics, share observations, and record synced digital logbooks simultaneously. Supported by Dr. Hydro AI, an intelligent in-lab pedagogical companion that provides contextual interventions and automated grading metrics, HydroLab 3D bridges the gap between digital remote learning and tactile laboratory proficiency, delivering accessible, high-precision STEM education with zero chemical waste or physical equipment constraints.

---

## 🤝 2. Nexconn Real-Time Multi-User Collaboration

HydroLab 3D integrates **Nexconn Chat SDK (`@nexconn/chat`, `@nexconn/engine`)** and **Nexconn Chat UI (`@nexconn/chatui`)** to pioneer real-time multi-user laboratory workspaces:

- **Seamless Room Code Pairing (`LAB-XXXXX`)**: Clean, non-repeating 5-character room codes allow students to pair across different machines and browsers instantly without complicated room setup.
- **Bi-directional Apparatus Synchronization**:
  - Live burette stopcock valve rotation and continuous meniscus fluid flow (30+ FPS telemetry streaming).
  - Mutual procedural checklist updates, equipment selection, and reagent dispensing.
  - Flask swirling agitation and color transition states synced in real time.
- **Shared Digital Logbook**: When one partner notes down burette readings, endpoints, or sample volumes, the values populate synchronously in the partner's laboratory logbook.
- **Nexconn In-Lab Chat Engine**:
  - Direct 1:1 and peer channels allowing partners to share readings (`"Share Reading to Nexconn Chat"`).
  - Live AI observation feedback from Dr. Hydro AI in response to shared laboratory measurements.
- **Secure Server-Side Token Issuance**: Backend REST API (`/api/v1/nexconn/token`) generates SHA-1 cryptographically signed user access tokens (`App-Key`, `Nonce`, `Timestamp`, `Signature`) interfacing directly with the Nexconn Singapore Gateway.

---

## 🏗️ 3. Comprehensive Platform Features

### 3.1 The Virtual Wet Lab (Analytical Chemistry Engine)
The foundational simulated laboratory environment. It features real-time fluid meniscus physics, dynamic colorimetric indicator blending, and strict procedural logbook tracking.
* **Module 1: Determination of Total Hardness (Complexometric Titration)**
  * **Mechanics**: Measures calcium and magnesium ions.
  * **Workflow**: Pipette sample -> Add 0.01M EDTA to burette -> Add Eriochrome Black T (EBT) indicator -> Titrate from wine red to sharp blue endpoint -> Calculate Hardness (ppm).
* **Module 2: Determination of Alkalinity (Acid-Base Titration)**
  * **Mechanics**: Measures water's capacity to neutralize acids via Carbonates and Bicarbonates.
  * **Workflow**: Titrate sample with Standard HCl -> Use Phenolphthalein (pink to colorless) -> Use Methyl Orange (yellow to faint orange).
* **Module 3: Chemical Oxygen Demand (COD) (Redox Back-Titration)**
  * **Mechanics**: Measures oxygen required to chemically oxidize organic matter.
  * **Workflow**: Prepare Sample & Blank -> Add K₂Cr₂O₇ and H₂SO₄ -> Reflux simulation -> Titrate unreacted dichromate with FAS using Ferroin indicator.
* **Module 4: pH Electrometry**
  * **Mechanics**: Digital electrometric determination.
  * **Workflow**: Wash glass electrode -> Calibrate with pH 7.00 buffer -> Calibrate with pH 4.01 buffer -> Submerge in unknown sample -> Read digital display.

### 3.2 The 3D Molecule Builder & VSEPR Engine
An interactive, physics-enabled 3D sandbox where students visually construct chemical compounds.
* **VSEPR Theory Simulation**: Live calculation of Valence Shell Electron Pair Repulsion to accurately predict and render true 3D molecular geometry (Linear, Trigonal Planar, Tetrahedral, Octahedral, etc.).
* **Dynamic Electron Flows**: Continuous animated arrows visually represent electron transfers and nucleophilic attacks during bond formation.
* **AI Thermodynamic Evaluation**: Dr. Hydro assesses thermodynamic feasibility (ΔG, ΔH), activation energy (Ea), and optimal synthesis conditions (Temperature/Pressure).

### 3.3 Retrosynthesis Planner & Reaction Trees
An advanced tool for reverse-engineering complex chemical syntheses.
* **Hierarchical Node Tree**: D3-style interactive visualization that breaks target molecules down into commercially available precursors.
* **AI Predictive Pathways**: Predicts exact reaction pathways, percentage yields, safety constraints, and requisite catalysts for every node.

### 3.4 Spectroscopic Analysis Panel
A sophisticated visualizer for molecular spectroscopic data.
* **Predictive Spectra Generation**: Generates and visualizes predictive Infrared (IR) and Nuclear Magnetic Resonance (NMR) spectra using AI-driven modeling.
* **Interactive Data Correlation**: Hoverable spectral peaks linked to explanations of corresponding functional groups (e.g., -OH stretch at ~3300 cm⁻¹, C=O stretch at ~1700 cm⁻¹).

### 3.5 The Periodic Explorer
A modern, interactive periodic table designed to visualize the fundamental building blocks of matter.
* **Quantum Mechanical Visualization**: 3D atomic structures with animated electron orbitals (s, p, d, f) based on quantum probability distributions.
* **Crystal Lattices**: 3D structural representations of elemental solid-state geometries (BCC, FCC, HCP, Simple Cubic).
* **Semantic Configurations**: Detailed breakdowns of electron configurations (e.g., `[Ar] 4s² 3d¹⁰ 4p³`).

### 3.6 Educational Dashboards & Analytics
* **Student Dashboard**: Real-time progress tracking, digital logbook history, achievement unlocking, and skill metrics.
* **Faculty Dashboard**: Allows educators to generate custom AI-driven curriculums, track student engagement time, and monitor class-wide performance trends.

---

## 🧠 4. Dr. Hydro: The AI Architecture

At the core of the platform is **Dr. Hydro**, a contextually aware AI lab assistant.

* **Dynamic State Injection**: The Zustand state manager continuously serializes the user's laboratory context—active experiment, burette readings, logbook inputs, or molecular structures.
* **Intent Parsing & Academic Guardrails**: Dr. Hydro acts exclusively as an educational chemistry tutor, providing mathematically sound, situation-aware answers using KaTeX/LaTeX formulas.
* **Proactive Interventions**: Alerts students when approaching titration color endpoints, reminds them to switch to drop-wise mode, or prompts swirling when local concentration gradients form.

---

## 🛠️ 5. Technology Stack

### Frontend Layer
* **Framework**: React 19, TypeScript, Vite
* **3D Graphics**: Three.js, React Three Fiber (`@react-three/fiber`), Drei (`@react-three/drei`)
* **State Management**: Zustand
* **Real-time Chat & Collaboration**: `@nexconn/chat`, `@nexconn/chatui`, `@nexconn/engine`
* **Styling**: Modern Glassmorphism with pure CSS Variables (Light & Dark theme support)
* **Math & Markdown**: `katex`, `react-markdown`, `remark-gfm`, `remark-math`, `rehype-katex`

### Backend Layer
* **Runtime**: Node.js, Express.js
* **Database & ORM**: MongoDB, Prisma ORM
* **Real-Time Integration**: Nexconn Server API (Cryptographic SHA-1 signature authentication)
* **AI Engine**: Google Gemini API / Groq LLM integration

---

## 🌍 6. Global Impact & Accessibility

* **Economic**: Eliminates the overhead of physical laboratories, costly glassware, and consumable reagents, enabling world-class science education at near-zero marginal cost.
* **Social**: Democratizes access to high-precision science education. Completely hazard-free—eliminating risks of acid burns, toxic fumes, or thermal hazards.
* **Environmental**: Operates with a 100% zero chemical waste footprint—no chemical disposal, no hazardous runoff, and zero resource depletion.

---

## ⚙️ 7. Developer Setup & Installation

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* `npm` or `yarn`

### Local Deployment Instructions

1. **Clone the repository**:
   ```bash
   git clone https://github.com/GuruPrashanth2005/nexconn.ai.git
   cd nexconn.ai
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Add your NEXCONN_APP_KEY, NEXCONN_APP_SECRET, and API keys to .env
   npm run dev
   ```

3. **Frontend Setup**:
   Open a separate terminal window:
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   npm run dev
   ```

4. **Launch**: Open `http://localhost:5173` in your browser. Enter a laboratory module or join a peer session with a `LAB-XXXXX` invite code!
