
import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { chatWithSearch, analyzeSymptomImage } from '../services/geminiService';

const STORAGE_KEY = 'medigenie_chat_history';

const MessageRenderer: React.FC<{ content: string; role: 'user' | 'model' }> = ({ content, role }) => {
  if (role === 'user') return <div className="whitespace-pre-wrap font-medium">{content}</div>;

  const sections = content.split(/(?=### )/);

  return (
    <div className="space-y-5">
      {sections.map((section, idx) => {
        const isHeader = section.startsWith('###');
        const title = isHeader ? section.split('\n')[0].replace('### ', '') : '';
        const body = isHeader ? section.split('\n').slice(1).join('\n') : section;

        if (title.includes('BLOOD WORK OVERVIEW') || title.includes('BIOMARKER ANALYSIS')) {
          return (
            <div key={idx} className="bg-blue-50 border border-blue-100 rounded-2xl p-5 shadow-sm border-l-4 border-l-blue-600">
              <div className="flex items-center gap-2 mb-3 text-blue-700 font-bold uppercase tracking-wider text-xs">
                <i className="fas fa-microscope text-blue-500"></i>
                {title}
              </div>
              <div className="text-slate-800 text-sm leading-relaxed overflow-x-auto">
                {body.split('\n').filter(l => l.trim()).map((line, lIdx) => (
                  <div key={lIdx} className="py-1.5 border-b border-blue-100/50 last:border-0 font-mono text-[13px]">
                    {line.startsWith('- ') || line.startsWith('* ') ? line.substring(2) : line}
                  </div>
                ))}
              </div>
            </div>
          );
        }

        if (title.includes('FINDINGS & ANOMALIES')) {
          return (
            <div key={idx} className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm border-l-4 border-l-amber-600">
              <div className="flex items-center gap-2 mb-3 text-amber-800 font-bold uppercase tracking-wider text-xs">
                <i className="fas fa-vial-circle-check text-amber-600"></i>
                {title}
              </div>
              <div className="text-amber-900 text-sm font-semibold leading-relaxed">
                {body}
              </div>
            </div>
          );
        }

        if (title.includes('VISUAL OBSERVATIONS')) {
          return (
            <div key={idx} className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 shadow-sm border-l-4 border-l-indigo-500">
              <div className="flex items-center gap-2 mb-3 text-indigo-700 font-bold uppercase tracking-wider text-xs">
                <i className="fas fa-eye text-indigo-500"></i>
                {title}
              </div>
              <div className="text-indigo-900 text-sm leading-relaxed">
                {body.split('\n').filter(l => l.trim()).map((line, lIdx) => (
                  <p key={lIdx} className="mb-1">{line}</p>
                ))}
              </div>
            </div>
          );
        }

        if (title.includes('MILD OTC SUGGESTIONS')) {
          return (
            <div key={idx} className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 shadow-sm border-l-4 border-l-emerald-500">
              <div className="flex items-center gap-2 mb-3 text-emerald-700 font-bold uppercase tracking-wider text-xs">
                <i className="fas fa-pills text-emerald-500"></i>
                {title}
              </div>
              <div className="text-emerald-900 text-sm leading-relaxed">
                {body}
                <div className="mt-4 p-3 bg-white/50 rounded-xl border border-emerald-200/50 text-[10px] text-emerald-600 font-bold italic uppercase tracking-tighter">
                  Caution: Consult a pharmacist before use.
                </div>
              </div>
            </div>
          );
        }

        if (title.includes('EMERGENCY') || title.includes('WARNINGS')) {
          return (
            <div key={idx} className="bg-rose-50 border border-rose-200 rounded-2xl p-5 shadow-md border-l-4 border-l-rose-600">
              <div className="flex items-center gap-2 mb-3 text-rose-700 font-black uppercase tracking-wider text-xs">
                <i className="fas fa-exclamation-triangle text-rose-600"></i>
                {title}
              </div>
              <div className="text-rose-950 text-sm font-bold leading-relaxed">{body}</div>
            </div>
          );
        }

        return (
          <div key={idx} className="text-slate-700 text-base leading-relaxed">
            {isHeader && <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2 text-sm uppercase tracking-widest">{title}</h4>}
            <div className="whitespace-pre-wrap">{body}</div>
          </div>
        );
      })}
    </div>
  );
};

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysisMode, setAnalysisMode] = useState<'symptom' | 'blood' | 'chat'>('chat');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => scrollToBottom(), [messages]);
  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)), [messages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const triggerUpload = (mode: 'symptom' | 'blood') => {
    setAnalysisMode(mode);
    fileInputRef.current?.click();
  };

  const handleSend = async (overridePrompt?: string) => {
    const textToSend = overridePrompt || input;
    if (!textToSend.trim() && !selectedImage) return;

    const userMessage: Message = {
      role: 'user',
      content: textToSend || (analysisMode === 'blood' ? "Analyzing blood results..." : "Analyzing visual symptoms..."),
      image: selectedImage || undefined,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      let response;
      if (selectedImage) {
        const base64 = selectedImage.split(',')[1];
        const result = await analyzeSymptomImage(textToSend, base64, analysisMode === 'blood' ? 'blood' : 'symptom');
        response = { text: result.text, sources: result.sources };
        setSelectedImage(null);
        setAnalysisMode('chat');
      } else {
        response = await chatWithSearch(textToSend, messages);
      }

      setMessages((prev) => [...prev, {
        role: 'model',
        content: response.text,
        sources: response.sources,
        timestamp: new Date().toISOString(),
      }]);
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.message || "";
      
      if (errorMsg.includes("Requested entity was not found") && window.aistudio) {
          window.aistudio.openSelectKey();
      }

      setMessages((prev) => [...prev, {
        role: 'model',
        content: "### ⚠️ CONNECTION RESET\nYour Clinical Key session has expired or the model tool configuration was invalid. Please re-select your key or try again.\n\n" + (errorMsg || "Unknown diagnostic error."),
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#fcfdfe]">
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-10 max-w-5xl mx-auto w-full">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center py-12 animate-in fade-in zoom-in duration-700">
            <div className="w-28 h-28 medical-gradient text-white rounded-[2.5rem] flex items-center justify-center mb-10 text-4xl shadow-2xl shadow-blue-300/40">
              <i className="fas fa-user-md"></i>
            </div>
            <h2 className="text-5xl font-black text-slate-900 mb-6 tracking-tighter">Clinical Intelligence <span className="text-blue-600">Elite</span></h2>
            <p className="text-slate-500 max-w-xl mb-12 text-xl leading-relaxed font-medium">
              Precision health analysis for symptoms and laboratory results. Powered by 2.5 & 3.0 Series Intelligence.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl px-4">
              {[
                { label: "Analyze Blood Results", sub: "Scan Lab Reports", icon: "fa-vial", color: "text-blue-600", action: () => triggerUpload('blood') },
                { label: "Scan Symptom Photo", sub: "Analyze Rash or Cuts", icon: "fa-camera-viewfinder", color: "text-indigo-600", action: () => triggerUpload('symptom') },
                { label: "Find 24/7 Pharmacy", sub: "Locate Nearby Stores", icon: "fa-map-location-dot", color: "text-emerald-600", action: () => handleSend("Find 24/7 pharmacies near me") },
                { label: "Emergency Help", sub: "Instant Hospital Search", icon: "fa-truck-medical", color: "text-rose-600", action: () => handleSend("Emergency rooms near me") }
              ].map(chip => (
                <button 
                  key={chip.label}
                  onClick={chip.action}
                  className="p-6 bg-white border border-slate-100 rounded-3xl text-left shadow-sm hover:shadow-2xl hover:border-blue-300 transition-all group flex items-start gap-4 active:scale-95"
                >
                  <div className={`w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center ${chip.color} text-xl group-hover:scale-110 transition-transform shadow-inner`}>
                    <i className={`fas ${chip.icon}`}></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{chip.label}</h4>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest opacity-70">{chip.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} message-in`}>
            <div className={`max-w-[95%] md:max-w-[85%] ${
              msg.role === 'user' 
                ? 'bg-slate-900 text-white shadow-xl rounded-t-[2rem] rounded-bl-[2.5rem] rounded-br-lg p-6' 
                : 'bg-white text-slate-800 border border-slate-100 shadow-2xl shadow-slate-200/40 rounded-t-[2.5rem] rounded-br-[2.5rem] rounded-bl-lg p-8'
            }`}>
              {msg.image && (
                <div className="mb-6 rounded-3xl overflow-hidden border-4 border-slate-50 shadow-2xl group relative">
                  <img src={msg.image} alt="Evidence" className="max-h-96 w-full object-cover" />
                  <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    Clinical Data Node
                  </div>
                </div>
              )}
              <MessageRenderer content={msg.content} role={msg.role} />
              <div className={`mt-4 text-[10px] font-black uppercase tracking-[0.2em] ${msg.role === 'user' ? 'text-slate-500' : 'text-slate-300'}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Clinical Signature
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-2xl shadow-slate-100 flex items-center gap-6">
              <div className="relative w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs animate-pulse">
                  <i className="fas fa-microscope"></i>
              </div>
              <div>
                <span className="text-sm font-black text-slate-700 uppercase tracking-[0.3em] block">Diagnostic Core Active</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Processing medical documentation...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-8 bg-white/90 backdrop-blur-2xl border-t border-slate-100 sticky bottom-0 z-20">
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          <div className="flex items-center gap-4">
             <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
             <div className="flex gap-2">
                <button onClick={() => triggerUpload('symptom')} className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-lg transition-all flex items-center justify-center text-lg shadow-inner">
                  <i className="fas fa-camera"></i>
                </button>
                <button onClick={() => triggerUpload('blood')} className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-lg transition-all flex items-center justify-center text-lg shadow-inner">
                  <i className="fas fa-vial"></i>
                </button>
             </div>
             
             <div className="flex-1 relative flex items-center">
                <input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={selectedImage ? (analysisMode === 'blood' ? "Any specific concerns about these results?" : "Describe the symptom's sensation...") : "Message MediGenie..."}
                  className="w-full h-14 pl-8 pr-16 rounded-[1.5rem] bg-slate-50 border-none focus:ring-4 focus:ring-blue-500/10 text-lg font-semibold outline-none transition-all placeholder:text-slate-300 shadow-inner"
                />
                <button 
                  onClick={() => handleSend()}
                  disabled={(!input.trim() && !selectedImage) || isLoading}
                  className="absolute right-3 w-10 h-10 rounded-xl bg-blue-600 text-white shadow-xl hover:scale-110 active:scale-95 disabled:opacity-50"
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
             </div>
          </div>
          
          {selectedImage && (
            <div className="flex items-center gap-5 p-4 bg-indigo-50/50 rounded-[2rem] border border-indigo-100 animate-in slide-in-from-bottom-4 shadow-sm">
               <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border-4 border-white shadow-lg">
                  <img src={selectedImage} className="w-full h-full object-cover" />
               </div>
               <div>
                  <h5 className="font-black text-indigo-900 text-sm tracking-tight">{analysisMode === 'blood' ? 'Blood Report Attached' : 'Symptom Snapshot Attached'}</h5>
                  <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-[0.2em] mt-1">Diagnostic Vision Pipeline Ready</p>
               </div>
               <button onClick={() => setSelectedImage(null)} className="ml-auto w-10 h-10 flex items-center justify-center text-rose-300 hover:text-rose-600 transition-colors bg-white rounded-xl shadow-sm border border-slate-100">
                  <i className="fas fa-times"></i>
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
