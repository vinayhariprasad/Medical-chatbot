
import React, { useState, useEffect } from 'react';
import { Message, AnalysisReport } from '../types';

const MedicalHistory: React.FC = () => {
  const [reports, setReports] = useState<AnalysisReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<AnalysisReport | null>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('medigenie_chat_history');
    if (savedHistory) {
      const messages: Message[] = JSON.parse(savedHistory);
      
      // Extract structured analyses from model responses
      const extractedReports: AnalysisReport[] = messages
        .filter(msg => msg.role === 'model' && msg.content.includes('### '))
        .map((msg, index) => {
          // Extract a preview/summary from the clinical summary section
          const summaryMatch = msg.content.match(/### 🩺 CLINICAL SUMMARY\n([\s\S]*?)(?=###|$)/);
          const summary = summaryMatch ? summaryMatch[1].trim().split('\n')[0] : "Medical Analysis Report";

          return {
            id: `report-${index}`,
            date: new Date(msg.timestamp).toLocaleString(),
            summary: summary,
            fullContent: msg.content,
            image: messages[messages.indexOf(msg) - 1]?.image // Check if previous user message had an image
          };
        })
        .reverse(); // Newest first

      setReports(extractedReports);
    }
  }, []);

  if (reports.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-slate-50">
        <div className="w-24 h-24 bg-slate-200 text-slate-400 rounded-full flex items-center justify-center mb-6 text-3xl">
          <i className="fas fa-folder-open"></i>
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-2">No Reports Found</h3>
        <p className="text-slate-500 max-w-sm">Complete a symptom chat or visual analysis to generate clinical reports.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12 h-full overflow-hidden flex flex-col">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Analysis <span className="text-blue-600">History.</span></h1>
        <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">Chronological Clinical Log</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden">
        {/* Report List */}
        <div className="lg:col-span-4 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {reports.map((report) => (
            <button
              key={report.id}
              onClick={() => setSelectedReport(report)}
              className={`w-full text-left p-6 rounded-[2rem] transition-all border ${
                selectedReport?.id === report.id 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-200' 
                  : 'bg-white border-slate-100 text-slate-700 hover:border-blue-300 hover:shadow-lg'
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedReport?.id === report.id ? 'bg-white/20' : 'bg-slate-50 text-blue-600'}`}>
                  <i className="fas fa-file-waveform"></i>
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest opacity-60">
                  {report.date}
                </div>
              </div>
              <h4 className="font-bold text-sm mb-2 line-clamp-1">{report.summary}</h4>
              <p className={`text-[11px] font-medium line-clamp-2 ${selectedReport?.id === report.id ? 'text-blue-50' : 'text-slate-400'}`}>
                {report.fullContent.replace(/###/g, '').substring(0, 100)}...
              </p>
            </button>
          ))}
        </div>

        {/* Report Preview */}
        <div className="lg:col-span-8 bg-white border border-slate-100 rounded-[3rem] shadow-sm flex flex-col overflow-hidden">
          {selectedReport ? (
            <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <div>
                   <h3 className="text-xl font-black text-slate-900">Clinical Analysis Report</h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Ref ID: {selectedReport.id.toUpperCase()}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => window.print()} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all shadow-sm">
                    <i className="fas fa-print"></i>
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-10 space-y-8">
                {selectedReport.image && (
                  <div className="rounded-[2rem] overflow-hidden border-8 border-slate-50 shadow-xl max-w-sm mx-auto mb-10">
                    <img src={selectedReport.image} alt="Symptom Evidence" className="w-full" />
                  </div>
                )}
                
                <div className="prose prose-slate max-w-none">
                  {selectedReport.fullContent.split(/(?=### )/).map((section, idx) => {
                    const isHeader = section.startsWith('###');
                    const title = isHeader ? section.split('\n')[0].replace('### ', '') : '';
                    const body = isHeader ? section.split('\n').slice(1).join('\n') : section;

                    return (
                      <div key={idx} className="mb-6">
                        {isHeader && (
                          <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            {title}
                          </h4>
                        )}
                        <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap pl-3.5 border-l-2 border-slate-100 ml-0.5">
                          {body}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
                 <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    <i className="fas fa-shield-halved"></i> Verified Clinical Node
                 </div>
                 <div className="text-[10px] font-bold text-slate-400 italic">
                    Saved locally: {selectedReport.date}
                 </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-40">
              <i className="fas fa-file-signature text-6xl mb-6 text-slate-200"></i>
              <h3 className="text-xl font-bold text-slate-400">Select a report to view details</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicalHistory;
