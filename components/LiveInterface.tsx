
import React, { useState, useEffect, useRef } from 'react';
import { getGeminiClient, encode, decode, decodeAudioData } from '../services/geminiService';
import { TranscriptionItem } from '../types';
import { LiveServerMessage, Modality } from '@google/genai';

const LiveInterface: React.FC = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [transcription, setTranscription] = useState<TranscriptionItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsActive(false);
    setTranscription([]);
  };

  const startSession = async () => {
    setIsConnecting(true);
    setError(null);
    setTranscription([]);

    try {
      const ai = getGeminiClient();
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: "You are MediGenie, a friendly medical voice assistant. Listen to the user's symptoms and provide empathetic advice. Keep responses concise as this is a voice conversation. Always include a disclaimer.",
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              if (!sessionRef.current) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              // Ensure session.sendRealtimeInput is called only after connection is established
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Transcription
            if (message.serverContent?.outputTranscription) {
              setTranscription(prev => [...prev, { text: message.serverContent?.outputTranscription?.text || "", role: 'model' }]);
            } else if (message.serverContent?.inputTranscription) {
              setTranscription(prev => [...prev, { text: message.serverContent?.inputTranscription?.text || "", role: 'user' }]);
            }

            // Handle Audio Output - Decoding raw PCM stream as per guidelines
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.addEventListener('ended', () => sourcesRef.current.delete(source));
              
              // Scheduling audio for gapless playback
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            setError("Connection error. Please try again.");
            stopSession();
          },
          onclose: () => stopSession(),
        },
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setError("Failed to access microphone or connect to AI.");
      setIsConnecting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white relative overflow-hidden">
      {/* Visualizer Background */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="h-full w-full flex items-center justify-center gap-1">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i} 
              className={`w-2 bg-blue-500 rounded-full transition-all duration-300 ${isActive ? 'animate-pulse' : 'h-4'}`}
              style={{ 
                height: isActive ? `${Math.random() * 80 + 10}%` : '16px',
                animationDelay: `${i * 0.1}s` 
              }}
            ></div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 z-10">
        {!isActive ? (
          <div className="text-center max-w-sm">
            <div className="w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-500/50">
              <i className="fas fa-microphone text-5xl"></i>
            </div>
            <h2 className="text-3xl font-bold mb-4">Voice Consult</h2>
            <p className="text-slate-400 mb-8 leading-relaxed">
              Speak naturally to our medical AI. Ideal for hands-free symptom descriptions.
            </p>
            {error && <div className="p-3 bg-red-500/20 text-red-300 rounded-lg mb-6 text-sm">{error}</div>}
            <button 
              onClick={startSession}
              disabled={isConnecting}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 rounded-2xl font-bold text-lg transition-all"
            >
              {isConnecting ? 'Initializing...' : 'Start Voice Chat'}
            </button>
          </div>
        ) : (
          <div className="w-full max-w-2xl h-full flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-4 p-4 mb-4 custom-scrollbar">
              {transcription.map((t, i) => (
                <div key={i} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-4 rounded-2xl max-w-[80%] ${t.role === 'user' ? 'bg-blue-600/50' : 'bg-slate-800'}`}>
                    <p className="text-sm">{t.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center py-8">
              <div className="relative inline-block">
                 <div className="absolute -inset-4 bg-red-500/20 rounded-full animate-ping"></div>
                 <button 
                  onClick={stopSession}
                  className="relative w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-xl hover:bg-red-700 transition-colors"
                >
                  <i className="fas fa-phone-slash text-2xl"></i>
                </button>
              </div>
              <p className="mt-6 text-slate-400 font-medium animate-pulse">MediGenie is listening...</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 text-center text-[10px] text-slate-500 z-10">
        End-to-end encrypted audio stream. Not recorded for privacy.
      </div>
    </div>
  );
};

export default LiveInterface;
