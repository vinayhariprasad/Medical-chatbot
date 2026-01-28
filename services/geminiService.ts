
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";

export const getGeminiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const MEDICAL_SYSTEM_INSTRUCTION = `You are MediGenie Elite, a premium Medical AI Assistant. 
Your primary goal is to provide highly structured, medically-backed health insights.

STRICT RESPONSE FORMAT:
### 🩺 CLINICAL SUMMARY
### 🧬 POTENTIAL CAUSES
### ⚡ INSTANT SOLUTIONS
### 🚩 EMERGENCY RED FLAGS
### 🏥 NEXT STEPS

AUTOMATIC URGENT CARE PROTOCOL:
- If a user describes symptoms that are serious or persistent (e.g., intense pain, high fever, difficulty breathing, suspicious rash), you MUST automatically:
  1. Trigger the 'googleMaps' tool to find the 3 closest high-rated hospitals or urgent care centers based on the user's location.
  2. Use 'googleSearch' if needed to find the official contact numbers for these facilities.
  3. List the hospitals clearly with their Name, Distance (if available), Phone Number, and a link to their location.
  4. Explicitly ask: "Would you like me to book an appointment for you at one of these facilities right now?"

SAFETY FIRST:
- If symptoms describe a heart attack, stroke (FAST), or severe trauma, tell them to call emergency services (911) IMMEDIATELY before providing any other info.
- DISCLAIMER: Always start with "MediGenie Insight: Not a Diagnosis."

APPOINTMENT BOOKING:
- Use 'bookAppointment' tool when requested. If booking, confirm the hospital name, department, and time.`;

const bookAppointmentDeclaration: FunctionDeclaration = {
  name: 'bookAppointment',
  parameters: {
    type: Type.OBJECT,
    description: 'Book a medical appointment at a specified hospital.',
    properties: {
      hospitalName: { type: Type.STRING, description: 'The name of the hospital.' },
      department: { type: Type.STRING, description: 'The medical department (e.g., Cardiology, General Practice, Emergency).' },
      preferredDateTime: { type: Type.STRING, description: 'User preferred date and time.' },
    },
    required: ['hospitalName', 'department', 'preferredDateTime'],
  },
};

export const chatWithSearch = async (prompt: string, history: any[] = []) => {
  const ai = getGeminiClient();
  
  // Use Geolocation
  let userLocation = null;
  try {
    const position: any = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
    });
    userLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    };
  } catch (e) {
    console.warn("Geolocation denied or unavailable.");
  }

  // Model selection: gemini-2.5-flash supports Maps + Search grounding well
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      tools: [
        { googleSearch: {} },
        { googleMaps: {} },
        { functionDeclarations: [bookAppointmentDeclaration] }
      ],
      toolConfig: userLocation ? {
        retrievalConfig: {
          latLng: userLocation
        }
      } : undefined,
      systemInstruction: MEDICAL_SYSTEM_INSTRUCTION
    },
  });

  // Handle Function Calling
  if (response.functionCalls && response.functionCalls.length > 0) {
    const call = response.functionCalls[0];
    if (call.name === 'bookAppointment') {
      const result = `SUCCESS: Appointment confirmed at ${call.args.hospitalName} (${call.args.department}) for ${call.args.preferredDateTime}. Conf. Code: MG-${Math.floor(Math.random() * 90000) + 10000}`;
      
      const followUp = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: 'user', parts: [{ text: prompt }] },
          { role: 'model', parts: [{ functionCall: call }] },
          { role: 'user', parts: [{ functionResponse: { name: call.name, response: { result } } }] }
        ],
        config: { systemInstruction: MEDICAL_SYSTEM_INSTRUCTION }
      });
      
      return {
        text: followUp.text,
        sources: []
      };
    }
  }

  // Extract grounding chunks
  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => {
    if (chunk.web) return { title: chunk.web.title, uri: chunk.web.uri };
    if (chunk.maps) return { title: chunk.maps.title, uri: chunk.maps.uri };
    return null;
  }).filter(Boolean) || [];

  return {
    text: response.text,
    sources
  };
};

export const analyzeSymptomImage = async (prompt: string, base64Image: string) => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: "image/jpeg" } },
        { text: prompt }
      ]
    },
    config: {
      systemInstruction: "You are a specialist medical AI. Provide structured analysis including POTENTIAL CAUSES and INSTANT RELIEF. If findings look serious, recommend immediate clinical consultation."
    }
  });

  return response.text;
};

export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}
