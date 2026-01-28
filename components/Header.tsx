
import React from 'react';
import { AppView } from '../types';

interface HeaderProps {
  activeView: AppView;
}

const Header: React.FC<HeaderProps> = ({ activeView }) => {
  const getTitle = () => {
    switch (activeView) {
      case AppView.CHAT: return 'Symptom Assistant';
      case AppView.LIVE: return 'Live Consultation';
      case AppView.DASHBOARD: return 'Health Dashboard';
      case AppView.HISTORY: return 'Session History';
      default: return 'MediGenie AI';
    }
  };

  return (
    <header className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white md:hidden">
          <i className="fas fa-heartbeat"></i>
        </div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">{getTitle()}</h1>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
          <i className="far fa-bell text-xl"></i>
        </button>
        <div className="w-10 h-10 rounded-full border-2 border-slate-200 overflow-hidden cursor-pointer hover:border-blue-400 transition-colors">
          <img src="https://picsum.photos/seed/doctor/40/40" alt="Profile" />
        </div>
      </div>
    </header>
  );
};

export default Header;
