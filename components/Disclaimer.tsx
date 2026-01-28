
import React from 'react';

interface DisclaimerProps {
  onAccept: () => void;
}

const Disclaimer: React.FC<DisclaimerProps> = ({ onAccept }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 md:p-12 max-w-2xl w-full shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-8 mx-auto text-3xl">
          <i className="fas fa-triangle-exclamation"></i>
        </div>
        
        <h1 className="text-3xl font-bold text-slate-900 text-center mb-6">Medical Disclaimer</h1>
        
        <div className="space-y-4 text-slate-600 text-sm md:text-base leading-relaxed mb-8 max-h-[40vh] overflow-y-auto pr-2">
          <p className="font-bold text-slate-900">MediGenie AI is for informational and educational purposes only.</p>
          <p>This application utilizes advanced Artificial Intelligence (Gemini) to provide health information. It is NOT a substitute for professional medical advice, diagnosis, or treatment.</p>
          <p>Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.</p>
          <p>Never disregard professional medical advice or delay in seeking it because of something you have read on this application.</p>
          <p className="bg-red-50 p-4 rounded-xl border border-red-100 text-red-800 font-medium italic">
            IF YOU ARE EXPERIENCING A MEDICAL EMERGENCY, CALL YOUR LOCAL EMERGENCY SERVICES (E.G., 911) IMMEDIATELY.
          </p>
        </div>

        <button 
          onClick={onAccept}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-200 transition-all active:scale-95"
        >
          I UNDERSTAND AND AGREE
        </button>
      </div>
    </div>
  );
};

export default Disclaimer;
