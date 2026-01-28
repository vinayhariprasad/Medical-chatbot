
import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { chatWithSearch, analyzeSymptomImage } from '../services/geminiService';

const MessageRenderer: React.FC<{ content: string; role: 'user' | 'model' }> = ({ content, role }) => {
  if (role === 'user') return <div className="whitespace-pre-wrap font-medium">{content}</div>;

  // Split content by headers
  const sections = content.split(/(?=### )/);

  return (
    <div className="space-y-5">
      {sections.map((section, idx) => {
        const isHeader = section.startsWith('###');
        const title = isHeader ? section.split('\n')[0].replace('### ', '') : '';
        const body = isHeader ? section.split('\n').slice(1).join('\n') : section;

        // Custom styling for specific medical sections
        if (title.includes('INSTANT SOLUTIONS')) {
          return (
            <div key={idx} className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 shadow-sm border-l-4 border-l-emerald-500 transition-all hover:bg-emerald-100/50">
              <div className="flex items-center gap-2 mb-3 text-emerald-700 font-bold uppercase tracking-wider text-xs">
                <i className="fas fa-hand-holding-medical text-emerald-500"></i>
                {title}
              </div>
              <div className="text-emerald-900 text-sm leading-relaxed prose prose-emerald prose-sm max-w-none">
                {body.split('\n').filter(l => l.trim()).map((line, lIdx) => (
                  <p key={lIdx} className="mb-1">{line}</p>
                ))}
              </div>
            </div>
          );
        }

        if (title.includes('POTENTIAL CAUSES')) {
          return (
            <div key={idx} className="bg-blue-50 border border-blue-100 rounded-2xl p-5 shadow-sm border-l-4 border-l-blue-500">
              <div className="flex items-center gap-2 mb-3 text-blue-700 font-bold uppercase tracking-wider text-xs">
                <i className="fas fa-microscope text-blue-500"></i>
                {title}
              </div>
              <div className="text-blue-900 text-sm leading-relaxed">
                {body.split('\n').filter(l => l.trim()).map((line, lIdx) => (
                  <p key={lIdx} className="mb-1">{line}</p>
                ))}
              </div>
            </div>
          );
        }

        if (title.includes('EMERGENCY')) {
          return (
            <div key={idx} className="bg-rose-50 border border-rose-200 rounded-2xl p-5 shadow-md border-l-4 border-l-rose-600 animate-pulse-slow">
              <div className="flex items-center gap-2 mb-3 text-rose-700 font-black uppercase tracking-wider text-xs">
                <i className="fas fa-exclamation-triangle text-rose-600"></i>
                {title}
              </div>
              <div className="text-rose-950 text-sm font-bold leading-relaxed">
                {body}
              </div>
            </div>
          );
        }

        if (title.includes('NEXT STEPS') || section.includes('hospital') || section.includes('appointment')) {
          return (
            <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm">
               {isHeader && (
                <div className="flex items-center gap-2 mb-3 text-slate-700 font-bold uppercase tracking-wider text-xs">
                  <i className="fas fa-hospital-user text-blue-600"></i>
                  {title}
                </div>
               )}
               <div className="text-slate-800 text-sm leading-relaxed">
                  {body.split('\n').map((line, lIdx) => (
                    <p key={lIdx} className="mb-1">{line}</p>
                  ))}
               </div>
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => scrollToBottom(), [messages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (overridePrompt?: string) => {
    const textToSend = overridePrompt || input;
    if (!textToSend.trim() && !selectedImage) return;

    const userMessage: Message = {
      role: 'user',
      content: textToSend,
      image: selectedImage || undefined,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      let response;
      if (selectedImage) {
        const base64 = selectedImage.split(',')[1];
        const text = await analyzeSymptomImage(textToSend || "Analyze this image and suggest hospitals if serious.", base64);
        response = { text, sources: [] };
        setSelectedImage(null);
      } else {
        response = await chatWithSearch(textToSend, messages);
      }

      setMessages((prev) => [...prev, {
        role: 'model',
        content: response.text,
        sources: response.sources,
        timestamp: new Date(),
      }]);
    } catch (error) {
      setMessages((prev) => [...prev, {
        role: 'model',
        content: "### ⚠️ CONNECTIVITY ALERT\nI'm unable to reach the medical database. If you have severe symptoms, please visit the nearest hospital immediately.",
        timestamp: new Date(),
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
              Immediate symptom analysis, local hospital scouting, and appointment booking. Secure and precise.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl px-4">
              {[
                { label: "Emergency Near Me", sub: "Instant Hospital Search", icon: "fa-truck-medical", color: "text-rose-600" },
                { label: "Book Appointment", sub: "Confirm at Local Clinic", icon: "fa-clock", color: "text-emerald-600" },
                { label: "Chest Tightness", sub: "Priority Severity Check", icon: "fa-heart-pulse", color: "text-orange-600" },
                { label: "Identify Rash", sub: "Upload & Analyze", icon: "fa-camera-retro", color: "text-indigo-600" }
              ].map(chip => (
                <button 
                  key={chip.label}
                  onClick={() => handleSend(chip.label)}
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
                  <img src={msg.image} alt="Symptom" className="max-h-96 w-full object-cover transition-transform group-hover:scale-105" />
                  <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">Symptom Evidence</div>
                </div>
              )}
              <MessageRenderer content={msg.content} role={msg.role} />
              
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-8 pt-6 border-t border-slate-50">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] block mb-4">Location & Documentation Nodes</span>
                  <div className="flex flex-wrap gap-2">
                    {msg.sources.map((source, sIdx) => (
                      <a key={sIdx} href={source.uri} target="_blank" rel="noopener noreferrer" className="text-[11px] bg-slate-50 text-slate-600 px-5 py-2.5 rounded-2xl border border-slate-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all font-bold flex items-center gap-2 group">
                        <i className={source.uri.includes('maps') ? "fas fa-directions text-rose-500 group-hover:text-white" : "fas fa-link"}></i>
                        {source.title.length > 35 ? source.title.substring(0, 35) + '...' : source.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              <div className={`mt-4 text-[10px] font-black uppercase tracking-[0.2em] ${msg.role === 'user' ? 'text-slate-500' : 'text-slate-300'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Secure Clinical Handshake
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-2xl shadow-slate-100 flex items-center gap-6">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 bg-blue-500 rounded-full opacity-20 animate-ping"></div>
                <div className="relative w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">
                    <i className="fas fa-network-wired animate-pulse"></i>
                </div>
              </div>
              <div>
                <span className="text-sm font-black text-slate-700 uppercase tracking-[0.3em] block">Co-Pilot Reasoning</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scouting nearby hospitals...</span>
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
             <button onClick={() => fileInputRef.current?.click()} className="w-16 h-16 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-2xl rounded-2xl transition-all flex items-center justify-center text-xl shrink-0 group">
                <i className="fas fa-camera-viewfinder group-hover:scale-110 transition-transform"></i>
             </button>
             
             <div className="flex-1 relative flex items-center">
                <input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Describe your symptoms or ask to book..."
                  className="w-full h-16 pl-8 pr-16 rounded-[1.75rem] bg-slate-50 border-none focus:ring-4 focus:ring-blue-500/10 text-lg font-semibold outline-none transition-all placeholder:text-slate-300 shadow-inner"
                />
                <button 
                  onClick={() => handleSend()}
                  disabled={(!input.trim() && !selectedImage) || isLoading}
                  className={`absolute right-3 w-10 h-10 rounded-xl transition-all flex items-center justify-center ${
                    (!input.trim() && !selectedImage) || isLoading ? 'text-slate-200' : 'bg-blue-600 text-white shadow-xl shadow-blue-200 hover:scale-110 active:scale-95'
                  }`}
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
             </div>
          </div>
          
          {selectedImage && (
            <div className="flex items-center gap-5 p-4 bg-blue-50/50 rounded-[2rem] border border-blue-100 animate-in slide-in-from-bottom-4 shadow-sm">
               <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-4 border-white shadow-lg">
                  <img src={selectedImage} className="w-full h-full object-cover" />
               </div>
               <div>
                  <h5 className="font-black text-blue-900 text-sm tracking-tight">Clinical Evidence Loaded</h5>
                  <p className="text-[11px] text-blue-600 font-bold uppercase tracking-[0.2em] mt-1">Multi-modal analysis ready</p>
               </div>
               <button onClick={() => setSelectedImage(null)} className="ml-auto w-12 h-12 flex items-center justify-center text-blue-300 hover:text-rose-600 transition-colors bg-white rounded-2xl shadow-sm border border-slate-100 active:scale-90">
                  <i className="fas fa-trash-alt"></i>
               </button>
            </div>
          )}
          
          <div className="flex justify-between items-center px-6">
             <div className="flex items-center gap-3 text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Location Verified
             </div>
             <p className="text-[9px] text-slate-300 font-bold text-center uppercase tracking-[0.4em] italic opacity-60">
                Hospital Network Synchronized
             </p>
             <div className="flex items-center gap-3 text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">
                Tier 1 Node <i className="fas fa-shield-halved text-blue-400"></i>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
