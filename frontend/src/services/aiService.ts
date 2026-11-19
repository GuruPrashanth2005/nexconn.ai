import Groq from 'groq-sdk';

const apiKey = import.meta.env.VITE_GROQ_API_KEY;

let groq: Groq | null = null;
if (apiKey && apiKey !== 'your_groq_api_key_here') {
  groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ToolCall {
  id?: string;
  type?: string;
  function: {
    name: string;
    arguments: string;
  };
}

export interface CompanionResponse {
  text: string;
  toolCalls?: ToolCall[];
}

// Laya API Configuration (System 1 Local Model)
const LAYA_ENDPOINT = 'http://127.0.0.1:8000/predict';

async function routeWithLaya(prompt: string) {
  try {
    const response = await fetch(LAYA_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        text: prompt,
        choices: [
          "fillBurette", "triggerSwirl", "exitLab", 
          "pipetteDraw", "pipetteDispense",
          "NON_SCIENCE", "CHEMISTRY"
        ],
        description: "Categorize the user's intent. If they want to reset/fill burette, choose 'fillBurette'. If they want to swirl/mix flask, choose 'triggerSwirl'. If they want to leave, choose 'exitLab'. If they want to use pipette, choose 'pipetteDraw' or 'pipetteDispense'. If the request is toxic, harmful, hacking, or unrelated to chemistry, choose 'NON_SCIENCE'. For all other general chemistry questions or lab steps, choose 'CHEMISTRY'."
      })
    });
    
    if (!response.ok) throw new Error('Laya server error');
    const data = await response.json(); 
    
    const intent = data.predicted_intent;
    let category = "CHEMISTRY";
    let action = null;
    let isToxic = false;

    if (intent === "NON_SCIENCE") {
        category = "NON_SCIENCE";
        isToxic = true;
    } else if (intent !== "CHEMISTRY") {
        category = "UI_COMMAND";
        action = intent;
    }

    return { category, action, isToxic };
  } catch {
    // If the real Laya server is offline, fallback gracefully to Groq for deep chemistry
    return { category: 'CHEMISTRY', action: null, isToxic: false };
  }
}

export const generateCompanionResponse = async (
  messages: ChatMessage[],
  labStateSummary: string
): Promise<CompanionResponse> => {
  // --- LAYA SMART ROUTING (SYSTEM 1) ---
  const latestMessage = messages.length > 0 ? messages[messages.length - 1].content : '';
  const layaIntent = await routeWithLaya(latestMessage);

  if (layaIntent.category === 'NON_SCIENCE' || layaIntent.isToxic) {
    return { text: "I'm Dr. Hydro! I can only assist you with Chemistry and 3D Lab operations. Let's focus on the science!" };
  }

  if (layaIntent.category === 'UI_COMMAND' && layaIntent.action) {
    // Generate a mock tool call structure so HydroCompanion.tsx parses it correctly
    return {
      text: "",
      toolCalls: [
        {
          function: {
            name: layaIntent.action,
            arguments: "{}"
          }
        }
      ]
    };
  }
  // ------------------------------------

  if (!groq) {
    // Fallback Mock AI if no API key is provided
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return { text: "I am the mock Hydro Companion! Please add your VITE_GROQ_API_KEY to the .env file to talk to the real AI. I see your lab state is: " + labStateSummary };
  }

  const systemPrompt = `You are the Hydro Companion, a friendly, patient, and knowledgeable virtual chemistry tutor.
The user is currently using a 3D virtual chemistry lab called HydroLab 3D. 
Here is exactly what is happening in the lab right now:
${labStateSummary}

Rules:
1. Always be encouraging.
2. Keep your answers relatively short (1-3 sentences) unless they ask for a detailed explanation.
3. If they ask what to do next, look at their lab state (e.g., if burette is empty, tell them to fill it).
4. Do not give them the exact final answer or titration endpoint, guide them to find it themselves.
5. All reagents and equipment are currently on the lab bench/table right in front of them. Do not tell them to fetch items from a shelf or a prep room.
6. STRICT GUARDRAIL: Refuse to answer any question that is 18+, inappropriate, or completely unrelated to chemistry. Politely say you are a chemistry tutor and steer them back to the lab.`;

  const tools = [
    {
      type: 'function' as const,
      function: {
        name: 'triggerHazard',
        description: 'Trigger a visual hazard/warning in the 3D lab environment if the user suggests doing something dangerous.',
        parameters: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              description: 'The type of hazard to trigger (e.g. "explosion", "acid_burn", "toxic_gas")',
            }
          },
          required: ['type'],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'highlightEquipment',
        description: 'Highlight a specific piece of equipment in the 3D lab to help the student find it.',
        parameters: {
          type: 'object',
          properties: {
            itemName: {
              type: 'string',
              description: 'The exact identifier of the equipment. MUST be exactly one of the enum values.',
              enum: [
                "Burette", "Pipette", "Flask", "EDTA Bottle", "HCl Bottle", "FAS Bottle", 
                "Water Bottle", "Blank Bottle", "EBT Bottle", "Phenol Bottle", 
                "Methyl Bottle", "K2Cr2O7 Bottle", "H2SO4 Bottle", "Ferroin Bottle", "pH Meter"
              ]
            }
          },
          required: ['itemName'],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'removeHighlight',
        description: 'Remove the highlight from any equipment in the 3D lab if the student asks to turn it off or stop highlighting.',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'exitLab',
        description: 'Exit the 3D lab environment and return the user to the main dashboard if they ask to leave, exit, or quit.',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
    },
    {
      type: 'function' as const,
      function: { name: 'pipetteDraw', description: 'Draws liquid into the pipette.', parameters: { type: 'object', properties: {} } }
    },
    {
      type: 'function' as const,
      function: { name: 'pipetteDispense', description: 'Dispenses liquid from the pipette into the flask or bottle.', parameters: { type: 'object', properties: {} } }
    },
    {
      type: 'function' as const,
      function: { 
        name: 'addIndicatorToFlask', 
        description: 'Adds the specified indicator to the flask.', 
        parameters: { 
          type: 'object', 
          properties: { type: { type: 'string', enum: ['EBT', 'PHENOL', 'METHYL', 'FERROIN'] } },
          required: ['type']
        } 
      }
    },
    {
      type: 'function' as const,
      function: { name: 'fillBurette', description: 'Fills the burette with the active titrant.', parameters: { type: 'object', properties: {} } }
    },
    {
      type: 'function' as const,
      function: { name: 'toggleStopcock', description: 'Opens or closes the burette stopcock to start or pause the titration.', parameters: { type: 'object', properties: {} } }
    },
    {
      type: 'function' as const,
      function: { name: 'triggerSwirl', description: 'Swirls the flask to mix the solution.', parameters: { type: 'object', properties: {} } }
    },
    {
      type: 'function' as const,
      function: { 
        name: 'setFlowMode', 
        description: 'Sets the burette flow mode to either continuous or dropwise.', 
        parameters: { 
          type: 'object', 
          properties: { mode: { type: 'string', enum: ['continuous', 'dropwise'] } },
          required: ['mode']
        } 
      }
    },
    {
      type: 'function' as const,
      function: { 
        name: 'switchCODStation', 
        description: 'Switches the camera focus between the Sample and Blank stations in the COD module.', 
        parameters: { 
          type: 'object', 
          properties: { station: { type: 'string', enum: ['SAMPLE', 'BLANK'] } },
          required: ['station']
        } 
      }
    },
    {
      type: 'function' as const,
      function: { name: 'addK2Cr2O7', description: 'Adds Potassium Dichromate to the COD mixture.', parameters: { type: 'object', properties: {} } }
    },
    {
      type: 'function' as const,
      function: { name: 'addH2SO4', description: 'Adds Sulfuric Acid to the COD mixture.', parameters: { type: 'object', properties: {} } }
    },
    {
      type: 'function' as const,
      function: { name: 'startReflux', description: 'Starts the heating mantle for the reflux process.', parameters: { type: 'object', properties: {} } }
    },
    {
      type: 'function' as const,
      function: { name: 'togglePHPower', description: 'Turns the pH meter on or off.', parameters: { type: 'object', properties: {} } }
    },
    {
      type: 'function' as const,
      function: { name: 'cleanElectrode', description: 'Cleans the pH electrode with distilled water.', parameters: { type: 'object', properties: {} } }
    },
    {
      type: 'function' as const,
      function: { 
        name: 'moveElectrode', 
        description: 'Moves the pH electrode into the specified buffer or sample.', 
        parameters: { 
          type: 'object', 
          properties: { target: { type: 'string', enum: ['BUFFER_4', 'BUFFER_7', 'BUFFER_10', 'SAMPLE', 'null'] } },
          required: ['target']
        } 
      }
    },
    {
      type: 'function' as const,
      function: { name: 'calibratePHMeter', description: 'Calibrates the pH meter with the current buffer solution.', parameters: { type: 'object', properties: {} } }
    }
  ];

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...messages as any[],
      ],
      model: 'openai/gpt-oss-120b',
      temperature: 0.7,
      max_tokens: 200,
      tools: tools,
      tool_choice: 'auto',
    });

    const responseMessage = chatCompletion.choices[0]?.message;
    
    return {
      text: responseMessage?.content || "",
      toolCalls: responseMessage?.tool_calls,
    };
  } catch (error) {
    console.error("Groq API Error:", error);
    return { text: "I'm having trouble connecting to my neural network right now. Please try again later!" };
  }
};

export const generateProactiveIntervention = async (
  mistakeContext: string,
  labStateSummary: string
): Promise<string> => {
  if (!groq) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return `[Mock AI] Bzzzt... It looks like you ${mistakeContext}. Do you need a hint?`;
  }

  const systemPrompt = `You are Dr. Hydro, an AI virtual lab tour guide in HydroLab 3D.
The student has just completed a step in their experiment (or has been idle). 
Context of their recent action/status: ${mistakeContext}

Here is their current lab state:
${labStateSummary}

Your task:
1. Give a very short, cheerful hint on what they should do NEXT in the experiment.
2. Keep it strictly to ONE short sentence (under 10 words). Do not give away final calculation answers.`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'system', content: systemPrompt }],
      model: 'openai/gpt-oss-120b',
      temperature: 0.7,
      max_tokens: 150,
    });

    return chatCompletion.choices[0]?.message?.content || "Need some help?";
  } catch (error) {
    console.error("Groq API Error:", error);
    return "Are you stuck? I'm having trouble connecting to the network to give you a hint.";
  }
};

export const generateEvaluatorReport = async (
  labStateSummary: string,
  userScore: number,
  userSubmittedValue: number,
  trueValue: number
): Promise<string> => {
  if (!groq) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return "Mock Evaluation: You did a great job, but your pacing was a bit rushed near the endpoint. Remember to use drop-by-drop addition when approaching the color change!";
  }

  const systemPrompt = `You are the Hydro Evaluator, a strict but fair chemistry professor auditing a student's water analysis experiment.
The student has just submitted their logbook in Assessment Mode.
Here is the data from their session:
Lab State Audit: ${labStateSummary}
Final Numeric Score (calculated by system): ${userScore}/100
Student's Submitted Value: ${userSubmittedValue}
True Chemical Value: ${trueValue}

Your task: Write a short, single-paragraph personalized feedback report (about 3-4 sentences). 
- If their score is high, praise their accuracy but find one minor technique to critique (like pacing or swirling).
- If their score is low, explain politely why they failed (e.g. overshot the endpoint, didn't read the meniscus correctly).
- Do not greet them, just provide the feedback paragraph directly.`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt }
      ],
      model: 'openai/gpt-oss-120b',
      temperature: 0.3,
      max_tokens: 200,
    });

    return chatCompletion.choices[0]?.message?.content || "Evaluation completed.";
  } catch (error) {
    console.error("Groq API Error:", error);
    return "Audit complete. Unable to generate personalized feedback due to network error.";
  }
};


