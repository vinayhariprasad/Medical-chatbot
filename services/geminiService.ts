import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";

export const getGeminiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const MEDICAL_SYSTEM_INSTRUCTION = `You are MediGenie Elite, a premium Medical AI Assistant. 
Your primary goal is to provide highly structured, medically-backed health insights.

STRICT RESPONSE FORMAT:
### 🩺 CLINICAL SUMMARY
### 🧬 POTENTIAL CAUSES
### ⚡ INSTANT SOLUTIONS (Non-medicinal first aid)
### 💊 MILD OTC SUGGESTIONS (Safe, non-prescription options)
### 🚩 EMERGENCY RED FLAGS
### 🏥 NEXT STEPS & 24/7 PHARMACIES

MEDICATION & PHARMACY GUIDELINES:
- You may suggest mild, over-the-counter (OTC) medications only for minor symptoms.
- PROHIBITED: Never suggest prescription-only drugs.
- PHARMACY PROTOCOL: If you suggest OTC medications OR if the user asks for a pharmacy, you MUST:
  1. Trigger the 'googleMaps' tool to find the 3 closest pharmacies open 24/7 based on user location.
  2. List them clearly in the 'NEXT STEPS' section.

AUTOMATIC URGENT CARE PROTOCOL:
- If symptoms are serious, trigger 'googleMaps' for the 3 closest hospitals.

SAFETY FIRST:
- If symptoms describe a heart attack, stroke (FAST), or severe trauma, call 911 IMMEDIATELY.
- DISCLAIMER: Always start with "MediGenie Insight: Not a Diagnosis."`;

const VISUAL_ANALYSIS_INSTRUCTION = `You are a specialist in Clinical Dermatology and Wound Assessment. 
Analyze visual physical symptoms for morphology, severity, and potential causes.
Provide structured response including VISUAL OBSERVATIONS and recommended follow-up.`;

const BLOOD_ANALYSIS_INSTRUCTION = `You are a Clinical Pathologist and Hematologist. 
Your task is to analyze blood test reports (CBC, CMP, Lipid Panel, Thyroid, etc.).
1. **Identify Biomarkers**: List each test item, the user's value, and the standard reference range.
2. **Flag Anomalies**: Clearly mark values that are High (H) or Low (L).
3. **Clinical Interpretation**: Explain what these out-of-range values might indicate in plain language.
4. **Structured Response Format**:
   - ### 🧪 BLOOD WORK OVERVIEW
   - ### 📊 DETAILED BIOMARKER ANALYSIS (Itemized list)
   - ### 🔍 KEY FINDINGS & ANOMALIES
   - ### 💡 LIFESTYLE & DIETARY RECOMMENDATIONS
   - ### 🏥 RECOMMENDED MEDICAL CONSULTATION

DISCLAIMER: This is an AI-assisted analysis of laboratory data. Always review results with your doctor.`;

const bookAppointmentDeclaration: FunctionDeclaration = {
  name: 'bookAppointment',
  parameters: {
    type: Type.OBJECT,
    description: 'Book a medical appointment at a specified hospital.',
    properties: {
      hospitalName: { type: Type.STRING, description: 'The name of the hospital.' },
      department: { type: Type.STRING, description: 'The medical department.' },
      preferredDateTime: { type: Type.STRING, description: 'Preferred date and time.' },
    },
    required: ['hospitalName', 'department', 'preferredDateTime'],
  },
};

export const chatWithSearch = async (prompt: string, history: any[] = []) => {
  const ai = getGeminiClient();
  let userLocation = null;
  try {
    const position: any = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
    });
    userLocation = { latitude: position.coords.latitude, longitude: position.coords.longitude };
  } catch (e) {}

  // CRITICAL: Google Maps grounding is only supported in Gemini 2.5 series models.
  // Rule: tools: googleMaps may be used with googleSearch, but not with any other tools.
  // Removed functionDeclarations to comply with Google Maps tool constraints.
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }, { googleMaps: {} }],
      toolConfig: userLocation ? { retrievalConfig: { latLng: userLocation } } : undefined,
      systemInstruction: MEDICAL_SYSTEM_INSTRUCTION
    },
  });

  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => {
    if (chunk.web) return { title: chunk.web.title, uri: chunk.web.uri };
    if (chunk.maps) return { title: chunk.maps.title, uri: chunk.maps.uri };
    return null;
  }).filter(Boolean) || [];

  // Directly access the .text property from the response object
  return { text: response.text, sources };
};

export const analyzeSymptomImage = async (prompt: string, base64Image: string, mode: 'symptom' | 'blood' = 'symptom') => {
  const ai = getGeminiClient();
  const instruction = mode === 'blood' ? BLOOD_ANALYSIS_INSTRUCTION : VISUAL_ANALYSIS_INSTRUCTION;
  
  // Use Gemini 3 for complex data extraction (Blood), 2.5 for general visuals
  const modelToUse = mode === 'blood' ? "gemini-3-pro-image-preview" : "gemini-2.5-flash-image";

  // Rule: Upgrade to gemini-3-pro-image-preview if requesting real-time information using googleSearch.
  // Do not use googleSearch tool with gemini-2.5-flash-image.
  const tools = modelToUse === 'gemini-3-pro-image-preview' ? [{ googleSearch: {} }] : [];

  const response = await ai.models.generateContent({
    model: modelToUse,
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: "image/jpeg" } },
        { text: prompt || (mode === 'blood' ? "Analyze these blood test results." : "Analyze this physical symptom.") }
      ]
    },
    config: {
      systemInstruction: instruction,
      tools: tools
    }
  });

  const sources: any[] = [];
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (groundingChunks) {
    groundingChunks.forEach((chunk: any) => {
      if (chunk.web) sources.push({ title: chunk.web.title, uri: chunk.web.uri });
    });
  }

  // Directly access the .text property from the response object
  return { text: response.text, sources };
};

export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}