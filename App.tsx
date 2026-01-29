
import React, { useState, useEffect } from 'react';
import { AppView } from './types';
import Header from './components/Header';
import ChatInterface from './components/ChatInterface';
import LiveInterface from './components/LiveInterface';
import MedicalDashboard from './components/MedicalDashboard';
import Sidebar from './components/Sidebar';
import Disclaimer from './components/Disclaimer';
import MedicalHistory from './components/MedicalHistory';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<AppView>(AppView.DASHBOARD);
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('medigenie_disclaimer_accepted');
    if (accepted === 'true') {
      setHasAcceptedDisclaimer(true);
    }
  }, []);

  const handleAcceptDisclaimer = () => {
    localStorage.setItem('medigenie_disclaimer_accepted', 'true');
    setHasAcceptedDisclaimer(true);
  };

  const renderView = () => {
    switch (activeView) {
      case AppView.CHAT:
        return <ChatInterface />;
      case AppView.LIVE:
        return <LiveInterface />;
      case AppView.DASHBOARD:
        return <MedicalDashboard />;
      case AppView.HISTORY:
        return <MedicalHistory />;
      default:
        return <MedicalDashboard />;
    }
  };

  if (!hasAcceptedDisclaimer) {
    return <Disclaimer onAccept={handleAcceptDisclaimer} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar - Hidden on mobile, visible on medium+ */}
      <div className="hidden md:block w-64 h-full border-r border-slate-200">
        <Sidebar activeView={activeView} onViewChange={setActiveView} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header activeView={activeView} />
        <main className="flex-1 overflow-y-auto relative">
          {renderView()}
        </main>
        
        {/* Mobile Navigation Bar */}
        <div className="md:hidden glass-effect border-t border-slate-200 p-2 flex justify-around items-center sticky bottom-0 z-30">
          <button 
            onClick={() => setActiveView(AppView.DASHBOARD)}
            className={`flex flex-col items-center p-2 rounded-lg ${activeView === AppView.DASHBOARD ? 'text-blue-600' : 'text-slate-400'}`}
          >
            <i className="fas fa-chart-line text-lg"></i>
            <span className="text-[10px] mt-1 font-medium">Stats</span>
          </button>
          <button 
            onClick={() => setActiveView(AppView.CHAT)}
            className={`flex flex-col items-center p-2 rounded-lg ${activeView === AppView.CHAT ? 'text-blue-600' : 'text-slate-400'}`}
          >
            <i className="fas fa-comment-medical text-lg"></i>
            <span className="text-[10px] mt-1 font-medium">Chat</span>
          </button>
          <button 
            onClick={() => setActiveView(AppView.LIVE)}
            className={`flex flex-col items-center p-2 rounded-lg ${activeView === AppView.LIVE ? 'text-blue-600' : 'text-slate-400'}`}
          >
            <i className="fas fa-microphone-lines text-lg"></i>
            <span className="text-[10px] mt-1 font-medium">Live</span>
          </button>
          <button 
            onClick={() => setActiveView(AppView.HISTORY)}
            className={`flex flex-col items-center p-2 rounded-lg ${activeView === AppView.HISTORY ? 'text-blue-600' : 'text-slate-400'}`}
          >
            <i className="fas fa-history text-lg"></i>
            <span className="text-[10px] mt-1 font-medium">History</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
