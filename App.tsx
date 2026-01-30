import React, { useState, useEffect } from 'react';
import { AppView } from './types';
import Header from './components/Header';
import ChatInterface from './components/ChatInterface';
import LiveInterface from './components/LiveInterface';
import MedicalDashboard from './components/MedicalDashboard';
import Sidebar from './components/Sidebar';
import Disclaimer from './components/Disclaimer';
import MedicalHistory from './components/MedicalHistory';

// Use type assertion instead of redeclaring global interface to avoid conflicts with existing definitions
const App: React.FC = () => {
  const [activeView, setActiveView] = useState<AppView>(AppView.DASHBOARD);
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(false);
  const [isKeySelected, setIsKeySelected] = useState(true);

  useEffect(() => {
    const checkKey = async () => {
      // Cast window to any to access pre-configured aistudio object
      const aistudio = (window as any).aistudio;
      if (aistudio) {
        const hasKey = await aistudio.hasSelectedApiKey();
        setIsKeySelected(hasKey);
      }
    };
    checkKey();

    const accepted = localStorage.getItem('medigenie_disclaimer_accepted');
    if (accepted === 'true') {
      setHasAcceptedDisclaimer(true);
    }
  }, []);

  const handleSelectKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      await aistudio.openSelectKey();
      setIsKeySelected(true);
    }
  };

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

  if (!isKeySelected) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 md:p-12 max-w-xl w-full shadow-2xl text-center">
          <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-8 mx-auto text-3xl">
            <i className="fas fa-key"></i>
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-4">Clinical Protocol Required</h1>
          <p className="text-slate-500 mb-8 leading-relaxed">
            To provide medical analysis and 24/7 location services, you must select a Clinical API Key from a paid project.
            <br />
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-blue-600 font-bold underline">Learn about Billing</a>
          </p>
          <button 
            onClick={handleSelectKey}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg shadow-xl"
          >
            SELECT CLINICAL KEY
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <div className="hidden md:block w-64 h-full border-r border-slate-200">
        <Sidebar activeView={activeView} onViewChange={setActiveView} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header activeView={activeView} />
        <main className="flex-1 overflow-y-auto relative">
          {renderView()}
        </main>
        
        <div className="md:hidden glass-effect border-t border-slate-200 p-2 flex justify-around items-center sticky bottom-0 z-30">
          <button onClick={() => setActiveView(AppView.DASHBOARD)} className={`flex flex-col items-center p-2 rounded-lg ${activeView === AppView.DASHBOARD ? 'text-blue-600' : 'text-slate-400'}`}>
            <i className="fas fa-chart-line text-lg"></i>
            <span className="text-[10px] mt-1 font-medium">Stats</span>
          </button>
          <button onClick={() => setActiveView(AppView.CHAT)} className={`flex flex-col items-center p-2 rounded-lg ${activeView === AppView.CHAT ? 'text-blue-600' : 'text-slate-400'}`}>
            <i className="fas fa-comment-medical text-lg"></i>
            <span className="text-[10px] mt-1 font-medium">Chat</span>
          </button>
          <button onClick={() => setActiveView(AppView.LIVE)} className={`flex flex-col items-center p-2 rounded-lg ${activeView === AppView.LIVE ? 'text-blue-600' : 'text-slate-400'}`}>
            <i className="fas fa-microphone-lines text-lg"></i>
            <span className="text-[10px] mt-1 font-medium">Live</span>
          </button>
          <button onClick={() => setActiveView(AppView.HISTORY)} className={`flex flex-col items-center p-2 rounded-lg ${activeView === AppView.HISTORY ? 'text-blue-600' : 'text-slate-400'}`}>
            <i className="fas fa-history text-lg"></i>
            <span className="text-[10px] mt-1 font-medium">History</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;