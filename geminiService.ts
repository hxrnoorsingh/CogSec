
import { GoogleGenAI } from '@google/genai';
import { ScenarioBundle, Counterfactuals, RiskSummary } from './types';

export const runCognitiveAnalysis = async (
  scenario: ScenarioBundle,
  counterfactuals: Counterfactuals
): Promise<{ text: string; summary: RiskSummary }> => {
  // Initialize SDK inside the analysis call to ensure fresh API key context
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const envData = JSON.stringify(scenario.environment);
  const stimuliData = JSON.stringify(scenario.stimuli);
  const cognitiveLogs = JSON.stringify(scenario.telemetry.cognitive_state);
  const envLogs = JSON.stringify(scenario.telemetry.environment);
  const interactionLogs = JSON.stringify(scenario.telemetry.interaction);

  const counterfactualContext = `
    [COGNITIVE OVERRIDE: ACTIVE COUNTERFACTUAL ASSUMPTIONS]
    - REDUCE ALERT DENSITY: ${counterfactuals.reduceAlertDensity ? 'ACTIVE (Hypothesize a 75% reduction in non-critical task interruptions)' : 'INACTIVE'}
    - REMOVE URGENCY CUES: ${counterfactuals.removeUrgencyCues ? 'ACTIVE (Hypothesize a removal of high-urgency visual flags and time-pressure language)' : 'INACTIVE'}
  `;

  // System instruction defining the persona and behavioral constraints
  const systemInstruction = `
    You are the "Cognitive Threat Modeling Assistant (CTMA)".
    Your purpose is to analyze cybersecurity telemetry through the lens of cognitive science.
    Treat human cognition as the primary attack surface.

    [OUTPUT REQUIREMENTS]
    You must return two distinct parts separated by the token "===REPORT_START===".

    PART 1: JSON RISK METRICS
    Return raw JSON: {"level": "Low/Medium/High", "failureMode": "Mode Title", "mechanism": "Psychological Mechanism"}
    Note: If counterfactuals are active, the "level" should reflect the projected risk under those assumptions.

    ===REPORT_START===

    PART 2: FORENSIC NARRATIVE
    Use exactly these stage headings:
    STAGE 1: COGNITIVE RECONSTRUCTION
    STAGE 2: COGNITIVE VULNERABILITY INFERENCE
    STAGE 3: COUNTERFACTUAL REASONING
    STAGE 4: HUMAN-CENTERED SECURITY MITIGATIONS

    [INSTRUCTIONS PER STAGE]
    STAGE 1: Narrate the user's likely cognitive state progression. Focus on workload, timing, and attentional shifts. DO NOT mention biases or errors yet.
    STAGE 2: Identify active cognitive vulnerabilities (e.g., habituation, overload). Cite telemetry using tokens like [C-0], [E-1], [I-0]. Use probabilistic language (e.g., "likely," "suggests").
    STAGE 3: Reason about how the outcome would change if the counterfactual toggles were the ground truth. Compare the baseline to the hypothetical trajectory.
    STAGE 4: Propose mitigations focused on design, workflow, and training. Prefix with [DESIGN-LEVEL] or [TRAINING-LEVEL].

    [CONSTRAINTS]
    - DO NOT use markdown bold (**), italics (_), or standard markdown headers (#).
    - Use uppercase for all section titles.
    - Conclude with "REASONING LOGIC: [Explain the cognitive science principles applied in this session]".
  `;

  // Prompt containing specific simulation data
  const prompt = `
    [SIMULATION DATA BUNDLE]
    Scenario Name: ${scenario.title}
    Environment Context: ${envData}
    Active Stimuli: ${stimuliData}
    Telemetry Streams:
    - Cognitive Snapshots: ${cognitiveLogs}
    - Environment/System Events: ${envLogs}
    - Interaction/User Behavior: ${interactionLogs}

    [COUNTERFACTUAL CONTEXT]
    ${counterfactualContext}
  `;

  try {
    // Calling generateContent with Gemini 3 Pro for complex reasoning task
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.1,
        topP: 0.95,
      }
    });

    // Access .text property directly
    const fullText = response.text || "";
    let summary: RiskSummary = { level: scenario.expected_risk_level, failureMode: "Processing...", mechanism: "Analysis Pending..." };
    let narrative = "";

    const parts = fullText.split('===REPORT_START===');
    if (parts.length >= 2) {
      const jsonPart = parts[0].trim().replace(/```json|```/g, '');
      narrative = parts.slice(1).join('').trim();
      try {
        summary = JSON.parse(jsonPart.match(/\{[\s\S]*?\}/)?.[0] || jsonPart);
      } catch (e) {
        console.warn("Forensic Summary Extraction Failed", e);
      }
    } else {
      narrative = fullText.replace(/\{[\s\S]*?\}/, '').trim();
    }

    const cleanedText = narrative
      .replace(/```[a-z]*\n?/g, '')
      .replace(/```/g, '')
      .replace(/\*\*/g, '')
      .replace(/^#+\s/gm, '')
      .replace(/_/g, '')
      .trim();

    return { text: cleanedText, summary };
  } catch (error: any) {
    throw new Error(`COGNITIVE_PIPELINE_ERROR: ${error?.message || "Internal inference failure."}`);
  }
};
