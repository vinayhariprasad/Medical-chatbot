
import React from 'react';
import { AppView } from '../types';

interface SidebarProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange }) => {
  const menuItems = [
    { id: AppView.DASHBOARD, label: 'Overview', icon: 'fa-grid-2' },
    { id: AppView.CHAT, label: 'Symptom Chat', icon: 'fa-comment-medical' },
    { id: AppView.LIVE, label: 'Live Assist', icon: 'fa-waveform-lines' },
    { id: AppView.HISTORY, label: 'Logs', icon: 'fa-rectangle-list' },
  ];

  return (
    <div className="h-full bg-white flex flex-col border-r border-slate-100">
      <div className="p-8">
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="w-12 h-12 rounded-[1.25rem] medical-gradient flex items-center justify-center text-white shadow-xl shadow-blue-200 transition-transform group-hover:scale-105">
            <i className="fas fa-heartbeat text-2xl"></i>
          </div>
          <div>
            <span className="text-xl font-black text-slate-900 tracking-tighter block leading-none">MediGenie</span>
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Enterprise AI</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1.5">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${
              activeView === item.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 font-bold' 
                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900 font-semibold'
            }`}
          >
            <i className={`fas ${item.icon} text-lg w-6 flex justify-center ${activeView === item.id ? 'text-white' : 'opacity-40 group-hover:opacity-100'}`}></i>
            <span className="text-sm">{item.label}</span>
            {activeView === item.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-sm"></div>}
          </button>
        ))}
      </nav>

      <div className="p-6">
        <div className="bg-slate-900 rounded-[2rem] p-6 text-white relative overflow-hidden group">
          <div className="relative z-10">
            <h4 className="font-black text-sm mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Emergency
            </h4>
            <p className="text-slate-400 text-[10px] mb-4 font-medium leading-relaxed">If your symptoms are severe, don't wait for AI. Get help now.</p>
            <a href="tel:911" className="flex items-center justify-center gap-2 w-full py-3 bg-red-500 text-white rounded-xl font-black text-xs hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-red-900/20">
              <i className="fas fa-phone"></i> CALL 911
            </a>
          </div>
          <i className="fas fa-hospital-user absolute -right-6 -bottom-6 text-white/5 text-8xl group-hover:scale-110 transition-transform duration-700"></i>
        </div>
        
        <div className="mt-8 flex items-center justify-center gap-4 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-help">
             <i className="fab fa-apple text-xl"></i>
             <i className="fab fa-google-play text-xl"></i>
             <i className="fas fa-shield-halved text-xl"></i>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
