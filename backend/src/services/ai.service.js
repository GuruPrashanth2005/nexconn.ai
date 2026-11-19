const AppError = require('../utils/AppError');

// Ollama API configuration
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3';

// Groq API configuration
const Groq = require('groq-sdk');

// Helper function to safely parse JSON from LLM output (removes markdown backticks if present)
const extractJSON = (text) => {
  try {
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Failed to parse AI JSON response:', text);
    return null;
  }
};

const LATEX_FORMATTING_RULES = `
CRITICAL FORMATTING RULES FOR CHEMISTRY:
1. You MUST wrap ALL chemical reactions and formulas in double dollar signs $$ like this: $$ C + O_2 \\rightarrow CO_2 $$
2. NEVER use the word "latex" or markdown code blocks for equations. Just use $$.
3. Because you are generating JSON, you MUST double-escape all LaTeX backslashes (e.g. use \\\\rightarrow instead of \\rightarrow).
4. Do NOT use \\text{} or \\ce{} inside equations. Write formulas directly (e.g. $$ H_2SO_4 $$). 
5. NEVER use invalid LaTeX macros like \\circC. Write temperatures as plain text outside the equation or use ^\\circ C.
`;

const ATOMIC_NUMBER_MAP = {
  1: 'H', 2: 'He', 3: 'Li', 4: 'Be', 5: 'B', 6: 'C', 7: 'N', 8: 'O', 9: 'F', 10: 'Ne',
  11: 'Na', 12: 'Mg', 13: 'Al', 14: 'Si', 15: 'P', 16: 'S', 17: 'Cl', 18: 'Ar',
  19: 'K', 20: 'Ca', 21: 'Sc', 22: 'Ti', 23: 'V', 24: 'Cr', 25: 'Mn', 26: 'Fe', 27: 'Co', 28: 'Ni', 29: 'Cu', 30: 'Zn',
  31: 'Ga', 32: 'Ge', 33: 'As', 34: 'Se', 35: 'Br', 36: 'Kr',
  37: 'Rb', 38: 'Sr', 39: 'Y', 40: 'Zr', 41: 'Nb', 42: 'Mo', 43: 'Tc', 44: 'Ru', 45: 'Rh', 46: 'Pd', 47: 'Ag', 48: 'Cd',
  49: 'In', 50: 'Sn', 51: 'Sb', 52: 'Te', 53: 'I', 54: 'Xe',
  55: 'Cs', 56: 'Ba', 57: 'La', 58: 'Ce', 59: 'Pr', 60: 'Nd', 61: 'Pm', 62: 'Sm', 63: 'Eu', 64: 'Gd', 65: 'Tb', 66: 'Dy', 67: 'Ho', 68: 'Er', 69: 'Tm', 70: 'Yb', 71: 'Lu',
  72: 'Hf', 73: 'Ta', 74: 'W', 75: 'Re', 76: 'Os', 77: 'Ir', 78: 'Pt', 79: 'Au', 80: 'Hg',
  81: 'Tl', 82: 'Pb', 83: 'Bi', 84: 'Po', 85: 'At', 86: 'Rn',
  87: 'Fr', 88: 'Ra', 89: 'Ac', 90: 'Th', 91: 'Pa', 92: 'U', 93: 'Np', 94: 'Pu', 95: 'Am'
};

async function fetchAccurate3D(moleculeName, smiles = null) {
  try {
    let response;
    if (smiles) {
      response = await fetch(`http://127.0.0.1:8001/api/molecule/smiles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: moleculeName, smiles: smiles })
      });
    } else {
      const url = `http://127.0.0.1:8001/api/molecule/${encodeURIComponent(moleculeName)}`;
      response = await fetch(url);
    }
    if (!response.ok) return null;

    const data = await response.json();
    if (!data.atoms || data.atoms.length === 0) return null;

    // Calculate center for centering
    let cx = 0, cy = 0, cz = 0;
    for (let i = 0; i < data.atoms.length; i++) {
      cx += data.atoms[i].x;
      cy += data.atoms[i].y;
      cz += data.atoms[i].z;
    }
    cx /= data.atoms.length; cy /= data.atoms.length; cz /= data.atoms.length;

    const atoms = [];
    for (let i = 0; i < data.atoms.length; i++) {
      atoms.push({
        id: `a${i}`,
        symbol: data.atoms[i].element,
        position: [data.atoms[i].x - cx, data.atoms[i].y - cy, data.atoms[i].z - cz]
      });
    }

    const bonds = [];
    for (let i = 0; i < (data.bonds || []).length; i++) {
      const b = data.bonds[i];
      bonds.push({
        id: `b${i}`,
        sourceId: `a${b.source}`,
        targetId: `a${b.target}`,
        order: b.type
      });
    }

    return { atoms, bonds };
  } catch (error) {
    console.error('\n⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️');
    console.error('CRITICAL WARNING: Accurate 3D Chemistry Engine is NOT RUNNING!');
    console.error('The backend failed to connect to http://127.0.0.1:8001');
    console.error('Because of this, molecular structures and bonds will be hallucinated by the AI and may appear broken.');
    console.error('Please run start-all.bat or start the chemistry-engine manually.');
    console.error('⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️\n');
    console.error(error.message);
    return null;
  }
}

/**
 * Generates personalized performance insights based on student session history.
 * Bypassing local LLM to ensure instantaneous dashboard loading with detailed feedback.
 */
exports.generateInsights = async (sessions) => {
  if (!sessions || sessions.length === 0) return [];

  const totalSessions = sessions.length;
  const avgScore = sessions.reduce((acc, s) => acc + s.score, 0) / totalSessions;

  let mistakes = [];
  sessions.forEach(s => {
    if (Array.isArray(s.mistakes)) mistakes.push(...s.mistakes);
    else if (typeof s.mistakes === 'string') {
      try { mistakes.push(...JSON.parse(s.mistakes)); } catch (e) { }
    }
  });

  return getFallbackInsights(avgScore, mistakes, sessions);
};

/**
 * Highly detailed rule-based insights algorithm.
 * Provides instant, rich feedback without the 30s LLM penalty.
 */
function getFallbackInsights(avgScore, allMistakes, recent5) {
  const aiInsights = [];

  // 1. Positive Insight
  if (avgScore >= 85) {
    aiInsights.push({
      type: 'POSITIVE',
      title: 'High Overall Precision',
      description: `Your average score of ${Math.round(avgScore)}% demonstrates excellent retention of theoretical principles. Keep up this precision for consistent experimental yields.`
    });
  } else {
    aiInsights.push({
      type: 'POSITIVE',
      title: 'Consistent Engagement',
      description: `You are showing a solid foundation across modules. Focus on reviewing the lab manual before starting to further boost your accuracy.`
    });
  }

  // 2. Warning Insight
  if (allMistakes.length > 0) {
    aiInsights.push({
      type: 'WARNING',
      title: 'Procedural Improvement Required',
      description: `We noticed a recurring issue: "${allMistakes[0]}". Review the chemical principles for this step before your next assessment.`
    });
  } else {
    aiInsights.push({
      type: 'POSITIVE',
      title: 'Flawless Execution',
      description: `Our telemetry detected zero procedural mistakes recently. You are well-prepared for more advanced titration scenarios.`
    });
  }

  // 3. Critical Insight
  const failedSession = recent5.find(s => s.status === 'FAILED' || s.status === 'ABORTED');
  if (failedSession) {
    aiInsights.push({
      type: 'CRITICAL',
      title: 'Safety / Protocol Violation',
      description: `A recent session was aborted due to protocol deviations. Please consult the lab manual to rectify your approach.`
    });
  } else if (allMistakes.length > 2) {
    aiInsights.push({
      type: 'CRITICAL',
      title: 'High Error Frequency',
      description: `We detected ${allMistakes.length} individual errors recently. Slow down your execution pace and verify your meniscus readings.`
    });
  } else {
    aiInsights.push({
      type: 'WARNING',
      title: 'Optimization Opportunity',
      description: `While your core protocols are sound, try familiarizing yourself with the workspace layout. Efficient pacing reduces the risk of sample degradation.`
    });
  }

  // Ensure we only return 3 insights max, prioritizing criticals and warnings.
  return aiInsights.sort((a, b) => {
    const weights = { 'CRITICAL': 3, 'WARNING': 2, 'POSITIVE': 1 };
    return weights[b.type] - weights[a.type];
  }).slice(0, 3);
}

/**
 * Chat with the In-Lab Assistant
 */
exports.chatWithAssistant = async (history, context) => {
  const systemPrompt = `
You are 'Dr. Hydro', a helpful AI lab assistant inside a 3D Virtual Chemistry Lab (HydroLab).
The student is currently working on: ${context.topic || context.module || 'a chemistry experiment'}.
Lab Aim: ${context.aim || 'N/A'}
Lab Principle: ${context.principle || 'N/A'}

Rules:
1. Be concise, encouraging, and highly educational.
2. If they ask a direct answer for a quiz or calculation, guide them on HOW to solve it, do not just give the answer.
3. Keep responses conversational and use emojis where appropriate. 
4. STRICT SAFETY PROTOCOL: You must STRICTLY REFUSE to answer any question that is not related to chemistry, science, education, or the current lab.
5. If the user asks anything inappropriate, 18+, political, or irrelevant, reply exactly with: "I am Dr. Hydro, an educational AI. I can only assist you with chemistry and this laboratory experiment. Let's focus on the science!"

${LATEX_FORMATTING_RULES}
`;

  try {
    let messages = history.map(h => ({
      role: h.role === 'assistant' ? 'assistant' : 'user',
      content: h.content
    }));

    messages.unshift({ role: 'system', content: systemPrompt });

    if (process.env.GROQ_API_KEY) {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const completion = await groq.chat.completions.create({
        messages: messages,
        model: 'openai/gpt-oss-120b', // Smartest Llama 3.1 model
        temperature: 0.5,
        max_tokens: 2500
      });
      return completion.choices[0]?.message?.content || "I'm having trouble thinking right now. Please try again later!";
    } else {
      // Fallback to Ollama if no Groq API key is present
      const response = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          messages: messages,
          stream: false,
          options: { temperature: 0.5 }
        })
      });

      if (!response.ok) throw new Error(`Ollama API error: ${response.statusText}`);
      const data = await response.json();
      return data.message?.content || "I'm having trouble thinking right now. Please try again later!";
    }
  } catch (error) {
    console.error('AI Chat Error:', error);
    return "Error connecting to AI: " + (error.message || String(error));
  }
};

/**
 * Generate Adaptive Post-Lab Quiz
 */
exports.generateQuiz = async (moduleName, mistakes) => {
  const prompt = `
You are a chemistry professor creating a post-lab quiz for a student who just completed the ${moduleName} experiment.
During the lab, they made the following mistakes: ${mistakes && mistakes.length > 0 ? JSON.stringify(mistakes) : 'None. They did a great job.'}

CRITICAL RULES:
1. Generate exactly 3 multiple-choice questions.
2. Every single question MUST be STRICTLY and HIGHLY relevant to the ${moduleName} experiment. Do NOT include generic chemistry questions or irrelevant topics.
3. If they made mistakes, base at least 1 or 2 questions directly on correcting those conceptual errors.
4. Return ONLY valid JSON in this exact format, with no markdown formatting:
{
  "quiz": [
    {
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explanation": "..."
    }
  ]
}
`;

  try {
    let content = "";
    if (process.env.GROQ_API_KEY) {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'openai/gpt-oss-120b',
        temperature: 0.2,
        response_format: { type: 'json_object' }
      });
      content = completion.choices[0]?.message?.content || "{}";
    } else {
      const response = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          prompt: prompt,
          format: 'json',
          stream: false,
          options: {
            temperature: 0.2
          }
        })
      });

      if (!response.ok) throw new Error(`Ollama API error: ${response.statusText}`);
      const data = await response.json();
      content = data.response;
    }

    const jsonResult = extractJSON(content) || JSON.parse(content);
    if (jsonResult && jsonResult.quiz) {
      return jsonResult.quiz;
    }

    return [];
  } catch (error) {
    console.error('AI Quiz Generation Error:', error);
    return [];
  }
};

/**
 * Explains a theoretical concept or summarizes a paragraph for a student.
 */
exports.explainTheory = async (text, context, promptType) => {
  const prompt = `
You are an expert, friendly chemistry tutor named Dr. Hydro. 
A student is reading the Lab Manual for: "${context}".
They have highlighted the following text and asked for help:
"${text}"

Task: 
${promptType === 'summarize' ? 'Summarize this text in 1-2 simple sentences.' : 'Explain the underlying chemistry theory behind this concept in detail, but make it easy for a high school student to understand.'}

${LATEX_FORMATTING_RULES}
Respond directly to the student in a helpful, encouraging tone. Keep it extremely concise to save generation time.
`;

  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.5
        }
      })
    });

    if (!response.ok) throw new Error(`Ollama API error: ${response.statusText}`);

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Ollama AI Explain Theory Error:', error);
    throw new AppError('Failed to connect to local AI. Is Ollama running?', 500);
  }
};

/**
 * Generates Faculty Insights based on class analytics
 * Uses a highly detailed rule-based algorithm to ensure instantaneous dashboard loading.
 */
exports.generateFacultyInsights = async (analyticsData) => {
  if (!analyticsData || analyticsData.length === 0) {
    return {
      classPulse: "Insufficient data to generate a class pulse. Encourage your students to complete more sessions.",
      earlyWarnings: []
    };
  }

  // 1. Calculate Class Pulse
  const totalStudents = analyticsData.length;
  const avgScore = analyticsData.reduce((acc, curr) => acc + curr.avgScore, 0) / totalStudents;
  const avgAccuracy = analyticsData.reduce((acc, curr) => acc + curr.avgAccuracy, 0) / totalStudents;

  // Aggregate top mistakes across the class
  const allMistakes = {};
  let totalFailures = 0;

  analyticsData.forEach(student => {
    totalFailures += (student.totalSessions - (student.passedSessions || 0));
    if (student.topMistakes && student.topMistakes.length > 0) {
      student.topMistakes.forEach(m => {
        allMistakes[m.mistake] = (allMistakes[m.mistake] || 0) + m.count;
      });
    }
  });

  const sortedMistakes = Object.entries(allMistakes).sort((a, b) => b[1] - a[1]);
  const mostCommonMistake = sortedMistakes.length > 0 ? sortedMistakes[0][0] : null;

  let classPulse = "";
  if (avgScore >= 80) {
    classPulse = `The cohort is performing exceptionally well with an average score of ${Math.round(avgScore)}%. `;
  } else if (avgScore >= 60) {
    classPulse = `The class shows steady progress with an average score of ${Math.round(avgScore)}%. `;
  } else {
    classPulse = `The class is currently struggling, averaging a score of ${Math.round(avgScore)}%. `;
  }

  if (mostCommonMistake) {
    classPulse += `However, a significant portion of the class is struggling with "${mostCommonMistake}". Consider dedicating time to review this procedure.`;
  } else if (totalFailures === 0) {
    classPulse += `Remarkably, there have been zero failed sessions recently. The current teaching strategy is highly effective.`;
  } else {
    classPulse += `Overall accuracy is at ${Math.round(avgAccuracy)}%, indicating a solid grasp of fundamental protocols.`;
  }

  // 2. Calculate Early Warnings (At-Risk Students)
  const earlyWarnings = [];

  analyticsData.forEach(student => {
    const failedSessions = student.totalSessions - (student.passedSessions || 0);
    const failureRate = student.totalSessions > 0 ? failedSessions / student.totalSessions : 0;

    if (failureRate >= 0.5 && student.totalSessions >= 2) {
      earlyWarnings.push({
        name: student.name,
        email: student.email,
        reason: `Has failed ${failedSessions} out of ${student.totalSessions} sessions.`
      });
    } else if (student.avgAccuracy < 50 && student.totalSessions >= 1) {
      earlyWarnings.push({
        name: student.name,
        email: student.email,
        reason: `Critically low accuracy (${student.avgAccuracy}%).`
      });
    }
  });

  // Sort by most at risk (highest failure rate first)
  earlyWarnings.sort((a, b) => {
    const aFail = parseInt(a.reason.match(/\d+/)?.[0] || '0');
    const bFail = parseInt(b.reason.match(/\d+/)?.[0] || '0');
    return bFail - aFail;
  });

  return {
    classPulse,
    earlyWarnings: earlyWarnings.slice(0, 3) // Return top 3 at-risk
  };
};

/**
 * Generate Structured Lab Manual using Ollama or Groq
 */
exports.generateLabManual = async (topic, curriculumLevel, documentType, engine = 'ollama') => {
  const prompt = `
You are Dr. Hydro, a world-class chemistry curriculum designer and laboratory expert.
Your task is to generate a highly detailed, extremely comprehensive ${documentType} for the experiment: "${topic}".
The target academic audience is: ${curriculumLevel}. 
You must adjust the depth, complexity, and terminology perfectly for this level.

If it is a "Worksheet", focus on fill-in-the-blank style spaces, questions, and data collection.
If it is a "Full Lab Report Guide", provide exhaustive theoretical background, rigorous procedures, and deep data analysis.
If it is a "Experiment Plan (Teacher)", include pedagogical goals, common pitfalls, prep instructions, and expected results.

Your output MUST be a valid JSON object matching this exact structure:
{
  "theory": "Extensive, highly detailed theoretical background. Explain the underlying chemistry, equations, mechanisms, real-world applications, and historical context. Use KaTeX for ALL math and chemical formulas (e.g. $H_2O$ or $$...$$). Write 4-5 long paragraphs as a single string, using \\n\\n for line breaks. Make it perfectly tailored to the requested document type.",
  "safetyPrecautions": [
    "Precise hazard statement 1 (e.g. molarity, toxicity)",
    "Precise hazard statement 2 with PPE required",
    "Precise hazard statement 3"
  ],
  "procedure": [
    "Step 1: Extremely detailed action with exact volumes, temperatures, and equipment.",
    "Step 2: Highly specific observation to look out for...",
    "Step 3: What to do next in deep detail...",
    "Step 4: Additional step...",
    "Step 5: Additional step..."
  ],
  "observationTable": {
    "columns": ["Observation No.", "Detailed Column 1 (units)", "Detailed Column 2 (units)", "Detailed Column 3 (units)"],
    "rows": [
      ["1", "", "", ""],
      ["2", "", "", ""]
    ]
  },
  "calculations": [
    "Step-by-step calculation guide...",
    "Detailed example equation: $equation$",
    "Error analysis and meaning of variables..."
  ]
}

CRITICAL: Return ONLY valid JSON. No markdown wrappers, no introductory text, no conversational text. ONLY JSON.
  `.trim();

  let jsonStr = '';

  if (engine === 'groq') {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('Groq API Key is missing in the server configuration.');
    }
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    try {
      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'openai/gpt-oss-120b', // Fast and powerful
        response_format: { type: 'json_object' },
        max_tokens: 7000
      });
      jsonStr = completion.choices[0]?.message?.content || '{}';
    } catch (err) {
      console.error('Groq AI Error:', err);
      throw new AppError('Failed to generate with Groq. Check your API key or limits.', 500);
    }
  } else {
    // Fallback to Ollama
    try {
      const response = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          prompt: prompt,
          stream: false,
          format: 'json',
          options: { temperature: 0.3 }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API Error: ${response.statusText}`);
      }

      const data = await response.json();
      jsonStr = data.response;
    } catch (err) {
      console.error('Ollama AI Generate Lab Error:', err);
      throw new AppError('Failed to generate lab manual. Ensure Ollama is running.', 500);
    }
  }

  try {
    const jsonResult = extractJSON(jsonStr) || JSON.parse(jsonStr);
    return jsonResult;
  } catch (err) {
    console.error("AI Output is not valid JSON:", jsonStr);
    throw new AppError("AI generated invalid JSON", 500);
  }
};

/**
 * Generate Dr. HydroAI Trends (Literature & Trend Mining)
 */
exports.generateLiteratureTrends = async (topic, engine = 'groq') => {
  const prompt = `
You are Dr. HydroAI, a world-class chemistry research analyst and trend mining expert.
Your task is to analyze the recent literature (last 3-5 years) for the following topic: "${topic}".

You must extract and synthesize information to power our Quantitative Trend Visualizations, Automated Technical Summaries, and Grounded Source Verification.

Your output MUST be a valid JSON object matching this exact structure:
{
  "technicalSummary": {
    "overview": "A comprehensive paragraph summarizing the recent advances and open problems in this field.",
    "methodologies": ["Trending method 1", "Trending method 2", "Method 3"],
    "limitations": ["Common limitation 1", "Limitation 2"]
  },
  "quantitativeTrends": {
    "yieldTrends": [
      {"year": "2020", "averageYield": 65},
      {"year": "2021", "averageYield": 70},
      {"year": "2022", "averageYield": 78},
      {"year": "2023", "averageYield": 82},
      {"year": "2024", "averageYield": 88}
    ],
    "reagentPopularity": [
      {"name": "Reagent A", "usagePercentage": 45},
      {"name": "Reagent B", "usagePercentage": 30},
      {"name": "Reagent C", "usagePercentage": 25}
    ],
    "solventLandscape": [
      {"name": "Water", "value": 50},
      {"name": "Ethanol", "value": 30},
      {"name": "Methanol", "value": 20}
    ]
  },
  "citations": [
    {
      "title": "Title of a highly cited recent paper",
      "authors": "Author A, Author B",
      "journal": "Journal of XYZ",
      "year": 2023,
      "doi": "10.xxxx/yyyy",
      "grounded": true
    },
    {
      "title": "Another recent paper",
      "authors": "Author C, Author D",
      "journal": "ABC Chemistry",
      "year": 2024,
      "doi": "10.xxxx/zzzz",
      "grounded": true
    }
  ]
}

CRITICAL: Return ONLY valid JSON. No markdown wrappers, no introductory text. Fill the arrays with highly realistic data for the topic.
  `.trim();

  let jsonStr = '';

  if (engine === 'groq') {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('Groq API Key is missing in the server configuration.');
    }
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    try {
      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'openai/gpt-oss-120b', // Fast and powerful
        response_format: { type: 'json_object' },
        max_tokens: 7000
      });
      jsonStr = completion.choices[0]?.message?.content || '{}';
    } catch (err) {
      console.error('Groq AI Error:', err);
      throw new AppError('Failed to generate trends with Groq. Check your API key or limits.', 500);
    }
  } else {
    // Fallback to Ollama
    try {
      const response = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          prompt: prompt,
          stream: false,
          format: 'json',
          options: { temperature: 0.3 }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API Error: ${response.statusText}`);
      }

      const data = await response.json();
      jsonStr = data.response;
    } catch (err) {
      console.error('Ollama AI Generate Trends Error:', err);
      throw new AppError('Failed to generate trends. Ensure Ollama is running.', 500);
    }
  }

  try {
    const jsonResult = extractJSON(jsonStr) || JSON.parse(jsonStr);
    return jsonResult;
  } catch (err) {
    console.error("AI Output is not valid JSON:", jsonStr);
    throw new AppError("AI generated invalid JSON", 500);
  }
};

exports.generateRetrosynthesis = async (targetMolecule, engine = 'groq') => {
  let jsonStr = '';

  const prompt = `You are a world-class organic chemist and AI Retrosynthesis Planner.
Your task is to analyze the following target molecule and exhaustively provide ALL distinct, highly accurate retrosynthetic routes (as many as are synthetically viable) all the way back to commercially available starting materials. Do not limit the number of routes.
Target Molecule: "${targetMolecule}"

${LATEX_FORMATTING_RULES}

You MUST output your response strictly as a JSON object matching this exact schema, with no markdown formatting, no code blocks, and no extra text outside the JSON:

{
  "target": "Molecule Name",
  "routes": [
    {
      "name": "Route Name (e.g., Anthraquinone Process)",
      "viability": 90,
      "stepsCount": 2,
      "startingMaterialsCount": 3,
      "finalStartingMaterials": [
        { "name": "Material 1", "formula": "C16H12O2", "textRep": "" },
        { "name": "Hydrogen", "formula": "H2", "textRep": "H H" }
      ],
      "pathway": [
        {
          "step": 1,
          "reactant": { "name": "Reactant Name", "formula": "C16H12O2" },
          "product": { "name": "Product Name", "formula": "C16H14O2" },
          "reagents": "None specified or Reagent details",
          "catalysts": "Pd/Al2O3 or None",
          "temperature": "40-50°C",
          "reactionType": "Catalytic Hydrogenation",
          "reference": "DOI or Journal ref",
          "mechanism": "Brief 1-2 sentence mechanism description",
          "relevance": "Brief explanation of why this step is used"
        }
      ]
    }
  ]
}

CRITICAL RULES:
1. Ensure the pathway goes forwards synthetically (Step 1 is the first reaction from starting materials, Step N is the final reaction forming the target).
2. Go all the way from commercially available starting materials to the target.
3. Be highly chemically accurate. Provide realistic conditions and catalysts.
4. "textRep" is a simple ASCII representation for small molecules (e.g., "H H" for H2, "O=O" for O2). Leave it empty "" for complex organic molecules.
4. Output strictly valid JSON. Do not wrap in \`\`\`json.`;

  if (engine === 'groq') {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('Groq API Key is missing in the server configuration.');
    }
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    try {
      const response = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'openai/gpt-oss-120b',
        temperature: 0.2,
        response_format: { type: 'json_object' }
      });
      jsonStr = response.choices[0]?.message?.content || '';
    } catch (err) {
      console.error('Groq AI Retrosynthesis Error:', err);
      throw new AppError('Failed to communicate with Groq AI for Retrosynthesis.', 500);
    }
  } else if (engine === 'ollama') {
    try {
      const response = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          prompt: prompt,
          stream: false,
        })
      });
      const data = await response.json();
      jsonStr = data.response;
    } catch (err) {
      console.error('Ollama AI Retrosynthesis Error:', err);
      throw new AppError('Failed to generate retrosynthesis. Ensure Ollama is running.', 500);
    }
  }

  try {
    const jsonResult = extractJSON(jsonStr) || JSON.parse(jsonStr);
    return jsonResult;
  } catch (err) {
    console.error("AI Output is not valid JSON:", jsonStr);
    throw new AppError("AI generated invalid JSON", 500);
  }
};

/**
 * Evaluates real students and generates AI commentary for the leaderboard.
 */
exports.generateAILeaderboard = async (realStudents, engine = 'groq') => {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // We only send minimal data to AI for commentary generation
    const studentDataForAI = realStudents.map(s => ({
      name: s.name,
      rank: s.rank,
      avgScore: s.avgScore
    }));

    const prompt = `
You are Dr. HydroAI, the AI evaluator of a virtual chemistry lab.
Here is the ranked telemetry data of students:
${JSON.stringify(studentDataForAI, null, 2)}

Your task is strictly to provide a short 1-sentence personalized "aiCommentary" for each student.
Snarky, encouraging, or analytical comments from Dr. Hydro.

Return a JSON array of objects with exactly two fields:
- "name": String (exact match from the input)
- "aiCommentary": String

Return ONLY valid JSON. Do not include markdown formatting or backticks. Just the raw JSON array.
    `;

    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'openai/gpt-oss-120b',
      temperature: 0.7,
      max_tokens: 1500,
    });

    const output = response.choices[0]?.message?.content || '[]';
    console.log('Raw Groq Output:', output);

    let commentsArray = [];
    const match = output.match(/\[[\s\S]*\]/);
    if (match) {
      commentsArray = JSON.parse(match[0]) || [];
    } else {
      const jsonStr = output.replace(/```json/g, '').replace(/```/g, '').trim();
      commentsArray = JSON.parse(jsonStr) || [];
    }

    // Merge AI comments with original data
    return realStudents.map(student => {
      const aiResponse = commentsArray.find(c => c.name === student.name);
      return {
        ...student,
        aiCommentary: aiResponse ? aiResponse.aiCommentary : "Analysis complete. Keep experimenting!"
      };
    });
  } catch (error) {
    console.error('Failed to generate AI leaderboard commentary:', error);
    // Fallback: Return original data with default commentary if AI fails
    return realStudents.map(student => ({
      ...student,
      aiCommentary: "Data analyzed. Continue your laboratory work."
    }));
  }
};

exports.generateCompoundInfo = async (query) => {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const prompt = `You are Dr. HydroAI, a chemistry expert. Provide a structured overview of the chemical element or compound: "${query}".
Return a strict JSON object with EXACTLY these keys:
- "overview": A 3-sentence summary of what it is and what it's used for.
- "stseContext": A short phrase about its Environmental, Social or Technological context (e.g. "Environmental Pollution").
- "commonUses": String (e.g. "Batteries, Pigments").
- "hazards": A 1-sentence warning about its dangers.
- "oxidationStates": String listing common oxidation states (e.g. "-2, 0, +1, +2").
- "commonIons": String listing common ions (e.g. "Cd2+").
- "keyIsotopes": Array of objects: [{"isotope": "110Cd", "neutrons": 62, "stability": "STABLE"}]. Max 2 isotopes.
- "atomicRadius": String (e.g. "161 pm").
- "discoveryYear": String (e.g. "1817").

Return ONLY valid JSON.`;

    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'openai/gpt-oss-120b',
      temperature: 0.2,
      max_tokens: 2500,
    });

    const output = response.choices[0]?.message?.content || '{}';
    const jsonStr = output.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Failed to generate compound info:', error);
    return {
      overview: "Information unavailable.",
      stseContext: "Unknown",
      commonUses: "Unknown",
      hazards: "Unknown",
      oxidationStates: "Unknown",
      commonIons: "Unknown",
      keyIsotopes: [],
      atomicRadius: "Unknown",
      discoveryYear: "Unknown"
    };
  }
};

exports.chatAboutCompound = async (query, message, history = []) => {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const messages = [
      { role: 'system', content: `You are Dr. HydroAI. You are currently discussing the chemical/element: ${query}. You are an expert in chemistry, specifically relating to atomic structure, crystal lattices, electron configurations, isotopes, and radioactive decay. Answer any questions about elements, isotopes, structure, and crystals relevantly and accurately. Be concise, helpful, and slightly snarky. ${LATEX_FORMATTING_RULES}` },
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message }
    ];

    const response = await groq.chat.completions.create({
      messages,
      model: 'openai/gpt-oss-120b',
      temperature: 0.7,
      max_tokens: 2500,
    });

    return { reply: response.choices[0]?.message?.content || "I cannot compute that right now." };
  } catch (error) {
    console.error('Failed to chat about compound:', error);
    return { reply: "Connection to Dr. Hydro interrupted." };
  }
};

exports.chatAboutBeaker = async (message, history = [], context = {}) => {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const { elements = [], analysisMode = 'synthesis', aiResult = null } = context;

    let beakerContextStr = `The user is in ${analysisMode} mode.`;
    if (elements.length > 0) {
      beakerContextStr += ` Elements in the beaker/target: ${elements.join(', ')}.`;
    } else {
      beakerContextStr += ` The beaker is empty.`;
    }

    if (aiResult) {
      if (aiResult.isValid) {
        beakerContextStr += ` The reaction successfully formed ${aiResult.name} (${aiResult.formula}). Properties: ${JSON.stringify(aiResult.properties || {})}. Thermodynamics: ${JSON.stringify(aiResult.thermodynamics || {})}. Explanation: ${aiResult.explanation}.`;
      } else {
        beakerContextStr += ` The reaction failed. Explanation: ${aiResult.explanation}.`;
      }
    }

    const messages = [
      { role: 'system', content: `You are Dr. HydroAI, a brilliant chemistry assistant. ${beakerContextStr} Answer the user's questions about this specific context. Be concise, helpful, and slightly snarky. ${LATEX_FORMATTING_RULES}` },
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message }
    ];

    const response = await groq.chat.completions.create({
      messages,
      model: 'openai/gpt-oss-120b',
      temperature: 0.7,
      max_tokens: 2500,
    });

    return { reply: response.choices[0]?.message?.content || "I cannot compute that right now." };
  } catch (error) {
    console.error('Failed to chat about beaker:', error);
    return { reply: "Connection to Dr. Hydro interrupted." };
  }
};

exports.simulateReaction = async (elementsOrTarget, conditions = {}, engine = 'groq', analysisMode = 'synthesis') => {
  // Easter Egg: System Design
  if (analysisMode === 'retrosynthesis' && (elementsOrTarget.toLowerCase() === 'system design' || elementsOrTarget.toLowerCase() === 'hydrolab')) {
    return {
      isValid: true,
      name: "HydroLab - 3D Architecture",
      formula: "REACT-NODE-AI",
      explanation: "## System Design: HydroLab - 3D\n\n**Frontend:** Built with React, Vite, and Zustand for state management. Uses `@react-three/fiber` for the 3D WebGL Canvas to render atoms and bonds dynamically.\n\n**Backend:** Node.js + Express server acts as a secure API Gateway and AI prompt orchestrator. MongoDB handles user profiles and the gamified leaderboard.\n\n**AI Inference Layer:** Dr. Hydro is powered by the `llama-3.1-70b-versatile` model hosted on the Groq LPU API for ultra-low latency inference, with an Ollama fallback. The backend enforces strict JSON schema generation to map LLM text directly to 3D coordinate space.\n\n**Data Flow:**\n1. User inputs constraints in React.\n2. Express constructs a strict chemistry prompt.\n3. Groq generates molecular coordinates & Markdown.\n4. React parses the JSON and renders the 3D spheres (Atoms) and cylinders (Bonds) instantly.",
      nfpa: { health: 0, fire: 0, reactivity: 0, special: "AI" },
      reactantsNeeded: ["React", "Node.js", "Three.js", "Groq LPU"],
      atoms: [
        { id: "A1", symbol: "C", position: [0, 0, 0] },
        { id: "A2", symbol: "H", position: [1, 1, 1] },
        { id: "A3", symbol: "O", position: [-1, -1, -1] }
      ],
      bonds: [
        { id: "B1", sourceId: "A1", targetId: "A2" },
        { id: "B2", sourceId: "A1", targetId: "A3" }
      ]
    };
  }

  try {
    let prompt = '';

    if (analysisMode === 'retrosynthesis') {
      prompt = `You are Dr. HydroAI, an expert in retrosynthetic analysis.
The user wants to synthesize the target molecule: "${elementsOrTarget}".
Provide a retrosynthetic pathway. Break it down into simpler precursor reactants.
Also provide the molecular structure in 3D (VSEPR theory), bounding positions roughly between -2 and 2 in x,y,z coordinates. Assign unique IDs to each atom and bond.
You MUST output your response strictly as a JSON object matching this schema:
{
  "isValid": true,
  "name": "Target Molecule Name",
  "smiles": "SMILES string of the target molecule",
  "formula": "Target Formula",
  "explanation": "A highly detailed, structured explanation using Markdown (bolding, bullet points, headers) of the retrosynthetic pathway and conditions needed.",
  "reactantsNeeded": ["Reactant 1", "Reactant 2"],
  "retrosynthesisTree": {
    "nodes": [
      { 
        "id": "1", 
        "data": { 
          "label": "Target Molecule", 
          "molecularWeight": "e.g. 180.16 g/mol", 
          "iupacName": "e.g. 2-acetoxybenzoic acid" 
        }, 
        "position": { "x": 0, "y": 0 } 
      },
      { 
        "id": "2", 
        "data": { 
          "label": "Precursor 1",
          "molecularWeight": "...",
          "iupacName": "..."
        }, 
        "position": { "x": 0, "y": 100 } 
      }
    ],
    "edges": [
      { 
        "id": "e1-2", 
        "source": "2", 
        "target": "1", 
        "label": "Reaction Name", 
        "animated": true,
        "data": {
          "temperature": "e.g. 80°C",
          "solvent": "e.g. THF",
          "catalyst": "e.g. Pd/C",
          "yield": "e.g. 85%"
        }
      }
    ]
  },
  "atoms": [
    { "id": "AtomID", "symbol": "Symbol", "position": [x, y, z] }
  ],
  "bonds": [
    { "id": "BondID", "sourceId": "AtomID1", "targetId": "AtomID2", "order": 1 }
  ]
}
${LATEX_FORMATTING_RULES}
Only return valid JSON. Ensure 'retrosynthesisTree' nodes form a directed graph from precursors (sources) to target (target) positioned chronologically downward (y coordinate increases).`;
    } else if (analysisMode === 'spectroscopy') {
      prompt = `You are Dr. HydroAI, a highly accurate chemistry engine and spectroscopist.
I am providing you an array of element symbols: ${JSON.stringify(elementsOrTarget)}.
Determine what molecule they form. Then, predict its spectroscopic and physical properties.
You MUST output your response strictly as a JSON object matching this schema:
{
  "isValid": boolean,
  "name": "Molecule Name or None",
  "smiles": "SMILES string of the molecule or None",
  "formula": "Chemical Formula or None",
  "explanation": "Explanation of the molecule and its key spectroscopic signatures.",
  "properties": {
    "boilingPoint": "e.g. 100°C",
    "polarity": "e.g. Polar",
    "irPeaks": "e.g. Broad peak at 3200-3600 cm-1 (O-H stretch)",
    "nmrShifts": "e.g. 1H NMR: singlet at 4.7 ppm",
    "irGraph": [
      { "wavenumber": 3400, "transmittance": 10, "assignment": "O-H broad stretch" },
      { "wavenumber": 1700, "transmittance": 15, "assignment": "C=O stretch" }
    ],
    "nmrGraph": [
      { "ppm": 7.2, "intensity": 100, "assignment": "Aromatic protons" },
      { "ppm": 2.1, "intensity": 60, "assignment": "Methyl protons" }
    ]
  },
  "atoms": [ { "id": "AtomID", "symbol": "Symbol", "position": [x, y, z] } ],
  "bonds": [ { "id": "BondID", "sourceId": "AtomID1", "targetId": "AtomID2", "order": 1 } ]
}
${LATEX_FORMATTING_RULES}
Only return valid JSON.`;
    } else {
      // Default: synthesis
      prompt = `You are Dr. HydroAI, a highly accurate chemistry engine.
I am providing you an array of element symbols that a user dropped into a beaker: ${JSON.stringify(elementsOrTarget)}.
The reaction conditions are: Temperature: ${conditions.temperature || 25}°C, Pressure: ${conditions.pressure || 1} atm, Solvent: ${conditions.solvent || 'None'}.

Determine if these exact elements can form a stable, common molecule under these specific conditions. Take activation energy into account (e.g. H2 and O2 won't react at 25C without a spark/catalyst).
If yes, provide the molecular structure in 3D (VSEPR theory), bounding positions roughly between -2 and 2 in x,y,z coordinates. Assign unique IDs to each atom and bond. Also predict its spectroscopic and physical properties.
If no, explain why they don't react (e.g. noble gases, incompatible valences, or insufficient temperature/activation energy).

You MUST output your response strictly as a JSON object matching this exact schema:
{
  "isValid": boolean,
  "name": "Molecule Name or None",
  "smiles": "SMILES string of the molecule or None",
  "formula": "Chemical Formula or None",
  "explanation": "A 2-3 sentence educational explanation of the reaction or why it failed under these conditions.",
  "thermodynamics": {
    "isExothermic": boolean,
    "enthalpyDelta": "Approximate delta H in kJ/mol (e.g. -286 kJ/mol)",
    "activationEnergy": "Approximate Ea in kJ/mol (number only, e.g. 50)"
  },
  "properties": {
    "boilingPoint": "e.g. 100°C",
    "polarity": "e.g. Polar",
    "irPeaks": "e.g. Broad peak at 3200-3600 cm-1 (O-H stretch)",
    "nmrShifts": "e.g. 1H NMR: singlet at 4.7 ppm",
    "irGraph": [
      { "wavenumber": 3400, "transmittance": 10, "assignment": "O-H broad stretch" }
    ],
    "nmrGraph": [
      { "ppm": 7.2, "intensity": 100, "assignment": "Aromatic protons" }
    ]
  },
  "atoms": [
    { "id": "AtomID", "symbol": "Symbol", "position": [x, y, z] }
  ],
  "bonds": [
    { "id": "BondID", "sourceId": "AtomID1", "targetId": "AtomID2", "order": 1 }
  ]
}

${LATEX_FORMATTING_RULES}
Only return valid JSON without any markdown formatting, no backticks, no code blocks.`;
    }

    let resultObj;
    if (engine === 'groq' && process.env.GROQ_API_KEY) {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const response = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'openai/gpt-oss-120b',
        temperature: 0.1,
        max_tokens: 8000,
        response_format: { type: 'json_object' }
      });

      const jsonStr = response.choices[0]?.message?.content || '{}';
      resultObj = extractJSON(jsonStr) || JSON.parse(jsonStr);
    } else {
      const response = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          prompt: prompt,
          format: 'json',
          stream: false,
          options: { temperature: 0.1 }
        })
      });
      const data = await response.json();
      resultObj = extractJSON(data.response) || JSON.parse(data.response);
    }

    // Replace LLM 3D coordinates with actual mathematically perfect coordinates
    if (resultObj && resultObj.isValid && resultObj.name && resultObj.name.toLowerCase() !== 'none') {
      const accurateData = await fetchAccurate3D(resultObj.name, resultObj.smiles !== 'None' ? resultObj.smiles : null);
      if (accurateData) {
        resultObj.atoms = accurateData.atoms;
        resultObj.bonds = accurateData.bonds;
      }
    }

    return resultObj;
  } catch (error) {
    console.error('Failed to simulate reaction:', error);
    return {
      isValid: false,
      name: "Error",
      formula: "",
      explanation: "Failed to connect to the chemistry engine.",
      atoms: [],
      bonds: []
    };
  }
};

